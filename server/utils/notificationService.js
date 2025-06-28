const { sendShopNotification } = require('./notifications'); // path to your notification helper
const db = require('../db');

async function placeOrder(req, res) {
  const { items, total, address, paymentMethod, orderDate } = req.body;
  const userId = req.user.id; // assuming auth middleware sets req.user
  const shopId = req.body.shopId; // or derive from items/shopSlug

  try {
    // 1. Insert order into orders table
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, shop_id, items, total, address, payment_method, order_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userId, shopId, JSON.stringify(items), total, JSON.stringify(address), paymentMethod, orderDate]
    );

    const orderId = orderResult.rows[0].id;

    // 2. Send notification to shop owner
    const message = `New order #${orderId} placed by user ${userId}`;
    await sendShopNotification({ shopId, message });

    // 3. Respond with order ID or whatever your frontend needs
    res.json({ orderId });

  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
}

module.exports = {
  placeOrder,
};
