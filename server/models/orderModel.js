const pool = require('../db');

// Create a new order
async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total, name, street, city, zip, phone, payment_method, order_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        userId,
        total,
        address.name,
        address.street,
        address.city,
        address.zip,
        address.phone,
        paymentMethod,
        new Date(orderDate)
      ]
    );

    const orderId = orderRes.rows[0].id;

    for (const item of items) {
      const shop_id = item.shop_id ?? item.shopId;
      if (!shop_id) {
        throw new Error(`Missing shop_id for item ${item.name}`);
      }

      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity, image, shop_id, unit_id, unit_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.image,
          shop_id,
          item.unit_id ?? null,
          item.unit_type ?? null
        ]
      );
    }

    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Orders by user
async function getOrdersByUser(userId) {
  const client = await pool.connect();
  try {
    const { rows: orders } = await client.query(
      `SELECT id, total, payment_method, order_date
       FROM orders
       WHERE user_id = $1
       ORDER BY order_date DESC`,
      [userId]
    );

    for (const order of orders) {
      const { rows: items } = await client.query(
        `SELECT product_id, name, price, quantity, image, shop_id, unit_type
         FROM order_items
         WHERE order_id = $1`,
        [order.id]
      );
      order.items = items;
    }

    return orders;
  } finally {
    client.release();
  }
}

// Orders by shop
async function getOrdersByShop(shopId) {
  const client = await pool.connect();
  try {
    const ordersResult = await client.query(
      `SELECT DISTINCT o.id, o.total, o.payment_method, o.order_date, u.name AS customer_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN order_items oi ON oi.order_id = o.id
       WHERE oi.shop_id = $1
       ORDER BY o.order_date DESC`,
      [shopId]
    );

    const orders = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await client.query(
        `SELECT product_id, name, price, quantity, image, unit_type
         FROM order_items
         WHERE order_id = $1 AND shop_id = $2`,
        [order.id, shopId]
      );
      orders.push({ ...order, items: itemsResult.rows });
    }

    return orders;
  } finally {
    client.release();
  }
}

module.exports = { createOrder, getOrdersByUser, getOrdersByShop };
