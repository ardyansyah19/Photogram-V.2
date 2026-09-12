const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const PostMedia = require('../models/PostMedia');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');

const postController = {
  /**
   * POST /api/posts
   * multipart/form-data -> field "media" (bisa banyak file) + field "caption"
   */
  async createPost(req, res) {
    try {
      const { caption } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimal satu gambar wajib diunggah untuk membuat feed.',
        });
      }

      const post = await Post.create({ userId: req.user.id, caption });
      const media = await PostMedia.insertMany(post.id, files);

      return res.status(201).json({
        success: true,
        message: 'Feed berhasil diposting.',
        data: { ...post, media, like_count: 0, comment_count: 0, liked_by_me: false },
      });
    } catch (err) {
      console.error('[createPost]', err);
      return res.status(500).json({ success: false, message: 'Gagal membuat feed.' });
    }
  },

  /**
   * GET /api/posts?page=1&limit=10
   */
  async getFeed(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 50);
      const offset = (page - 1) * limit;

      const posts = await Post.getFeed({ limit, offset, currentUserId: req.user?.id });

      return res.json({
        success: true,
        data: posts,
        pagination: { page, limit },
      });
    } catch (err) {
      console.error('[getFeed]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil feed.' });
    }
  },

  /**
   * GET /api/posts/:id  (juga menambah views_count)
   */
  async getPostDetail(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Feed tidak ditemukan.' });
      }

      await Post.incrementViews(post.id, req.user?.id || null);

      const [media, likeCount, likedByMe, comments] = await Promise.all([
        PostMedia.findByPostId(post.id),
        PostLike.count(post.id),
        req.user ? PostLike.hasLiked(post.id, req.user.id) : false,
        PostComment.findByPostId(post.id),
      ]);

      return res.json({
        success: true,
        data: { ...post, views_count: post.views_count + 1, media, like_count: likeCount, liked_by_me: likedByMe, comments },
      });
    } catch (err) {
      console.error('[getPostDetail]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail feed.' });
    }
  },

  /**
   * PATCH /api/posts/:id/caption
   * body: { caption: string }
   */
  async updateCaption(req, res) {
    try {
      const { caption } = req.body;
      if (caption === undefined) {
        return res.status(400).json({ success: false, message: 'Caption wajib diisi.' });
      }

      const updated = await Post.updateCaption(req.params.id, req.user.id, caption);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Feed tidak ditemukan atau kamu bukan pemilik feed ini.',
        });
      }

      return res.json({ success: true, message: 'Caption berhasil diperbarui.', data: updated });
    } catch (err) {
      console.error('[updateCaption]', err);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui caption.' });
    }
  },

  /**
   * DELETE /api/posts/:id
   */
  async deletePost(req, res) {
    try {
      const media = await PostMedia.findByPostId(req.params.id);
      const deleted = await Post.delete(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Feed tidak ditemukan atau kamu bukan pemilik feed ini.',
        });
      }

      // Hapus file fisik dari disk (best-effort, tidak menggagalkan request jika error)
      media.forEach((m) => {
        const filePath = path.join(__dirname, '../../', m.media_url);
        fs.unlink(filePath, () => {});
      });

      return res.json({ success: true, message: 'Feed berhasil dihapus.' });
    } catch (err) {
      console.error('[deletePost]', err);
      return res.status(500).json({ success: false, message: 'Gagal menghapus feed.' });
    }
  },
};

module.exports = postController;
