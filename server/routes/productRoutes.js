const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// 🔍 Log all requests hitting /api/products/*
router.use((req, res, next) => {
  console.log(`📦 Product route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// GET /api/products → all products
router.get('/', productController.getProducts);

// GET /api/products/:id → product by ID
router.get('/:id', productController.getProduct);

// POST /api/products → Add new product (admin/vendor only)
router.post(
  '/',
  authMiddleware, // ensures user is logged in
  productController.addProduct
);

module.exports = router;
