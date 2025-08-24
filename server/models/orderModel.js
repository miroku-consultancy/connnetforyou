const pool = require('../db');

// CREATE ORDER
async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();

  try {
    console.log('[createOrder] Starting order creation...');
    console.log('[createOrder] Received items:', items);

    await client.query('BEGIN');

    // Determine shopId
    const shopId = items[0].shopId ?? items[0].shop_id;
    if (!shopId) throw new Error('Missing shop ID in order items');
    console.log(`[createOrder] shopId: ${shopId}`);

    // Get minOrderValue
    const shopResult = await client.query(`SELECT minordervalue FROM shops WHERE id = $1`, [shopId]);
    if (shopResult.rows.length === 0) throw new Error(`Shop with ID ${shopId} not found`);
    const minOrderValue = parseFloat(shopResult.rows[0].minordervalue);
    console.log(`[createOrder] Shop's minOrderValue: ${minOrderValue}`);

    const isTakeaway = total < minOrderValue;
    console.log(`[createOrder] isTakeaway: ${isTakeaway}`);

    // Lock for concurrency
    await client.query(`SELECT id FROM orders WHERE shop_id = $1 FOR UPDATE`, [shopId]);
    console.log('[createOrder] Locked orders for concurrency');

    // Get next order number
    const { rows } = await client.query(
      `SELECT COALESCE(MAX(order_number), 0) + 1 AS next_order_number FROM orders WHERE shop_id = $1`,
      [shopId]
    );
    const orderNumber = rows[0].next_order_number;
    console.log(`[createOrder] Next order number: ${orderNumber}`);

    // Insert order
    const orderInsertResult = await client.query(
      `INSERT INTO orders (
        user_id, total, name, street, city, zip, phone,
        payment_method, order_date, order_status, shop_id, order_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', $10, $11)
      RETURNING id`,
      [
        userId,
        total,
        isTakeaway ? 'Takeaway' : address.name,
        isTakeaway ? '' : address.street,
        isTakeaway ? '' : address.city,
        isTakeaway ? '' : address.zip,
        isTakeaway ? '' : address.phone,
        paymentMethod,
        orderDate,
        shopId,
        orderNumber,
      ]
    );
    const orderId = orderInsertResult.rows[0].id;
    console.log(`[createOrder] Inserted order ID: ${orderId}`);

    // Prepare multi-row insert for order_items
    const values = [];
    const placeholders = [];
    items.forEach((item, idx) => {
      const productId = parseInt(item.id.toString().split('-')[0], 10);
      const unitIdStr = item.id.toString().split('-')[1];
      const unitId = item.unit_id ?? (unitIdStr ? parseInt(unitIdStr, 10) : null);
      const sizeId = item.size ? (typeof item.size === 'object' ? item.size.id : item.size) : null;
      const colorId = item.color ? (typeof item.color === 'object' ? item.color.id : item.color) : null;

      console.log(`[createOrder][Item ${idx}] productId=${productId}, unitId=${unitId}, sizeId=${sizeId}, colorId=${colorId}`);

      // For each item, create a parameter set for the query:
      // (order_id, product_id, name, price, quantity, image, shop_id, unit_id, size_id, color_id)
      placeholders.push(
        `($${idx*10 + 1}, $${idx*10 + 2}, $${idx*10 + 3}, $${idx*10 + 4}, $${idx*10 + 5}, $${idx*10 + 6}, $${idx*10 + 7}, $${idx*10 + 8}, $${idx*10 + 9}, $${idx*10 + 10})`
      );
      values.push(
        orderId, productId, item.name, item.price, item.quantity,
        item.image, shopId, unitId, sizeId, colorId
      );
    });

    const insertQuery = `
      INSERT INTO order_items (
        order_id, product_id, name, price, quantity,
        image, shop_id, unit_id, size_id, color_id
      ) VALUES ${placeholders.join(',')}`;

    await client.query(insertQuery, values);

    await client.query('COMMIT');
    console.log(`[createOrder] Order ${orderId} committed successfully with ${items.length} items.`);

    return { orderId, orderNumber };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[createOrder] Error:', err.message, err.stack);
    throw err;
  } finally {
    client.release();
  }
}


// GET ORDERS BY USER
async function getOrdersByUser(userId) {
  try {
    const result = await pool.query(
      `SELECT 
         o.id AS order_id,
         o.total,
         o.order_date,
         o.order_status,
         oi.product_id,
         oi.name,
         oi.price,
         oi.quantity,
         oi.image,
         oi.unit_id,
         u.name AS unit_name,
         u.category AS unit_category,
         oi.size_id,
         s.name AS size_name,
         oi.color_id,
         c.name AS color_name
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN units u ON oi.unit_id = u.id
       LEFT JOIN units s ON oi.size_id = s.id
       LEFT JOIN units c ON oi.color_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.order_date DESC, o.id`,
      [userId]
    );

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const { order_id, total, order_date, order_status,
        product_id, name, price, quantity, image,
        unit_id, unit_name, unit_category,
        size_id, size_name,
        color_id, color_name } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          total,
          order_date,
          order_status,
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
        size: size_id ? { id: size_id, name: size_name } : null,
        color: color_id ? { id: color_id, name: color_name } : null,
      });
    });
    return Array.from(ordersMap.values());
  } catch (err) {
    console.error('[getOrdersByUser] Error fetching orders:', err.message);
    throw err;
  }
}

// GET ORDERS BY SHOP
async function getOrdersByShop(shopId) {
  try {
    const result = await pool.query(
      `SELECT 
         o.id AS order_id,
         o.order_number,
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
         u.category AS unit_category,
         oi.size_id,
         size_unit.name AS size_name,
         oi.color_id,
         color_unit.name AS color_name
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN units u ON oi.unit_id = u.id
       LEFT JOIN units size_unit ON oi.size_id = size_unit.id
       LEFT JOIN units color_unit ON oi.color_id = color_unit.id
       WHERE oi.shop_id = $1
       ORDER BY o.order_date DESC, o.id`,
      [shopId]
    );

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const { order_id, order_number, order_date, payment_method, total,
        order_status, customer_name, customer_phone,
        address_street, address_city, address_zip,
        product_id, product_name, price, quantity,
        unit_name, unit_category,
        size_id, size_name,
        color_id, color_name } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          orderNumber: order_number,
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
        unit: unit_name ? { name: unit_name, category: unit_category } : null,
        size: size_id ? { id: size_id, name: size_name } : null,
        color: color_id ? { id: color_id, name: color_name } : null,
      });
    });
    return Array.from(ordersMap.values());
  } catch (err) {
    console.error('[getOrdersByShop] Error fetching orders:', err.message);
    throw err;
  }
}

// GET ORDERS BY USER
async function getOrdersByUser(userId) {
  try {
    const result = await pool.query(
      `SELECT 
         o.id AS order_id,
         o.total,
         o.order_date,
         o.order_status,
         oi.product_id,
         oi.name,
         oi.price,
         oi.quantity,
         oi.image,
         oi.unit_id,
         u.name AS unit_name,
         u.category AS unit_category,
         oi.size_id,
         s.name AS size_name,
         oi.color_id,
         c.name AS color_name
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN units u ON oi.unit_id = u.id
       LEFT JOIN units s ON oi.size_id = s.id
       LEFT JOIN units c ON oi.color_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.order_date DESC, o.id`,
      [userId]
    );

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const { order_id, total, order_date, order_status,
        product_id, name, price, quantity, image,
        unit_id, unit_name, unit_category,
        size_id, size_name,
        color_id, color_name } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          total,
          order_date,
          order_status,
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
        size: size_id ? { id: size_id, name: size_name } : null,
        color: color_id ? { id: color_id, name: color_name } : null,
      });
    });
    return Array.from(ordersMap.values());
  } catch (err) {
    console.error('[getOrdersByUser] Error fetching orders:', err.message);
    throw err;
  }
}

// GET ORDERS BY SHOP
async function getOrdersByShop(shopId) {
  try {
    const result = await pool.query(
      `SELECT 
         o.id AS order_id,
         o.order_number,
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
         u.category AS unit_category,
         oi.size_id,
         size_unit.name AS size_name,
         oi.color_id,
         color_unit.name AS color_name
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN units u ON oi.unit_id = u.id
       LEFT JOIN units size_unit ON oi.size_id = size_unit.id
       LEFT JOIN units color_unit ON oi.color_id = color_unit.id
       WHERE oi.shop_id = $1
       ORDER BY o.order_date DESC, o.id`,
      [shopId]
    );

    const ordersMap = new Map();

    result.rows.forEach(row => {
      const { order_id, order_number, order_date, payment_method, total,
        order_status, customer_name, customer_phone,
        address_street, address_city, address_zip,
        product_id, product_name, price, quantity,
        unit_name, unit_category,
        size_id, size_name,
        color_id, color_name } = row;

      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          id: order_id,
          orderNumber: order_number,
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
        unit: unit_name ? { name: unit_name, category: unit_category } : null,
        size: size_id ? { id: size_id, name: size_name } : null,
        color: color_id ? { id: color_id, name: color_name } : null,
      });
    });
    return Array.from(ordersMap.values());
  } catch (err) {
    console.error('[getOrdersByShop] Error fetching orders:', err.message);
    throw err;
  }
}

module.exports = {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
};
