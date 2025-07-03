const express = require('express');
const {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
} = require('../models/orderModel');

const authMiddleware = require('../middleware/authMiddleware');
const { sendShopNotification } = require('../utils/notificationService');
const { sendToClients } = require('./notificationSse'); // SSE handler
const pool = require('../db');

const router = express.Router();

console.log('[OrderRoute] Loaded');

// Logging middleware for every request in this router
router.use((req, res, next) => {
  console.log(`[OrderRoute] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * POST /api/orders – Create a new order
 */
router.post('/', authMiddleware, async (req, res) => {
  console.log('[OrderRoute] POST /api/orders called');
  console.log('[OrderRoute] req.user:', req.user);

  const { items, total, address, paymentMethod, orderDate } = req.body;
  const userId = req.user.id;

  try {
    const { orderId, orderNumber } = await createOrder({
      items,
      total,
      address,
      paymentMethod,
      orderDate,
      userId,
    });

    console.log(`[OrderRoute] Order created with ID: ${orderId}, orderNumber: ${orderNumber}`);

    // Get user name from DB
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const userName = userResult.rows[0]?.name || 'A user';

    // Format address string for message
    const addressText = typeof address === 'string'
      ? address
      : address?.street || address?.line1 || address?.address || '';

    // Notify all unique shops involved
    const shopIds = [...new Set(items.map(item => item.shopId ?? item.shop_id).filter(Boolean))];

    for (const shopId of shopIds) {
      const message = `${userName} has placed an order${addressText ? ` at ${addressText}` : ''}.`;

      // Save notification in DB
      await sendShopNotification({ shopId, message });

      // Real-time push via SSE
      sendToClients(shopId, {
        id: Date.now(),
        message,
        created_at: new Date().toISOString(),
        is_read: false,
        user_name: userName,
        address: addressText,
      });
    }

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('[OrderRoute] Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

/**
 * GET /api/orders/user – Orders by logged-in user
 */
router.get('/user', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await getOrdersByUser(userId);
    res.json(orders);
  } catch (err) {
    console.error('[OrderRoute] Fetch user orders error:', err);
    res.status(500).json({ error: 'Could not fetch order history' });
  }
});

/**
 * GET /api/orders/shop/:shopId – Orders for a specific shop (vendor only)
 */
router.get('/shop/:shopId', authMiddleware, async (req, res) => {
  const { shopId } = req.params;
  const user = req.user;

  try {
    if (user.role !== 'vendor' || user.shop_id !== parseInt(shopId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const orders = await getOrdersByShop(shopId);
    res.json(orders);
  } catch (err) {
    console.error('[OrderRoute] Fetch shop orders error:', err);
    res.status(500).json({ error: 'Failed to fetch shop orders' });
  }
});

module.exports = router;
