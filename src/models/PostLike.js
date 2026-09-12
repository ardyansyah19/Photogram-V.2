const db = require('../config/database');

const PostLike = {
  async hasLiked(postId, userId) {
    const result = await db.query(
      `SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    return result.rowCount > 0;
  },

  async like(postId, userId) {
    // ON CONFLICT DO NOTHING supaya aman jika double-click / race condition
    await db.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postId, userId]
    );
    return PostLike.count(postId);
  },

  async unlike(postId, userId) {
    await db.query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
    return PostLike.count(postId);
  },

  async count(postId) {
    const result = await db.query(
      `SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1`,
      [postId]
    );
    return result.rows[0].count;
  },

  async listUsersWhoLiked(postId) {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_photo
       FROM post_likes pl
       JOIN users u ON u.id = pl.user_id
       WHERE pl.post_id = $1
       ORDER BY pl.created_at DESC`,
      [postId]
    );
    return result.rows;
  },
};

module.exports = PostLike;
