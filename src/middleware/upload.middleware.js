const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILES_PER_POST = 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/posts'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.'));
  }
  cb(null, true);
}

const uploadPostMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES_PER_POST,
  },
});

// ---------- Foto profil (single file, folder terpisah) ----------
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// ---------- Gambar chat (single file, folder terpisah) ----------
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/chat'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadChatImage = multer({
  storage: chatStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// ---------- Gambar produk marketplace (multi file, folder terpisah) ----------
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/products'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadProductMedia = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES_PER_POST },
});

// ---------- Gambar chat marketplace (single file, folder terpisah dari chat sosial) ----------
const marketplaceChatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/marketplace-chat'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadMarketplaceChatImage = multer({
  storage: marketplaceChatStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

module.exports = {
  uploadPostMedia,
  uploadProfilePhoto,
  uploadChatImage,
  uploadProductMedia,
  uploadMarketplaceChatImage,
};
