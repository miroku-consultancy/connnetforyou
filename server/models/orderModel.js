const pool = require('../db');

// Create a new order
async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the order
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

    // Insert each item with shopId
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity, image, shop_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.image,
          item.shopId // Make sure your frontend sends this
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

// Get orders placed by a user (with items)
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
        `SELECT product_id, name, price, quantity, image, shop_id
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

module.exports = { createOrder, getOrdersByUser };
