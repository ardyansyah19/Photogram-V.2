const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const { uploadProductMedia } = require('../middleware/upload.middleware');
const productController = require('../controllers/product.controller');

// PENTING: "/mine" harus didaftarkan sebelum "/:id" agar tidak
// tertangkap sebagai param ":id" bernilai "mine".
router.get('/mine', authMiddleware, productController.getMyProducts);
router.post('/', authMiddleware, uploadProductMedia.array('media', 10), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetail);
router.patch('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
