const db = require('../config/database');

const MarketplaceConversation = {
  /**
   * Cari percakapan buyer<->seller untuk productId tertentu. Kalau belum
   * ada, buat baru. sellerId diambil dari data produk itu sendiri.
   */
  async findOrCreateForProduct(productId, buyerId, sellerId) {
    const existing = await db.query(
      `SELECT * FROM marketplace_conversations WHERE product_id = $1 AND buyer_id = $2`,
      [productId, buyerId]
    );
    if (existing.rows[0]) return existing.rows[0];

    const created = await db.query(
      `INSERT INTO marketplace_conversations (product_id, buyer_id, seller_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productId, buyerId, sellerId]
    );
    return created.rows[0];
  },

  async findById(id) {
    const result = await db.query(`SELECT * FROM marketplace_conversations WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async isParticipant(conversationId, userId) {
    const result = await db.query(
      `SELECT 1 FROM marketplace_conversations
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, userId]
    );
    return result.rowCount > 0;
  },

  /**
   * Daftar percakapan marketplace milik userId (baik sebagai pembeli
   * maupun penjual), lengkap dengan info produk, lawan bicara, dan
   * pesan terakhir.
   */
  async listForUser(userId) {
    const result = await db.query(
      `SELECT
          mc.id, mc.updated_at,
          mc.product_id, p.name AS product_name,
          (SELECT media_url FROM product_media WHERE product_id = p.id ORDER BY position ASC LIMIT 1) AS product_thumbnail,
          CASE WHEN mc.buyer_id = $1 THEN 'buyer' ELSE 'seller' END AS role,
          other.id AS other_user_id,
          other.username AS other_username,
          other.profile_photo AS other_photo,
          lm.content AS last_message_content,
          lm.message_type AS last_message_type,
          lm.sender_id AS last_message_sender_id,
          lm.created_at AS last_message_at
       FROM marketplace_conversations mc
       JOIN products p ON p.id = mc.product_id
       JOIN users other ON other.id = (
          CASE WHEN mc.buyer_id = $1 THEN mc.seller_id ELSE mc.buyer_id END
       )
       LEFT JOIN LATERAL (
          SELECT content, message_type, sender_id, created_at
          FROM marketplace_messages
          WHERE conversation_id = mc.id
          ORDER BY created_at DESC
          LIMIT 1
       ) lm ON true
       WHERE mc.buyer_id = $1 OR mc.seller_id = $1
       ORDER BY mc.updated_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = MarketplaceConversation;
