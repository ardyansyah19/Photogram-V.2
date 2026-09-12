const Post = require('../models/Post');
const PostLike = require('../models/PostLike');

const likeController = {
  /**
   * POST /api/posts/:id/like
   * Toggle: jika belum like -> like, jika sudah like -> unlike.
   */
  async toggleLike(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user.id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Feed tidak ditemukan.' });
      }

      const alreadyLiked = await PostLike.hasLiked(postId, userId);
      let likeCount;
      let likedByMe;

      if (alreadyLiked) {
        likeCount = await PostLike.unlike(postId, userId);
        likedByMe = false;
      } else {
        likeCount = await PostLike.like(postId, userId);
        likedByMe = true;
      }

      return res.json({
        success: true,
        message: likedByMe ? 'Feed disukai.' : 'Like dibatalkan.',
        data: { like_count: likeCount, liked_by_me: likedByMe },
      });
    } catch (err) {
      console.error('[toggleLike]', err);
      return res.status(500).json({ success: false, message: 'Gagal memproses like.' });
    }
  },

  /**
   * GET /api/posts/:id/likes
   */
  async listLikes(req, res) {
    try {
      const users = await PostLike.listUsersWhoLiked(req.params.id);
      return res.json({ success: true, data: users });
    } catch (err) {
      console.error('[listLikes]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar like.' });
    }
  },
};

module.exports = likeController;
