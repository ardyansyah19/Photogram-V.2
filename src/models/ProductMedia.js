const db = require('../config/database');

const ProductMedia = {
  async insertMany(productId, files) {
    if (!files || files.length === 0) return [];

    const values = [];
    const placeholders = files.map((file, i) => {
      const base = i * 3;
      values.push(productId, `/uploads/products/${file.filename}`, i);
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    });

    const result = await db.query(
      `INSERT INTO product_media (product_id, media_url, position)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );
    return result.rows;
  },

  async findByProductId(productId) {
    const result = await db.query(
      `SELECT * FROM product_media WHERE product_id = $1 ORDER BY position ASC`,
      [productId]
    );
    return result.rows;
  },
};

module.exports = ProductMedia;
