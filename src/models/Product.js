const db = require('../config/database');

const Product = {
  async create({ sellerId, name, description, price, stock }) {
    const result = await db.query(
      `INSERT INTO products (seller_id, name, description, price, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sellerId, name, description || null, price, stock || 0]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      `SELECT p.*, u.username AS seller_username, u.profile_photo AS seller_photo
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Daftar produk untuk halaman browse marketplace, dengan pencarian
   * nama produk (opsional) dan pagination.
   */
  async list({ limit = 20, offset = 0, search } = {}) {
    const params = [limit, offset];
    let whereClause = 'p.is_active = true';

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND p.name ILIKE $${params.length}`;
    }

    const result = await db.query(
      `SELECT
          p.id, p.name, p.description, p.price, p.stock, p.created_at,
          u.id AS seller_id, u.username AS seller_username, u.profile_photo AS seller_photo,
          COALESCE(
            (SELECT media_url FROM product_media WHERE product_id = p.id ORDER BY position ASC LIMIT 1),
            NULL
          ) AS thumbnail
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    return result.rows;
  },

  async findBySeller(sellerId) {
    const result = await db.query(
      `SELECT p.*, COALESCE(
          (SELECT media_url FROM product_media WHERE product_id = p.id ORDER BY position ASC LIMIT 1),
          NULL
        ) AS thumbnail
       FROM products p
       WHERE p.seller_id = $1 AND p.is_active = true
       ORDER BY p.created_at DESC`,
      [sellerId]
    );
    return result.rows;
  },

  async update(id, sellerId, { name, description, price, stock }) {
    const result = await db.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock)
       WHERE id = $5 AND seller_id = $6
       RETURNING *`,
      [name, description, price, stock, id, sellerId]
    );
    return result.rows[0] || null;
  },

  // Soft-delete: produk tidak benar-benar dihapus, biar riwayat chat
  // marketplace terkait tetap punya referensi produk yang valid.
  async deactivate(id, sellerId) {
    const result = await db.query(
      `UPDATE products SET is_active = false
       WHERE id = $1 AND seller_id = $2
       RETURNING id`,
      [id, sellerId]
    );
    return result.rows[0] || null;
  },
};

module.exports = Product;
