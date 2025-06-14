const express = require('express');
const cors = require('cors');
const productController = require('../controllers/productController');

const router = express.Router();

// ✅ CORS setup for this router (same as in index.js)
const corsOptions = {
  origin: ['http://localhost:3000', 'https://connect4u-client.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ Apply CORS and preflight support
router.use(cors(corsOptions));
router.options('*', cors(corsOptions));

// GET /api/products → all products
router.get('/', (req, res, next) => {
  console.log('Route: GET /api/products');
  next(); // pass control to controller
}, productController.getProducts);

// GET /api/products/:id → product by ID
router.get('/:id', productController.getProduct);

module.exports = router;
