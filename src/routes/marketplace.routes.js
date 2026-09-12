const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { uploadMarketplaceChatImage } = require('../middleware/upload.middleware');
const marketplaceChatController = require('../controllers/marketplace-chat.controller');

router.get('/conversations', authMiddleware, marketplaceChatController.listConversations);
router.post('/conversations', authMiddleware, marketplaceChatController.openConversation);
router.get('/conversations/:id/messages', authMiddleware, marketplaceChatController.getMessages);
router.post('/conversations/:id/messages', authMiddleware, marketplaceChatController.sendTextMessage);
router.post(
  '/conversations/:id/messages/image',
  authMiddleware,
  uploadMarketplaceChatImage.single('image'),
  marketplaceChatController.sendImageMessage
);

module.exports = router;
