const pool = require('../db');

// CREATE ORDER
async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();

  try {
    console.log('[createOrder] Starting order creation...');
    await client.query('BEGIN');

    // Insert order
    const orderInsertResult = await client.query(
      `INSERT INTO orders (user_id, total, name, street, city, zip, phone, payment_method, order_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        total,
        address.name,
        address.street,
        address.city,
        address.zip,
        address.phone,
        paymentMethod,
        orderDate,
      ]
    );

    const orderId = orderInsertResult.rows[0].id;

    // Insert each order item
    for (const item of items) {
      const productId = parseInt(item.id.toString().split('-')[0], 10);
      const unitIdStr = item.id.toString().split('-')[1];
      const unitId = item.unit_id ?? (unitIdStr ? parseInt(unitIdStr, 10) : null);

      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, name, price, quantity,
          image, shop_id, unit_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          productId,
          item.name,
          item.price,
          item.quantity,
          item.image,
          item.shopId ?? item.shop_id,
          unitId,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`[createOrder] Order ${orderId} created successfully.`);
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[createOrder] Error inserting order:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// GET ORDERS BY USER
async function getOrdersByUser(userId) {
  try {
    const result = await pool.query(
      `SELECT o.id AS order_id, o.total, o.order_date,
              oi.product_id, oi.name, oi.price, oi.quantity,
              oi.image, oi.unit_id,
              u.name AS unit_name, u.category AS unit_category
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN units u ON oi.unit_id = u.id
       WHERE o.user_id = $1
       ORDER BY o.order_date DESC, o.id`,
      [userId]
    );

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const {
        order_id, total, order_date,
        product_id, name, price, quantity,
        image, unit_id, unit_name, unit_category
      } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          total,
          order_date,
          items: [],
        });
      }

      ordersMap.get(order_id).items.push({
        product_id,
        name,
        price,
        quantity,
        image,
        unit_id,
        unit_name,
        unit_category,
      });
    });

    return Array.from(ordersMap.values());
  } catch (err) {
    console.error('[getOrdersByUser] Error fetching user orders:', err.message);
    throw err;
  }
}

// GET ORDERS BY SHOP
async function getOrdersByShop(shopId) {
  try {
    const result = await pool.query(
      `SELECT 
        o.id AS order_id,
        o.order_date,
        o.payment_method,
        o.total,
        o.name AS customer_name,
        o.phone AS customer_phone,
        oi.product_id,
        oi.name AS product_name,
        oi.price,
        oi.quantity,
        u.name AS unit_name,
        u.category AS unit_category
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN units u ON oi.unit_id = u.id
      WHERE oi.shop_id = $1
      ORDER BY o.order_date DESC, o.id`,
      [shopId]
    );

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const {
        order_id,
        order_date,
        payment_method,
        total,
        customer_name,
        customer_phone,
        product_id,
        product_name,
        price,
        quantity,
        unit_name,
        unit_category
      } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          order_date,
          payment_method,
          total,
          customer_name,
          customer_phone,
          items: [],
        });
      }

      ordersMap.get(order_id).items.push({
        product_id,
        name: product_name,
        price,
        quantity,
        unit_name,
        unit_category,
      });
    });

    return Array.from(ordersMap.values());
  } catch (err) {
    console.error('[getOrdersByShop] Error fetching shop orders:', err.message);
    throw err;
  }
}

module.exports = {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
};
