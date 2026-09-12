const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const commentController = require('../controllers/comment.controller');

router.patch('/:commentId', authMiddleware, commentController.updateComment);
router.delete('/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;
