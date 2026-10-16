const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const chatController = {
  /**
   * GET /api/chat/conversations
   */
  async listConversations(req, res) {
    try {
      const conversations = await Conversation.listForUser(req.user.id);
      return res.json({ success: true, data: conversations });
    } catch (err) {
      console.error('[listConversations]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar chat.' });
    }
  },

  /**
   * POST /api/chat/conversations
   * body: { userId } -> cari atau buat percakapan 1-ke-1 dengan user tsb
   */
  async openConversation(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId tujuan wajib diisi.' });
      }
      if (userId === req.user.id) {
        return res.status(400).json({ success: false, message: 'Tidak bisa chat dengan diri sendiri.' });
      }

      const conversation = await Conversation.findOrCreateBetween(req.user.id, userId);
      return res.json({ success: true, data: conversation });
    } catch (err) {
      console.error('[openConversation]', err);
      return res.status(500).json({ success: false, message: 'Gagal membuka percakapan.' });
    }
  },

  /**
   * GET /api/chat/conversations/:id/messages?before=&limit=
   */
  async getMessages(req, res) {
    try {
      const isParticipant = await Conversation.isParticipant(req.params.id, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Kamu bukan bagian dari percakapan ini.' });
      }

      const limit = Math.min(parseInt(req.query.limit) || 30, 100);
      const before = req.query.before || undefined;
      const messages = await Message.findByConversation(req.params.id, { limit, before });

      return res.json({ success: true, data: messages });
    } catch (err) {
      console.error('[getMessages]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil pesan.' });
    }
  },

  /**
   * POST /api/chat/conversations/:id/messages
   * body: { content } -> pesan teks atau emoji (emoji = teks unicode biasa)
   * Endpoint ini dipakai sebagai fallback REST; jalur utama real-time
   * tetap lewat Socket.IO event "message:send".
   */
  async sendTextMessage(req, res) {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Isi pesan tidak boleh kosong.' });
      }

      const isParticipant = await Conversation.isParticipant(req.params.id, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Kamu bukan bagian dari percakapan ini.' });
      }

      const message = await Message.create({
        conversationId: req.params.id,
        senderId: req.user.id,
        content: content.trim(),
      });

      const message = await Message.create({
        conversationId: req.params.id,
        senderId: req.user.id,
        content: content.trim(),
      });

      const message = await Message.create({
        conversationId: req.params.id,
        senderId: req.user.id,
        content: content.trim(),
      });

      req.app.get('io')?.to(`conversation:${req.params.id}`).emit('message:new', message);

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      console.error('[sendTextMessage]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengirim pesan.' });
    }
  },

  /**
   * POST /api/chat/conversations/:id/messages/image
   * multipart/form-data -> field "image"
   */
  async sendImageMessage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File gambar wajib diunggah.' });
      }

      const isParticipant = await Conversation.isParticipant(req.params.id, req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Kamu bukan bagian dari percakapan ini.' });
      }

      const message = await Message.create({
        conversationId: req.params.id,
        senderId: req.user.id,
        imageUrl: `/uploads/chat/${req.file.filename}`,
      });

      req.app.get('io')?.to(`conversation:${req.params.id}`).emit('message:new', message);

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      console.error('[sendImageMessage]', err);
      return res.status(500).json({ success: false, message: 'Gagal mengirim gambar.' });
    }
  },
};

module.exports = chatController;
