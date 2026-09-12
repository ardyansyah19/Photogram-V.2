const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const User = require('../models/User');

const userController = {
  /**
   * GET /api/users?search=keyword
   * Mencari user berdasarkan username, dipakai untuk memulai chat baru.
   */
  async searchUsers(req, res) {
    try {
      const keyword = (req.query.search || '').trim();
      if (!keyword) {
        return res.json({ success: true, data: [] });
      }

      const result = await db.query(
        `SELECT id, username, full_name, profile_photo
         FROM users
         WHERE username ILIKE $1 AND id != $2
         ORDER BY username ASC
         LIMIT 10`,
        [`%${keyword}%`, req.user.id]
      );

      return res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('[searchUsers]', err);
      return res.status(500).json({ success: false, message: 'Gagal mencari user.' });
    }
  },

  /**
   * GET /api/users/:id
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }
      return res.json({ success: true, data: user });
    } catch (err) {
      console.error('[getProfile]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil profil.' });
    }
  },

  /**
   * PATCH /api/users/me
   * body: { fullName?, bio? }
   */
  async updateProfile(req, res) {
    try {
      const { fullName, bio } = req.body;
      const updated = await User.updateProfile(req.user.id, { fullName, bio });
      return res.json({ success: true, message: 'Profil berhasil diperbarui.', data: updated });
    } catch (err) {
      console.error('[updateProfile]', err);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
    }
  },

  /**
   * PATCH /api/users/me/photo
   * multipart/form-data -> field "photo"
   */
  async updateProfilePhoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File foto wajib diunggah.' });
      }

      const oldUser = await User.findById(req.user.id);
      const newPhotoUrl = `/uploads/profiles/${req.file.filename}`;
      const updated = await User.updateProfilePhoto(req.user.id, newPhotoUrl);

      // Hapus foto lama dari disk (best-effort)
      if (oldUser?.profile_photo) {
        const oldPath = path.join(__dirname, '../../', oldUser.profile_photo);
        fs.unlink(oldPath, () => {});
      }

      return res.json({
        success: true,
        message: 'Foto profil berhasil diperbarui.',
        data: updated,
      });
    } catch (err) {
      console.error('[updateProfilePhoto]', err);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui foto profil.' });
    }
  },
};

module.exports = userController;
