const authMiddleware = require('../middleware/authMiddleware'); // 👈 import it
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products → all products
router.get('/', (req, res, next) => {
  console.log('Route: GET /api/products');
  next(); // pass control to controller
}, productController.getProducts);


// GET /api/products/:id → product by ID
router.get('/:id', productController.getProduct);

module.exports = router;
