const admin = require('./firebaseAdmin'); // or wherever the file is
const express = require('express');
const {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
} = require('../models/orderModel');

const authMiddleware = require('../middleware/authMiddleware');
const { sendShopNotification } = require('../utils/notificationService');
const { sendToClients } = require('./notificationSse'); // SSE handler
const { sendWhatsappMessage } = require('../utils/whatsappService'); // ✅ ADD THIS LINE
const pool = require('../db');

const router = express.Router();

console.log('[OrderRoute] Loaded');

// Logging middleware
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

    // Get user details
    const userResult = await pool.query('SELECT name, mobile FROM users WHERE id = $1', [userId]);
    const userName = userResult.rows[0]?.name || 'A user';
    const userPhone = userResult.rows[0]?.mobile || null;


    // Format address string
    const addressText = typeof address === 'string'
      ? address
      : address?.street || address?.line1 || address?.address || '';

    // Notify shops (SSE + DB)
    const shopIds = [...new Set(items.map(item => item.shopId ?? item.shop_id).filter(Boolean))];

    for (const shopId of shopIds) {
      const message = `${userName} has placed an order${addressText ? ` at ${addressText}` : ''}.`;

      // Save notification to DB
      await sendShopNotification({ shopId, message });

      // Send via Server-Sent Events (SSE)
      sendToClients(shopId, {
        id: Date.now(),
        message,
        created_at: new Date().toISOString(),
        is_read: false,
        user_name: userName,
        address: addressText,
      });
      // 🔔 Send FCM push to shop (ORDER notification)
const shopUsers = await pool.query(
  `SELECT u.id, ut.fcm_token
   FROM users u
   JOIN user_shop_roles usr ON usr.user_id = u.id
   LEFT JOIN user_tokens ut ON ut.user_id = u.id
   WHERE usr.shop_id = $1 AND usr.role = 'vendor'`,
  [shopId]
);

for (const row of shopUsers.rows) {
  const fcmToken = row.fcm_token;
  if (!fcmToken) continue;

  const fcmMessage = {
    token: fcmToken,
    data: {
      type: "order",                         // ✅ THIS IS THE KEY
      title: "New Order Received",
      body: `${userName} placed a new order`,
      shopId: String(shopId),
      orderId: String(orderId),
    },
    android: {
      priority: "high",
    },
  };

  try {
    await admin.messaging().send(fcmMessage);
    console.log(`✅ Order push sent to shop ${shopId}`);
  } catch (err) {
    console.error("❌ Failed to send order push:", err.message);
  }
}

    }

    // ✅ Send WhatsApp confirmation to user
    if (userPhone) {
      const msg = `Hi ${userName}, your order #${orderId} totaling ₹${total.toFixed(2)} has been received! We'll notify you when it's ready. Thank you for ordering from ConnectFree4U.`;

      try {
        await sendWhatsappMessage(userPhone, msg);
        console.log(`[OrderRoute] ✅ WhatsApp message sent to ${userPhone}`);
      } catch (err) {
        console.error(`[OrderRoute] ❌ WhatsApp sending failed:`, err.message);
      }
    } else {
      console.warn(`[OrderRoute] ⚠️ No phone number found for user ID ${userId}, WhatsApp not sent.`);
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

// Add this route
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    const updatedOrder = result.rows[0];
    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

    // ✅ Get user's FCM token
    const tokenResult = await pool.query(
      'SELECT fcm_token FROM user_tokens WHERE user_id = $1',
      [updatedOrder.user_id]
    );
    const fcmToken = tokenResult.rows[0]?.fcm_token;

    if (fcmToken) {
      const statusMessages = {
        Accepted: 'Your order has been accepted! 🧾',
        'In Transit': 'Your order is on the way! 🚚',
        Delivered: 'Your order has been delivered! 🎉',
      };

      const message = {
  token: fcmToken,
  data: {
    type: "order",   // ✅ IMPORTANT
    title: "Order Update",
    body: statusMessages[status] || `Your order status changed to: ${status}`,
    orderId: String(updatedOrder.id),
    status: String(status),
  },
  android: { priority: "high" },
};


      await admin.messaging().send(message);
      console.log(`✅ Push sent to user ${updatedOrder.user_id}`);
    }

    res.json({ message: 'Order status updated', order: updatedOrder });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
