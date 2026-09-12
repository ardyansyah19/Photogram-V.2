const MarketplaceConversation = require('../models/MarketplaceConversation');
const MarketplaceMessage = require('../models/MarketplaceMessage');

/**
 * Handler ini dipasang di io yang SAMA dengan chat sosial (satu server
 * Socket.IO), tapi semua event diberi prefix "marketplace:" dan room
 * diberi prefix "marketplace-conversation:" supaya benar-benar terpisah
 * dari room/event chat sosial biasa. Autentikasi socket (verifikasi JWT)
 * sudah dilakukan sekali oleh initChatSocket lewat io.use(), jadi di sini
 * socket.userId sudah tersedia.
 */
function initMarketplaceChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('marketplace:conversation:join', async ({ conversationId }) => {
      try {
        const allowed = await MarketplaceConversation.isParticipant(conversationId, socket.userId);
        if (!allowed) {
          return socket.emit('marketplace:error', { message: 'Kamu bukan bagian dari percakapan ini.' });
        }
        socket.join(`marketplace-conversation:${conversationId}`);
      } catch (err) {
        console.error('[socket marketplace:conversation:join]', err);
      }
    });

    socket.on('marketplace:conversation:leave', ({ conversationId }) => {
      socket.leave(`marketplace-conversation:${conversationId}`);
    });

    socket.on('marketplace:message:send', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const allowed = await MarketplaceConversation.isParticipant(conversationId, socket.userId);
        if (!allowed) {
          return socket.emit('marketplace:error', { message: 'Kamu bukan bagian dari percakapan ini.' });
        }

        const message = await MarketplaceMessage.create({
          conversationId,
          senderId: socket.userId,
          content: content.trim(),
        });

        io.to(`marketplace-conversation:${conversationId}`).emit('marketplace:message:new', message);
      } catch (err) {
        console.error('[socket marketplace:message:send]', err);
        socket.emit('marketplace:error', { message: 'Gagal mengirim pesan.' });
      }
    });

    socket.on('marketplace:typing:start', ({ conversationId }) => {
      socket.to(`marketplace-conversation:${conversationId}`).emit('marketplace:typing:start', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('marketplace:typing:stop', ({ conversationId }) => {
      socket.to(`marketplace-conversation:${conversationId}`).emit('marketplace:typing:stop', {
        conversationId,
        userId: socket.userId,
      });
    });
  });
}

module.exports = initMarketplaceChatSocket;
