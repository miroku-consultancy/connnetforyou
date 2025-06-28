const express = require('express');
const { createOrder, getOrdersByUser, getOrdersByShop } = require('../models/orderModel');
const authMiddleware = require('../middleware/authMiddleware');
const { sendShopNotification } = require('../utils/notificationService');

const router = express.Router();

console.log('[OrderRoute] Loaded');

// Middleware for logging requests to this router
router.use((req, res, next) => {
  console.log(`[OrderRoute] ${req.method} ${req.originalUrl}`);
  next();
});

// POST /api/orders – create new order
router.post('/', authMiddleware, async (req, res) => {
  console.log('[OrderRoute] POST /api/orders called');
  const { items, total, address, paymentMethod, orderDate } = req.body;
  const userId = req.user.id;

  console.log(`[OrderRoute] User ID: ${userId}`);
  console.log('[OrderRoute] Order Data:', { items, total, address, paymentMethod, orderDate });

  try {
    const orderId = await createOrder({
      items,
      total,
      address,
      paymentMethod,
      orderDate,
      userId
    });
    console.log(`[OrderRoute] Order created with ID: ${orderId}`);

    // Notify all unique shops involved in the order
    const shopIds = [...new Set(items.map(item => item.shopId ?? item.shop_id).filter(Boolean))];
    console.log('[OrderRoute] Unique shop IDs for notification:', shopIds);

    for (const shopId of shopIds) {
      console.log(`[OrderRoute] Sending notification to shop ${shopId}`);
      await sendShopNotification({
        shopId,
        message: `You have received a new order (ID: ${orderId}).`
      });
      console.log(`[OrderRoute] Notification sent to shop ${shopId}`);
    }

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('[OrderRoute] Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/orders/user – fetch orders for the logged-in user
router.get('/user', authMiddleware, async (req, res) => {
  console.log('[OrderRoute] GET /api/orders/user called');
  const userId = req.user.id;
  console.log(`[OrderRoute] Fetching orders for user ID: ${userId}`);

  try {
    const orders = await getOrdersByUser(userId);
    console.log(`[OrderRoute] Retrieved ${orders.length} orders for user ${userId}`);
    res.json(orders);
  } catch (err) {
    console.error('[OrderRoute] Failed to fetch order history:', err);
    res.status(500).json({ error: 'Could not fetch order history' });
  }
});

// GET /api/orders/shop/:shopId – fetch orders for a specific shop (vendor only)
router.get('/shop/:shopId', authMiddleware, async (req, res) => {
  const { shopId } = req.params;
  const user = req.user;
  console.log(`[OrderRoute] GET /api/orders/shop/${shopId} called by user ID: ${user.id}`);

  try {
    // Only vendors who own the shop can access
    if (user.role !== 'vendor' || user.shop_id !== parseInt(shopId)) {
      console.warn(`[OrderRoute] Access denied for user ID ${user.id} on shop ${shopId}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    const orders = await getOrdersByShop(shopId);
    console.log(`[OrderRoute] Retrieved ${orders.length} orders for shop ${shopId}`);
    res.json(orders);
  } catch (error) {
    console.error('[OrderRoute] Error fetching shop orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
