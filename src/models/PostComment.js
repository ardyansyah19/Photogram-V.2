const db = require('../config/database');

const PostComment = {
  async create(postId, userId, content) {
    const result = await db.query(
      `INSERT INTO post_comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, userId, content]
    );
    return result.rows[0];
  },

  async findByPostId(postId, { limit = 20, offset = 0 } = {}) {
    const result = await db.query(
      `SELECT c.id, c.content, c.created_at, c.updated_at,
              u.id AS author_id, u.username AS author_username, u.profile_photo AS author_photo
       FROM post_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );
    return result.rows;
  },

  async updateContent(commentId, userId, content) {
    const result = await db.query(
      `UPDATE post_comments
       SET content = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, commentId, userId]
    );
    return result.rows[0] || null;
  },

  async delete(commentId, userId) {
    const result = await db.query(
      `DELETE FROM post_comments WHERE id = $1 AND user_id = $2 RETURNING id`,
      [commentId, userId]
    );
    return result.rows[0] || null;
  },
};

module.exports = PostComment;
