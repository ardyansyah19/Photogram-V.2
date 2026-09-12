const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { uploadChatImage } = require('../middleware/upload.middleware');
const chatController = require('../controllers/chat.controller');

router.get('/conversations', authMiddleware, chatController.listConversations);
router.post('/conversations', authMiddleware, chatController.openConversation);
router.get('/conversations/:id/messages', authMiddleware, chatController.getMessages);
router.post('/conversations/:id/messages', authMiddleware, chatController.sendTextMessage);
router.post(
  '/conversations/:id/messages/image',
  authMiddleware,
  uploadChatImage.single('image'),
  chatController.sendImageMessage
);

module.exports = router;
