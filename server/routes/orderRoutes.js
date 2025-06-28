const express = require('express');
const { createOrder, getOrdersByUser } = require('../models/orderModel');
const authMiddleware = require('../middleware/authMiddleware');
const { sendShopNotification } = require('../utils/notificationService'); // updated util

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
    const orderId = await createOrder({
      items,
      total,
      address,
      paymentMethod,
      orderDate,
      userId
    });

    // Notify all unique shops involved in the order
    const shopIds = [...new Set(items.map(item => item.shopId))];

    for (const shopId of shopIds) {
      await sendShopNotification({
        shopId,
        message: `You have received a new order (ID: ${orderId}).`
      });
    }

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

// GET /api/orders/shop/:shopId - fetch orders for a shop (shop owner)
router.get('/shop/:shopId', authMiddleware, async (req, res) => {
  const { shopId } = req.params;
  const user = req.user;

  try {
    // Check if user is owner of this shop
    if (user.role !== 'shop_owner' || user.shop_id !== parseInt(shopId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ordersResult = await pool.query(
      `SELECT o.id, o.total, o.payment_method, o.order_date, u.name as customer_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.shop_id = $1
       ORDER BY o.order_date DESC`,
      [shopId]
    );

    // Get order items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT product_id, name, price, quantity, image
           FROM order_items WHERE order_id = $1`,
          [order.id]
        );
        return { ...order, items: itemsResult.rows };
      })
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
