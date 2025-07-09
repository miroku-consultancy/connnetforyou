const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ✅ Public route
router.get('/', productController.getPublicProducts);

// ✅ Protected routes
router.get('/:id', authMiddleware, productController.getProduct);
router.post('/', authMiddleware, upload.single('image'), productController.addProduct);
router.put('/:id', authMiddleware, upload.single('image'), productController.updateProduct);

module.exports = router;
