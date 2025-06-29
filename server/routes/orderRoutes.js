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

router.use((req, res, next) => {
  console.log(`[OrderRoute] ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/', authMiddleware, async (req, res) => {
  console.log('[OrderRoute] POST /api/orders called');

  const { items, total, address, paymentMethod, orderDate } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing items in order' });
  }

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

    // Fetch user details
    const userResult = await pool.query(
      'SELECT name, phone FROM users WHERE id = $1',
      [userId]
    );
    const userName = userResult.rows[0]?.name || 'A user';
    const userPhone = userResult.rows[0]?.phone || '';

    // Parse address fields safely
    const addressText = [
      address?.street || address?.line1 || '',
      address?.city,
      address?.zip,
    ]
      .filter(Boolean)
      .join(', ');

    const shopIds = [
      ...new Set(items.map(item => item.shopId || item.shop_id).filter(Boolean)),
    ];

    for (const shopId of shopIds) {
      const message = `${userName} placed a new order (ID: ${orderId}) at ${addressText}${userPhone ? ` (📞 ${userPhone})` : ''}.`;

      // DB notification
      await sendShopNotification({ shopId, message });

      // Real-time push via SSE
      sendToClients(shopId, {
        id: Date.now(),
        message,
        created_at: new Date().toISOString(),
        is_read: false,
        user_name: userName,
        address: addressText,
        phone: userPhone,
      });
    }

    return res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('[OrderRoute] Order placement error:', err);
    return res.status(500).json({ error: 'Failed to place order' });
  }
});

router.get('/user', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await getOrdersByUser(userId);
    return res.json(orders);
  } catch (err) {
    console.error('[OrderRoute] Fetch user orders error:', err);
    return res.status(500).json({ error: 'Could not fetch order history' });
  }
});

router.get('/shop/:shopId', authMiddleware, async (req, res) => {
  const { shopId } = req.params;
  const user = req.user;

  if (user.role !== 'vendor' || user.shop_id !== parseInt(shopId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const orders = await getOrdersByShop(shopId);
    return res.json(orders);
  } catch (err) {
    console.error('[OrderRoute] Fetch shop orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch shop orders' });
  }
});

module.exports = router;
