const pool = require('../db');

// Helper function inside createOrder file
async function getUnitIdByName(client, name, category) {
  if (!name) return null;
  const res = await client.query(
    `SELECT id FROM units WHERE name = $1 AND category = $2 LIMIT 1`,
    [name, category]
  );
  return res.rows[0]?.id ?? null;
}

async function createOrder({ items, total, address, paymentMethod, orderDate, userId }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const shopId = items[0].shopId ?? items[0].shop_id;
    if (!shopId) throw new Error('Missing shop ID in order items');

    // other code...

    const orderInsertResult = await client.query(/* insert order query */);
    const orderId = orderInsertResult.rows[0].id;

    for (const item of items) {
      const productId = parseInt(item.id.toString().split('-')[0], 10);

      // Determine unitId: if size or color exist, set unitId null
      const hasSizeOrColor = item.size || item.color;
      const unitIdStr = item.id.toString().split('-')[1];
      const unitId = hasSizeOrColor ? null : (item.unit_id ?? (unitIdStr ? parseInt(unitIdStr, 10) : null));

      // Convert size and color *names* to IDs from units table
      const sizeName = typeof item.size === 'object' ? item.size.name : item.size;
      const colorName = typeof item.color === 'object' ? item.color.name : item.color;

      const sizeId = await getUnitIdByName(client, sizeName, 'clothing');
      const colorId = await getUnitIdByName(client, colorName, 'color');

      console.log(`[createOrder][Item] productId=${productId}, unitId=${unitId}, sizeId=${sizeId} (${sizeName}), colorId=${colorId} (${colorName})`);

      // insert query for order_items here with above IDs
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, name, price, quantity,
          image, shop_id, unit_id, size_id, color_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [orderId, productId, item.name, item.price, item.quantity, item.image, shopId, unitId, sizeId, colorId]
      );
    }

    await client.query('COMMIT');

    return { orderId, orderNumber };

  } catch (err) {
    await client.query('ROLLBACK');
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


module.exports = {
  createOrder,
  getOrdersByUser,
  getOrdersByShop,
};
