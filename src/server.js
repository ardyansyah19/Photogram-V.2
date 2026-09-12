const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const insightRoutes = require('./routes/insight.routes');
const chatRoutes = require('./routes/chat.routes');
const productRoutes = require('./routes/product.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const initChatSocket = require('./sockets/chat.socket');
const initMarketplaceChatSocket = require('./sockets/marketplace-chat.socket');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

// Simpan instance io agar bisa dipakai controller REST (mis. upload
// gambar chat/marketplace) untuk broadcast event real-time juga.
app.set('io', io);

// initChatSocket mendaftarkan io.use() untuk verifikasi JWT saat handshake
// -- harus dipanggil sebelum initMarketplaceChatSocket supaya socket.userId
// sudah tersedia saat event marketplace:* ditangani.
initChatSocket(io);
initMarketplaceChatSocket(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file upload (gambar feed, profil, chat, produk, chat marketplace)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------- ROUTES ----------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/products', productRoutes);
app.use('/api/marketplace', marketplaceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server berjalan normal.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// Error handler global (termasuk error dari multer, misal file terlalu besar)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT} (HTTP + Socket.IO)`);
});

module.exports = app;
