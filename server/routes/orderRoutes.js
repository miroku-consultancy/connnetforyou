const express = require('express');
const { createOrder, getOrdersByUser } = require('../models/orderModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
console.log('[OrderRoute] Loaded');

router.use((req, res, next) => {
  console.log(`[OrderRoute] ${req.method} ${req.originalUrl}`);
  next();
});

// POST /api/orders – create new order
router.post('/', authMiddleware, async (req, res) => {
  const { items, total, address, paymentMethod, orderDate } = req.body;
  const userId = req.user.id;

  try {
    const orderId = await createOrder({ items, total, address, paymentMethod, orderDate, userId });
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders/user – fetch user orders
router.get('/user', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await getOrdersByUser(userId);
    res.json(orders);
  } catch (err) {
    console.error('Failed to fetch order history:', err);
    res.status(500).json({ error: 'Could not fetch order history' });
  }
});

module.exports = router;
