// server/models/orderModel.js
const pool = require('./productModel').pool || require('../db'); // Adjust based on your structure

const createOrder = async ({ items, total, address, paymentMethod, orderDate }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `INSERT INTO orders (total, name, street, city, zip, phone, payment_method, order_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        total,
        address.name,
        address.street,
        address.city,
        address.zip,
        address.phone,
        paymentMethod,
        new Date(orderDate),
      ]
    );

    const orderId = orderRes.rows[0].id;

    const itemPromises = items.map(item =>
      client.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity, image)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.id, item.name, item.price, item.quantity, item.image]
      )
    );

    await Promise.all(itemPromises);
    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { createOrder };
