const db = require('../config/database');

const Post = {
  async create({ userId, caption }) {
    const result = await db.query(
      `INSERT INTO posts (user_id, caption)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, caption || null]
    );
    return result.rows[0];
  },

  async findById(postId) {
    const result = await db.query(`SELECT * FROM posts WHERE id = $1`, [postId]);
    return result.rows[0] || null;
  },

  /**
   * Feed dengan pagination + agregasi like/comment count + status
   * "sudah di-like oleh currentUserId atau belum".
   */
  async getFeed({ limit = 10, offset = 0, currentUserId }) {
    const result = await db.query(
      `SELECT
          p.id, p.caption, p.views_count, p.is_edited, p.created_at, p.updated_at,
          u.id AS author_id, u.username AS author_username, u.profile_photo AS author_photo,
          COALESCE(lc.like_count, 0)::int AS like_count,
          COALESCE(cc.comment_count, 0)::int AS comment_count,
          EXISTS (
            SELECT 1 FROM post_likes pl
            WHERE pl.post_id = p.id AND pl.user_id = $3
          ) AS liked_by_me,
          COALESCE(
            json_agg(
              json_build_object('url', pm.media_url, 'type', pm.media_type)
              ORDER BY pm.position
            ) FILTER (WHERE pm.id IS NOT NULL), '[]'
          ) AS media
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN post_media pm ON pm.post_id = p.id
       LEFT JOIN (
          SELECT post_id, COUNT(*) AS like_count FROM post_likes GROUP BY post_id
       ) lc ON lc.post_id = p.id
       LEFT JOIN (
          SELECT post_id, COUNT(*) AS comment_count FROM post_comments GROUP BY post_id
       ) cc ON cc.post_id = p.id
       GROUP BY p.id, u.id, lc.like_count, cc.comment_count
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, currentUserId || null]
    );
    return result.rows;
  },

  async updateCaption(postId, userId, caption) {
    const result = await db.query(
      `UPDATE posts
       SET caption = $1, is_edited = true
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [caption, postId, userId]
    );
    return result.rows[0] || null;
  },

  async delete(postId, userId) {
    const result = await db.query(
      `DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [postId, userId]
    );
    return result.rows[0] || null;
  },

  async incrementViews(postId, viewerId = null) {
    await db.query(`UPDATE posts SET views_count = views_count + 1 WHERE id = $1`, [postId]);
    await db.query(
      `INSERT INTO post_views (post_id, viewer_id) VALUES ($1, $2)`,
      [postId, viewerId]
    );
  },
};

module.exports = Post;
