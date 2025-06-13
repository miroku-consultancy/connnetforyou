// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { createOrder } = require('../models/orderModel');

router.post('/', async (req, res) => {
  const { items, total, address, paymentMethod, orderDate } = req.body;

  try {
    const orderId = await createOrder({ items, total, address, paymentMethod, orderDate });
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

module.exports = router;
