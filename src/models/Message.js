const db = require('../config/database');

const Message = {
  /**
   * content dipakai untuk pesan teks ATAU emoji (emoji cukup unicode biasa).
   * imageUrl dipakai untuk pesan gambar. Salah satu wajib diisi -- ini
   * juga ditegakkan lewat CHECK constraint di database.
   */
  async create({ conversationId, senderId, content, imageUrl }) {
    const messageType = imageUrl ? 'image' : 'text';

    const result = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content, media_url, message_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [conversationId, senderId, content || null, imageUrl || null, messageType]
    );

    // Bikin percakapan "naik" ke atas daftar chat (updated_at berubah)
    await db.query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversationId]);

    return result.rows[0];
  },

  /**
   * Riwayat pesan, urut lama -> baru, dengan cursor pagination berbasis
   * "before" (created_at pesan paling lama yang sudah dimuat).
   */
  async findByConversation(conversationId, { limit = 30, before } = {}) {
    const params = [conversationId, limit];
    let whereClause = 'conversation_id = $1';

    if (before) {
      params.push(before);
      whereClause += ` AND created_at < $${params.length}`;
    }

    const result = await db.query(
      `SELECT * FROM (
          SELECT id, conversation_id, sender_id, content, media_url, message_type, created_at, read_at
          FROM messages
          WHERE ${whereClause}
          ORDER BY created_at DESC
          LIMIT $2
       ) sub
       ORDER BY created_at ASC`,
      params
    );
    return result.rows;
  },

  /**
   * Tandai semua pesan di conversation ini yang BUKAN dari userId sebagai
   * sudah dibaca (dipanggil saat user membuka percakapan tsb).
   */
  async markAsRead(conversationId, userId) {
    await db.query(
      `UPDATE messages
       SET read_at = now()
       WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [conversationId, userId]
    );
  },
};

module.exports = Message;
