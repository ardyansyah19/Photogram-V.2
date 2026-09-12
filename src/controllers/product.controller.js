const Product = require('../models/Product');
const ProductMedia = require('../models/ProductMedia');

function isValidPrice(price) {
  const n = Number(price);
  return !Number.isNaN(n) && n >= 0;
}

const productController = {
  /**
   * POST /api/products
   * multipart/form-data -> field "media" (bisa banyak file) + name, price, stock, description
   */
  async createProduct(req, res) {
    try {
      const { name, description, price, stock } = req.body;
      const files = req.files;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Nama produk wajib diisi.' });
      }
      if (price === undefined || !isValidPrice(price)) {
        return res.status(400).json({ success: false, message: 'Harga produk tidak valid.' });
      }

      const product = await Product.create({
        sellerId: req.user.id,
        name: name.trim(),
        description,
        price,
        stock: stock !== undefined ? parseInt(stock) : 0,
      });

      const media = files && files.length > 0 ? await ProductMedia.insertMany(product.id, files) : [];

      return res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan.',
        data: { ...product, media },
      });
    } catch (err) {
      console.error('[createProduct]', err);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan produk.' });
    }
  },

  /**
   * GET /api/products?page=&limit=&search=
   */
  async getProducts(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = (page - 1) * limit;

      const products = await Product.list({ limit, offset, search: req.query.search });
      return res.json({ success: true, data: products, pagination: { page, limit } });
    } catch (err) {
      console.error('[getProducts]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk.' });
    }
  },

  /**
   * GET /api/products/mine  (produk milik user login, untuk dashboard toko)
   */
  async getMyProducts(req, res) {
    try {
      const products = await Product.findBySeller(req.user.id);
      return res.json({ success: true, data: products });
    } catch (err) {
      console.error('[getMyProducts]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil produk kamu.' });
    }
  },

  /**
   * GET /api/products/:id
   */
  async getProductDetail(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
      }
      const media = await ProductMedia.findByProductId(product.id);
      return res.json({ success: true, data: { ...product, media } });
    } catch (err) {
      console.error('[getProductDetail]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail produk.' });
    }
  },

  /**
   * PATCH /api/products/:id
   * body: { name?, description?, price?, stock? }
   */
  async updateProduct(req, res) {
    try {
      const { name, description, price, stock } = req.body;

      if (price !== undefined && !isValidPrice(price)) {
        return res.status(400).json({ success: false, message: 'Harga produk tidak valid.' });
      }

      const updated = await Product.update(req.params.id, req.user.id, {
        name,
        description,
        price,
        stock: stock !== undefined ? parseInt(stock) : undefined,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Produk tidak ditemukan atau kamu bukan pemiliknya.',
        });
      }

      return res.json({ success: true, message: 'Produk berhasil diperbarui.', data: updated });
    } catch (err) {
      console.error('[updateProduct]', err);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
    }
  },

  /**
   * DELETE /api/products/:id  (soft-delete / arsip)
   */
  async deleteProduct(req, res) {
    try {
      const deleted = await Product.deactivate(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Produk tidak ditemukan atau kamu bukan pemiliknya.',
        });
      }
      return res.json({ success: true, message: 'Produk berhasil dihapus.' });
    } catch (err) {
      console.error('[deleteProduct]', err);
      return res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
    }
  },
};

module.exports = productController;
