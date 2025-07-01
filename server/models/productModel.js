const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// 🔍 Get all products with unit details
const getAllProducts = async (shopId) => {
  try {
    const productRes = await pool.query(
      'SELECT * FROM products WHERE shop_id = $1',
      [shopId]
    );
    const products = productRes.rows;
    if (products.length === 0) return [];

    const productIds = products.map((p) => p.id);
    const unitsRes = await pool.query(
      `SELECT pu.id, pu.product_id, pu.unit_id, pu.price, pu.stock, 
              u.name AS unit_name, u.category AS unit_category
         FROM product_units pu
         JOIN units u ON pu.unit_id = u.id
         WHERE pu.product_id = ANY($1::int[])`,
      [productIds]
    );

    const unitMap = {};
    unitsRes.rows.forEach((unit) => {
      if (!unitMap[unit.product_id]) unitMap[unit.product_id] = [];
      unitMap[unit.product_id].push({
        id: unit.id,
        unit_id: unit.unit_id,
        name: unit.unit_name,
        category: unit.unit_category,
        price: unit.price,
        stock: unit.stock,
      });
    });

    return products.map((product) => ({
      ...product,
      units: unitMap[product.id] || [],
    }));
  } catch (err) {
    console.error('❌ Error in getAllProducts:', err);
    throw err;
  }
};

// 🔍 Get single product
const getProductById = async (id) => {
  try {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('❌ Error in getProductById:', err);
    throw err;
  }
};

// ➕ Add or update product & unit
const addProduct = async ({
  name, description, price, stock, barcode, category, subcategory, image, shop_id,
  unit, unitPrice, unitStock,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert unit if not exists
    await client.query(
      `INSERT INTO units(name, category)
       VALUES ($1, 'quantity')
       ON CONFLICT (name) DO NOTHING`,
      [unit]
    );

    const unitRes = await client.query(`SELECT id FROM units WHERE name = $1`, [unit]);
    const unit_id = unitRes.rows[0]?.id;
    if (!unit_id) throw new Error('Unit not found or failed to insert');

    // Check if product exists
    let productRes = await client.query(
      `SELECT id FROM products WHERE name = $1 AND shop_id = $2`,
      [name, shop_id]
    );

    let product_id;

    if (productRes.rowCount > 0) {
      // Product exists
      product_id = productRes.rows[0].id;
    } else {
      // Create product
      const insertRes = await client.query(
        `INSERT INTO products(name, description, price, stock, barcode, category, subcategory, image, shop_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [name, description, price, stock, barcode, category, subcategory, image, shop_id]
      );
      product_id = insertRes.rows[0].id;
    }

    // Upsert unit for the product
    const unitExistsRes = await client.query(
      `SELECT id FROM product_units WHERE product_id = $1 AND unit_id = $2`,
      [product_id, unit_id]
    );

    if (unitExistsRes.rowCount > 0) {
      await client.query(
        `UPDATE product_units
         SET price = $1, stock = $2
         WHERE product_id = $3 AND unit_id = $4`,
        [unitPrice || price, unitStock || stock, product_id, unit_id]
      );
    } else {
      await client.query(
        `INSERT INTO product_units(product_id, price, stock, unit_id)
         VALUES ($1, $2, $3, $4)`,
        [product_id, unitPrice || price, unitStock || stock, unit_id]
      );
    }

    await client.query('COMMIT');
    return { product_id, unit_id };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in addProduct:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
};
