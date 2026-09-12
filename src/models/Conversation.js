const db = require('../config/database');

const Conversation = {
  /**
   * Cari conversation antara userA & userB. Kalau belum ada, buat baru.
   * Urutan userA/userB tidak masalah karena ada unique index LEAST/GREATEST.
   */
  async findOrCreateBetween(userAId, userBId) {
    const existing = await db.query(
      `SELECT * FROM conversations
       WHERE (user_one_id = $1 AND user_two_id = $2)
          OR (user_one_id = $2 AND user_two_id = $1)`,
      [userAId, userBId]
    );
    if (existing.rows[0]) return existing.rows[0];

    const created = await db.query(
      `INSERT INTO conversations (user_one_id, user_two_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userAId, userBId]
    );
    return created.rows[0];
  },

  async findById(id) {
    const result = await db.query(`SELECT * FROM conversations WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  /**
   * Cek apakah userId adalah salah satu partisipan conversation ini.
   */
  async isParticipant(conversationId, userId) {
    const result = await db.query(
      `SELECT 1 FROM conversations
       WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)`,
      [conversationId, userId]
    );
    return result.rowCount > 0;
  },

  /**
   * Daftar percakapan milik userId, dengan info lawan bicara dan
   * pesan terakhir, diurutkan dari yang paling baru aktif.
   */
  async listForUser(userId) {
    const result = await db.query(
      `SELECT
          c.id, c.updated_at,
          other.id AS other_user_id,
          other.username AS other_username,
          other.profile_photo AS other_photo,
          lm.content AS last_message_content,
          lm.message_type AS last_message_type,
          lm.sender_id AS last_message_sender_id,
          lm.created_at AS last_message_at
       FROM conversations c
       JOIN users other ON other.id = (
          CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END
       )
       LEFT JOIN LATERAL (
          SELECT content, message_type, sender_id, created_at
          FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
       ) lm ON true
       WHERE c.user_one_id = $1 OR c.user_two_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = Conversation;
