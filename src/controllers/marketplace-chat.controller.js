const Product = require('../models/Product');
const MarketplaceConversation = require('../models/MarketplaceConversation');
const MarketplaceMessage = require('../models/MarketplaceMessage');

const marketplaceChatController = {
  /**
   * GET /api/marketplace/conversations
   */
  async listConversations(req, res) {
    try {
      const conversations = await MarketplaceConversation.listForUser(req.user.id);
      return res.json({ success: true, data: conversations });
    } catch (err) {
      console.error('[mp listConversations]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar chat marketplace.' });
    }
  },

  /**
   * POST /api/marketplace/conversations
   * body: { productId } -> buka/buat percakapan dengan penjual produk itu
   */
  async openConversation(req, res) {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ success: false, message: 'productId wajib diisi.' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
      }
      if (product.seller_id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Tidak bisa membuka chat marketplace untuk produk milik sendiri.',
        });
      }

      const conversation = await MarketplaceConversation.findOrCreateForProduct(
        productId,
        req.user.id,
        product.seller_id
      );

      return res.json({ success: true, data: { ...conversation, product_name: product.name } });
    } catch (err) {
      console.error('[mp openConversation]', err);
      return res.status(500).json({ success: false, message: 'Gagal membuka chat marketplace.' });
    }
  },

  /**
   * GET /api/marketplace/conversations/:id/messages?before=&limit=
   */
  async getMessages(req, res) {
    try {
      const isParticipant = await MarketplaceConversation.isParticipant(req.params.id, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Kamu bukan bagian dari percakapan ini.' });
      }

      const limit = Math.min(parseInt(req.query.limit) || 30, 100);
      const before = req.query.before || undefined;
      const messages = await MarketplaceMessage.findByConversation(req.params.id, { limit, before });

      return res.json({ success: true, data: messages });
    } catch (err) {
      console.error('[mp getMessages]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil pesan.' });
    }
  },

  /**
   * POST /api/marketplace/conversations/:id/messages
   * body: { content } -- fallback non-realtime, jalur utama tetap Socket.IO
   */
  async sendTextMessage(req, res) {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Isi pesan tidak boleh kosong.' });
      }

      const isParticipant = await MarketplaceConversation.isParticipant(req.params.id, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Kamu bukan bagian dari percakapan ini.' });
      }

      const message = await MarketplaceMessage.create({
        conversationId: req.params.id,
        senderId: req.user.id,
        content: content.trim(),
      });

      req.app.get('io')?.to(`marketplace-conversation:${req.params.id}`).emit('marketplace:message:new', message);

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      console.error('[mp sendTextMessage]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengirim pesan.' });
    }
  },

  /**
   * POST /api/marketplace/conversations/:id/messages/image
   * multipart/form-data -> field "image"
   */
  async sendImageMessage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File gambar wajib diunggah.' });
      }

      const isParticipant = await MarketplaceConversation.isParticipant(req.params.id, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Kamu bukan bagian dari percakapan ini.' });
      }

      const message = await MarketplaceMessage.create({
        conversationId: req.params.id,
        senderId: req.user.id,
        imageUrl: `/uploads/marketplace-chat/${req.file.filename}`,
      });

      req.app.get('io')?.to(`marketplace-conversation:${req.params.id}`).emit('marketplace:message:new', message);

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      console.error('[mp sendImageMessage]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengirim gambar.' });
    }
  },
};

module.exports = marketplaceChatController;
