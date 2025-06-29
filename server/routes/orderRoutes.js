const express = require('express');
const {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
} = require('../models/orderModel');

const authMiddleware = require('../middleware/authMiddleware');
const { sendShopNotification } = require('../utils/notificationService');
const { sendToClients } = require('./notificationSse');
const pool = require('../db');

const router = express.Router();

console.log('[OrderRoute] Loaded');

// Middleware to log each request
router.use((req, res, next) => {
  console.log(`[OrderRoute] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * POST /api/orders – Create a new order
 */
router.post('/', authMiddleware, async (req, res) => {
  console.log('[OrderRoute] POST /api/orders called');

  const { items, total, address, paymentMethod, orderDate } = req.body;
  const userId = req.user.id;

  try {
    const orderId = await createOrder({
      items,
      total,
      address,
      paymentMethod,
      orderDate,
      userId,
    });

    console.log(`[OrderRoute] Order created with ID: ${orderId}`);

    // Get user name and phone from DB
    const userResult = await pool.query(
      'SELECT name, phone FROM users WHERE id = $1',
      [userId]
    );

    const userName = userResult.rows[0]?.name || 'A user';
    const userPhone = userResult.rows[0]?.phone || '';

    // Format address (city, zip, etc.)
    const addressParts = [
      address?.street || address?.line1 || '',
      address?.city,
      address?.zip,
      address?.state,
    ].filter(Boolean);

    const addressText = addressParts.join(', ');

    // Unique shop IDs involved in the order
    const shopIds = [...new Set(items.map(item => item.shopId ?? item.shop_id).filter(Boolean))];

    for (const shopId of shopIds) {
      // Message with user details
      const message = `${userName} placed a new order (ID: ${orderId}) at ${addressText}${userPhone ? ` (📞 ${userPhone})` : ''}.`;

      // Save notification in DB
      await sendShopNotification({ shopId, message });

      // Push real-time notification via SSE
      sendToClients(shopId, {
        id: Date.now(), // Temporary ID
        message,
        created_at: new Date().toISOString(),
        is_read: false,
        user_name: userName,
        address: addressText,
        phone: userPhone,
      });
    }

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('[OrderRoute] Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

/**
 * GET /api/orders/user – Orders placed by current user
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
