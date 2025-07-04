const pool = require('../db');

// CREATE ORDER
async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();

  try {
    console.log('[createOrder] Starting order creation...');
    await client.query('BEGIN');

    // ✅ Step 1: Extract shop_id from first item
    const shopId = items[0].shopId ?? items[0].shop_id;
    if (!shopId) throw new Error('Missing shop ID in order items');
    console.log('[createOrder] Using shopId:', shopId);

    // ✅ Step 2: Lock rows for this shop (if any)
    await client.query(`SELECT id FROM orders WHERE shop_id = $1 FOR UPDATE`, [shopId]);

    // ✅ Step 3: Safely get the next order number
    const { rows } = await client.query(
      `SELECT COALESCE(MAX(order_number), 0) + 1 AS next_order_number
       FROM orders
       WHERE shop_id = $1`,
      [shopId]
    );
    const orderNumber = rows[0].next_order_number;
    console.log('[createOrder] orderNumber:', orderNumber);

    // ✅ Step 4: Insert order into `orders` table
    const orderInsertResult = await client.query(
      `INSERT INTO orders (
        user_id, total, name, street, city, zip, phone,
        payment_method, order_date, order_status, shop_id, order_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        'Pending',
        shopId,
        orderNumber,
      ]
    );

    const orderId = orderInsertResult.rows[0].id;
    console.log(`[createOrder] Inserted order ID: ${orderId}`);

    // ✅ Step 5: Insert each item into `order_items`
    for (const [index, item] of items.entries()) {
      const productId = parseInt(item.id.toString().split('-')[0], 10);
      const unitIdStr = item.id.toString().split('-')[1];
      const unitId = item.unit_id ?? (unitIdStr ? parseInt(unitIdStr, 10) : null);

      console.log(`[createOrder] Inserting item ${index + 1}: productId=${productId}, unitId=${unitId}`);

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
          shopId,
          unitId,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`[createOrder] Order ${orderId} created successfully.`);

    return { orderId, orderNumber };

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
  console.log(`[getOrdersByUser] Fetching orders for userId: ${userId}`);

  try {
    const result = await pool.query(
      `SELECT 
         o.id AS order_id, 
         o.total, 
         o.order_date,
         o.order_status,                            -- ✅ ADD THIS LINE
         oi.product_id, 
         oi.name, 
         oi.price, 
         oi.quantity,
         oi.image, 
         oi.unit_id,
         u.name AS unit_name, 
         u.category AS unit_category
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN units u ON oi.unit_id = u.id
       WHERE o.user_id = $1
       ORDER BY o.order_date DESC, o.id`,
      [userId]
    );

    console.log(`[getOrdersByUser] Retrieved ${result.rows.length} rows for user ${userId}`);

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const {
        order_id, total, order_date, order_status,   // ✅ INCLUDE order_status
        product_id, name, price, quantity,
        image, unit_id, unit_name, unit_category
      } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          total,
          order_date,
          order_status,       // ✅ INCLUDE IT IN THE ORDER OBJECT
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

    const orders = Array.from(ordersMap.values());
    console.log(`[getOrdersByUser] Processed ${orders.length} orders for user ${userId}`);
    return orders;
  } catch (err) {
    console.error('[getOrdersByUser] Error fetching user orders:', err.message);
    throw err;
  }
}


// GET ORDERS BY SHOP
// GET ORDERS BY SHOP
async function getOrdersByShop(shopId) {
  console.log(`[getOrdersByShop] Fetching orders for shopId: ${shopId}`);

  try {
    const result = await pool.query(
      `SELECT 
        o.id AS order_id,
        o.order_number,               -- <--- Added this line to fetch order number
        o.order_date,
        o.payment_method,
        o.total,
        o.order_status,
        o.name AS customer_name,
        o.phone AS customer_phone,
        o.street AS address_street,
        o.city AS address_city,
        o.zip AS address_zip,
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

    console.log(`[getOrdersByShop] Retrieved ${result.rows.length} rows for shop ${shopId}`);

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const {
        order_id,
        order_number,               // <--- Grab order number here
        order_date,
        payment_method,
        total,
        order_status,
        customer_name,
        customer_phone,
        address_street,
        address_city,
        address_zip,
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
          orderNumber: order_number,  // <--- Include order number here
          order_date,
          payment_method,
          total,
          order_status,
          customer_name,
          customer_phone,
          address: {
            street: address_street,
            city: address_city,
            zip: address_zip,
          },
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

    const orders = Array.from(ordersMap.values());
    console.log(`[getOrdersByShop] Processed ${orders.length} orders for shop ${shopId}`);
    return orders;
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
