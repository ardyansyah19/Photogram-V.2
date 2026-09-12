const db = require('../config/database');

const User = {
  async create({ username, email, passwordHash, fullName }) {
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, full_name, bio, profile_photo, created_at`,
      [username, email, passwordHash, fullName || null]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0] || null;
  },

  async findByUsername(username) {
    const result = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT id, username, email, full_name, bio, profile_photo, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async updateProfile(id, { fullName, bio }) {
    const result = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           bio = COALESCE($2, bio)
       WHERE id = $3
       RETURNING id, username, email, full_name, bio, profile_photo, created_at`,
      [fullName, bio, id]
    );
    return result.rows[0] || null;
  },

  async updateProfilePhoto(id, photoUrl) {
    const result = await db.query(
      `UPDATE users SET profile_photo = $1 WHERE id = $2
       RETURNING id, username, email, full_name, bio, profile_photo, created_at`,
      [photoUrl, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = User;
