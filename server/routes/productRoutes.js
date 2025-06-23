const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// 📦 Set up Multer for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'images')); // Save to /images folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `product-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// 🧭 Log all product route requests
router.use((req, res, next) => {
  console.log(`📦 Product route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// GET all products
router.get('/', productController.getProducts);

// GET product by ID
router.get('/:id', productController.getProduct);

// POST new product (admin/vendor only) with image upload
router.post(
  '/',
  authMiddleware,
  upload.single('image'), // 👈 handle 'image' file field
  productController.addProduct
);

module.exports = router;
