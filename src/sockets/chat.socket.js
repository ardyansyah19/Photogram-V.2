const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * Middleware autentikasi untuk koneksi Socket.IO. Token dikirim client
 * lewat `socket.handshake.auth.token` (bukan header, karena ini bukan
 * request HTTP biasa).
 */
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token tidak ditemukan.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Token tidak valid.'));
  }
}

function initChatSocket(io) {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    // Room pribadi per user, dipakai untuk notifikasi percakapan baru
    // tanpa harus sudah join room percakapannya dulu.
    socket.join(`user:${socket.userId}`);

    /**
     * Client join room sebuah percakapan sebelum bisa kirim/terima pesan
     * real-time di percakapan tersebut. Divalidasi dulu apakah user
     * memang partisipan percakapan itu.
     */
    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        const allowed = await Conversation.isParticipant(conversationId, socket.userId);
        if (!allowed) {
          return socket.emit('error:message', { message: 'Kamu bukan bagian dari percakapan ini.' });
        }
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        console.error('[socket conversation:join]', err);
      }
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    /**
     * Kirim pesan teks atau emoji secara real-time. Pesan gambar tetap
     * lewat REST (upload multipart), lalu di-broadcast dari controller.
     */
    socket.on('message:send', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const allowed = await Conversation.isParticipant(conversationId, socket.userId);
        if (!allowed) {
          return socket.emit('error:message', { message: 'Kamu bukan bagian dari percakapan ini.' });
        }

        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          content: content.trim(),
        });

        io.to(`conversation:${conversationId}`).emit('message:new', message);
      } catch (err) {
        console.error('[socket message:send]', err);
        socket.emit('error:message', { message: 'Gagal mengirim pesan.' });
      }
    });

    /**
     * Indikator "sedang mengetik", di-broadcast ke lawan bicara saja
     * (bukan ke pengirim sendiri).
     */
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      });
    });
  });
}

module.exports = initChatSocket;
