const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { uploadPostMedia } = require('../middleware/upload.middleware');

const postController = require('../controllers/post.controller');
const likeController = require('../controllers/like.controller');
const commentController = require('../controllers/comment.controller');

// ---------- POSTS ----------
router.post('/', authMiddleware, uploadPostMedia.array('media', 10), postController.createPost);
router.get('/', authMiddleware, postController.getFeed);
router.get('/:id', authMiddleware, postController.getPostDetail);
router.patch('/:id/caption', authMiddleware, postController.updateCaption);
router.delete('/:id', authMiddleware, postController.deletePost);

// ---------- LIKES ----------
router.post('/:id/like', authMiddleware, likeController.toggleLike);
router.get('/:id/likes', authMiddleware, likeController.listLikes);

// ---------- COMMENTS ----------
router.post('/:id/comments', authMiddleware, commentController.addComment);
router.get('/:id/comments', authMiddleware, commentController.getComments);

module.exports = router;
