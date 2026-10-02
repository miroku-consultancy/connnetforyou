const pool = require('../db');

// Helper: batch get unit IDs by names and category
async function getUnitIdsByNames(client, names, category) {
  if (!names.length) return {};
  const res = await client.query(
    `SELECT id, name FROM units WHERE name = ANY($1) AND category = $2`,
    [names, category]
  );
  return res.rows.reduce((acc, row) => {
    acc[row.name] = row.id;
    return acc;
  }, {});
}

// CREATE ORDER
// CREATE ORDER
async function createOrder({
  items,
  total,
  address,
  paymentMethod,
  orderDate,
  userId,
}) {
  const client = await pool.connect();

  try {
    console.log('[createOrder] Starting order creation...');
    console.log('[createOrder] Received items:', items);

    await client.query('BEGIN');

    // --------------------------------------------------
    // DETERMINE SHOP
    // --------------------------------------------------

    const shopId =
      items[0].shopId ??
      items[0].shop_id;

    if (!shopId) {
      throw new Error('Missing shop ID in order items');
    }

    console.log(`[createOrder] shopId: ${shopId}`);

    // --------------------------------------------------
    // GET SHOP MIN ORDER VALUE
    // --------------------------------------------------

    const shopResult = await client.query(
      `SELECT minordervalue
       FROM shops
       WHERE id = $1`,
      [shopId]
    );

    if (shopResult.rows.length === 0) {
      throw new Error(
        `Shop with ID ${shopId} not found`
      );
    }

    const minOrderValue =
      parseFloat(
        shopResult.rows[0].minordervalue
      ) || 0;

    console.log(
      `[createOrder] Shop minOrderValue: ${minOrderValue}`
    );

    // --------------------------------------------------
    // SERVICE / PRODUCT ORDER
    // --------------------------------------------------

    const isServiceOrder =
      items.length > 0 &&
      items.every(
        (item) => item.cartType === 'service'
      );

    const isTakeaway =
      !isServiceOrder &&
      total < minOrderValue;

    console.log(
      `[createOrder] isServiceOrder: ${isServiceOrder}`
    );

    console.log(
      `[createOrder] isTakeaway: ${isTakeaway}`
    );

    // --------------------------------------------------
    // VALIDATE ADDRESS
    // --------------------------------------------------

    if (!address && !isTakeaway) {
      throw new Error(
        'Address is required for this order'
      );
    }

    // --------------------------------------------------
    // LOCK ORDERS FOR CONCURRENCY
    // --------------------------------------------------

    await client.query(
      `SELECT id
       FROM orders
       WHERE shop_id = $1
       FOR UPDATE`,
      [shopId]
    );

    console.log(
      '[createOrder] Locked orders for concurrency'
    );

    // --------------------------------------------------
    // NEXT ORDER NUMBER
    // --------------------------------------------------

    const { rows } = await client.query(
      `SELECT COALESCE(MAX(order_number), 0) + 1
       AS next_order_number
       FROM orders
       WHERE shop_id = $1`,
      [shopId]
    );

    const orderNumber =
      rows[0].next_order_number;

    console.log(
      `[createOrder] Next order number: ${orderNumber}`
    );

    // --------------------------------------------------
    // INSERT ORDER
    // --------------------------------------------------

    const orderInsertResult =
      await client.query(
        `INSERT INTO orders (
          user_id,
          total,
          name,
          street,
          city,
          zip,
          phone,
          payment_method,
          order_date,
          order_status,
          shop_id,
          order_number
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          'Pending',
          $10,
          $11
        )
        RETURNING id`,
        [
          userId,
          total,

          isTakeaway
            ? 'Takeaway'
            : address?.name || '',

          isTakeaway
            ? ''
            : address?.street || '',

          isTakeaway
            ? ''
            : address?.city || '',

          isTakeaway
            ? ''
            : address?.zip || '',

          isTakeaway
            ? ''
            : address?.phone || '',

          paymentMethod,
          orderDate,
          shopId,
          orderNumber,
        ]
      );

    const orderId =
      orderInsertResult.rows[0].id;

    console.log(
      `[createOrder] Inserted order ID: ${orderId}`
    );

    // ==================================================
    // SERVICE ORDER
    // ==================================================

    if (isServiceOrder) {
      console.log(
        '[createOrder] Processing service items...'
      );

      for (const [index, item] of items.entries()) {
        console.log(
          `[createOrder][Service ${index}]`,
          item
        );

        await client.query(
          `INSERT INTO order_items (
            order_id,
            product_id,
            name,
            price,
            quantity,
            image,
            shop_id,
            unit_id,
            unit_type,
            size_id,
            color_id,
            cart_type,
            service_id,
            service_name,
            appointment_date,
            appointment_time,
            requirements,
            pricing_type
          )
          VALUES (
            $1,
            NULL,
            $2,
            $3,
            $4,
            $5,
            $6,
            NULL,
            NULL,
            NULL,
            NULL,
            'service',
            $7,
            $8,
            $9,
            $10,
            $11,
            $12
          )`,
          [
            orderId,

            item.name,

            Number(item.price || 0),

            Number(item.quantity || 1),

            item.image || null,

            item.shopId ??
              item.shop_id ??
              shopId,

            item.serviceId
              ? Number(item.serviceId)
              : null,

            item.serviceName ||
              item.name ||
              null,

            item.appointmentDate ||
              null,

            item.appointmentTime ||
              null,

            item.requirements ||
              null,

            item.pricingType ||
              'fixed',
          ]
        );
      }

      console.log(
        `[createOrder] Service order ${orderId} saved successfully.`
      );
    }

    // ==================================================
    // PRODUCT ORDER
    // ==================================================

    else {
      console.log(
        '[createOrder] Processing product items...'
      );

      // ----------------------------------------------
      // SIZE / COLOR NAMES
      // ----------------------------------------------

      const sizeNames = [
        ...new Set(
          items
            .map((item) =>
              item.size &&
              typeof item.size === 'object'
                ? item.size.name
                : item.size
            )
            .filter(Boolean)
        ),
      ];

      const colorNames = [
        ...new Set(
          items
            .map((item) =>
              item.color &&
              typeof item.color === 'object'
                ? item.color.name
                : item.color
            )
            .filter(Boolean)
        ),
      ];

      const sizeIdMap =
        await getUnitIdsByNames(
          client,
          sizeNames,
          'clothing'
        );

      const colorIdMap =
        await getUnitIdsByNames(
          client,
          colorNames,
          'color'
        );

      // ----------------------------------------------
      // BUILD PRODUCT INSERT
      // ----------------------------------------------

      const values = [];
      const placeholders = [];

      items.forEach((item, idx) => {
        console.log(
          `[createOrder][Product ${idx}] Raw item:`,
          item
        );

        const [
          productIdStr,
          unitIdStr,
        ] = item.id
          .toString()
          .split(/-+/);

        const productId =
          parseInt(productIdStr, 10);

        if (Number.isNaN(productId)) {
          throw new Error(
            `Invalid product ID: ${item.id}`
          );
        }

        const sizeName =
          item.size &&
          typeof item.size === 'object'
            ? item.size.name
            : typeof item.size === 'string'
              ? item.size
              : null;

        const colorName =
          item.color &&
          typeof item.color === 'object'
            ? item.color.name
            : typeof item.color === 'string'
              ? item.color
              : null;

        const sizeId =
          sizeName &&
          sizeIdMap[sizeName]
            ? sizeIdMap[sizeName]
            : null;

        const colorId =
          colorName &&
          colorIdMap[colorName]
            ? colorIdMap[colorName]
            : null;

        const shouldUseUnitId =
          !sizeId && !colorId;

        const unitId =
          shouldUseUnitId
            ? (
                item.unit_id ??
                (
                  unitIdStr &&
                  unitIdStr.trim()
                    ? parseInt(
                        unitIdStr,
                        10
                      )
                    : null
                )
              )
            : null;

        console.log(
          `[ITEM DEBUG] sizeName="${sizeName}", ` +
          `colorName="${colorName}", ` +
          `sizeId=${sizeId}, ` +
          `colorId=${colorId}, ` +
          `unitId=${unitId}`
        );

        if (
          sizeName &&
          !sizeId
        ) {
          console.warn(
            `[createOrder] Warning: Size '${sizeName}' not found in DB`
          );
        }

        if (
          colorName &&
          !colorId
        ) {
          console.warn(
            `[createOrder] Warning: Color '${colorName}' not found in DB`
          );
        }

        const base =
          idx * 10;

        placeholders.push(
          `(
            $${base + 1},
            $${base + 2},
            $${base + 3},
            $${base + 4},
            $${base + 5},
            $${base + 6},
            $${base + 7},
            $${base + 8},
            $${base + 9},
            $${base + 10}
          )`
        );

        values.push(
          orderId,
          productId,
          item.name,
          item.price,
          item.quantity,
          item.image,
          shopId,
          unitId,
          sizeId,
          colorId
        );
      });

      const insertQuery = `
        INSERT INTO order_items (
          order_id,
          product_id,
          name,
          price,
          quantity,
          image,
          shop_id,
          unit_id,
          size_id,
          color_id
        )
        VALUES ${placeholders.join(',')}
      `;

      await client.query(
        insertQuery,
        values
      );

      console.log(
        `[createOrder] Product order ${orderId} saved successfully.`
      );
    }

    // --------------------------------------------------
    // COMMIT
    // --------------------------------------------------

    await client.query('COMMIT');

    console.log(
      `[createOrder] Order ${orderId} committed successfully with ${items.length} items.`
    );

    return {
      orderId,
      orderNumber,
    };

  } catch (err) {
    await client.query('ROLLBACK');

    console.error(
      '[createOrder] Error:',
      err.message,
      err.stack
    );

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
  unit: unit_id ? { id: unit_id, name: unit_name, category: unit_category } : null,
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
         oi.unit_id,                    -- added unit_id here
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
        unit_id, unit_name, unit_category,    // destructure unit_id here
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
        unit: unit_id ? { id: unit_id, name: unit_name, category: unit_category } : null,  // include id here
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
