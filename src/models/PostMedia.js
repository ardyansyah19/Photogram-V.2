const db = require('../config/database');

const PostMedia = {
  async insertMany(postId, files) {
    if (!files || files.length === 0) return [];

    const values = [];
    const placeholders = files.map((file, i) => {
      const base = i * 4;
      values.push(postId, `/uploads/posts/${file.filename}`, 'image', i);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    });

    const result = await db.query(
      `INSERT INTO post_media (post_id, media_url, media_type, position)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );
    return result.rows;
  },

  async findByPostId(postId) {
    const result = await db.query(
      `SELECT * FROM post_media WHERE post_id = $1 ORDER BY position ASC`,
      [postId]
    );
    return result.rows;
  },
};

module.exports = PostMedia;
