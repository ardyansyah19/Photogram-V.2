const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { uploadProfilePhoto } = require('../middleware/upload.middleware');
const userController = require('../controllers/user.controller');

// PENTING: route statis "/me..." dan "/" (search) harus didaftarkan
// sebelum "/:id" agar tidak tertangkap sebagai param ":id".
router.get('/', authMiddleware, userController.searchUsers);
router.patch('/me', authMiddleware, userController.updateProfile);
router.patch('/me/photo', authMiddleware, uploadProfilePhoto.single('photo'), userController.updateProfilePhoto);
router.get('/:id', userController.getProfile);

module.exports = router;
