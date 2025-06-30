const pool = require('../db');

async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert into orders table
    const orderInsertResult = await client.query(
      `INSERT INTO orders (user_id, total, address, payment_method, order_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, total, JSON.stringify(address), paymentMethod, orderDate]
    );

    const orderId = orderInsertResult.rows[0].id;

    // Insert each item into order_items table
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, name, price, quantity,
          image, shop_id, unit_id, unit_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.image,
          item.shopId ?? item.shop_id,
          item.unit_id ?? null,
          item.unit_type ?? null,
        ]
      );
    }

    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[createOrder] Error inserting order:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function getOrdersByUser(userId) {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC`,
    [userId]
  );
  return result.rows;
}

async function getOrdersByShop(shopId) {
  const result = await pool.query(
    `SELECT o.*, oi.*
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     WHERE oi.shop_id = $1
     ORDER BY o.order_date DESC`,
    [shopId]
  );
  return result.rows;
}

module.exports = {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
};
