const Post = require('../models/Post');
const PostComment = require('../models/PostComment');

const commentController = {
  /**
   * POST /api/posts/:id/comments
   * body: { content: string }
   */
  async addComment(req, res) {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong.' });
      }

      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Feed tidak ditemukan.' });
      }

      const comment = await PostComment.create(req.params.id, req.user.id, content.trim());
      return res.status(201).json({ success: true, message: 'Komentar ditambahkan.', data: comment });
    } catch (err) {
      console.error('[addComment]', err);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan komentar.' });
    }
  },

  /**
   * GET /api/posts/:id/comments?page=1&limit=20
   */
  async getComments(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;

      const comments = await PostComment.findByPostId(req.params.id, { limit, offset });
      return res.json({ success: true, data: comments, pagination: { page, limit } });
    } catch (err) {
      console.error('[getComments]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil komentar.' });
    }
  },

  /**
   * PATCH /api/comments/:commentId
   * body: { content: string }
   */
  async updateComment(req, res) {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong.' });
      }

      const updated = await PostComment.updateContent(req.params.commentId, req.user.id, content.trim());
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Komentar tidak ditemukan atau kamu bukan pemiliknya.',
        });
      }

      return res.json({ success: true, message: 'Komentar berhasil diperbarui.', data: updated });
    } catch (err) {
      console.error('[updateComment]', err);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui komentar.' });
    }
  },

  /**
   * DELETE /api/comments/:commentId
   */
  async deleteComment(req, res) {
    try {
      const deleted = await PostComment.delete(req.params.commentId, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Komentar tidak ditemukan atau kamu bukan pemiliknya.',
        });
      }
      return res.json({ success: true, message: 'Komentar berhasil dihapus.' });
    } catch (err) {
      console.error('[deleteComment]', err);
      return res.status(500).json({ success: false, message: 'Gagal menghapus komentar.' });
    }
  },
};

module.exports = commentController;
