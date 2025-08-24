//const { Pool } = require('pg');
require('dotenv').config();

const pool = require('../db');

// 🔍 Get all products with unit details
// const getAllProducts = async (shopId) => {
//   try {
//     const productRes = await pool.query(
//       `SELECT 
//   p.*, 
//   c.name AS category_name
// FROM products p
// JOIN categories c ON p.category_id = c.id
// WHERE p.shop_id = $1`,
//       [shopId]
//     );

//     const products = productRes.rows;
//     if (products.length === 0) return [];

//     const productIds = products.map((p) => p.id);

//     const unitsRes = await pool.query(
//       `SELECT pu.id, pu.product_id, pu.unit_id, pu.price, pu.stock, 
//               u.name AS unit_name, u.category AS unit_category
//          FROM product_units pu
//          JOIN units u ON pu.unit_id = u.id
//          WHERE pu.product_id = ANY($1::int[])`,
//       [productIds]
//     );

//     const unitMap = {};
//     unitsRes.rows.forEach((unit) => {
//       if (!unitMap[unit.product_id]) unitMap[unit.product_id] = [];
//       unitMap[unit.product_id].push({
//         id: unit.id,
//         unit_id: unit.unit_id,
//         name: unit.unit_name,
//         category: unit.unit_category,
//         price: unit.price,
//         stock: unit.stock,
//       });
//     });

//     return products.map((product) => ({
//       ...product,
//       units: unitMap[product.id] || [],
//     }));
//   } catch (err) {
//     console.error('❌ Error in getAllProducts:', err);
//     throw err;
//   }
// };

const getAllProducts = async (shopId) => {
  try {
    const productRes = await pool.query(
      `SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.shop_id = $1`,
      [shopId]
    );

    const products = productRes.rows;
    if (products.length === 0) return [];

    const productIds = products.map((p) => p.id);

    const variantsRes = await pool.query(
      `SELECT 
         pu.*,
         u.name AS unit_name,
         u.category AS unit_category,
         size.name AS size_name,
         color.name AS color_name
       FROM product_units pu
       LEFT JOIN units u ON pu.unit_id = u.id
       LEFT JOIN units size ON pu.size_id = size.id
       LEFT JOIN units color ON pu.color_id = color.id
       WHERE pu.product_id = ANY($1::int[])`,
      [productIds]
    );

    const variantMap = {};
    variantsRes.rows.forEach((row) => {
      if (!variantMap[row.product_id]) variantMap[row.product_id] = [];

      variantMap[row.product_id].push({
        id: row.id,
        price: row.price,
        stock: row.stock,
        mrp: row.mrp,
        discount: row.discount,
        sku: row.sku,
        barcode: row.barcode,
        images: row.images,
        size: row.size_id ? { id: row.size_id, name: row.size_name } : null,
        color: row.color_id ? { id: row.color_id, name: row.color_name } : null,
        unit: row.unit_id ? { id: row.unit_id, name: row.unit_name, category: row.unit_category } : null
      });
    });

    return products.map((product) => ({
      ...product,
      variants: variantMap[product.id] || []
    }));
  } catch (err) {
    console.error('❌ Error in getAllProducts:', err);
    throw err;
  }
};


// 🔍 Get single product
// Example getProductById for full variant info
const getProductById = async (id) => {
  try {
    // Assume you have join for size/color/unit tables if needed
    const res = await pool.query(`
      SELECT products.*,
        size.name AS size_name,
        color.name AS color_name,
        unit.name AS unit_name
      FROM products
      LEFT JOIN size ON size.id = products.size_id
      LEFT JOIN color ON color.id = products.color_id
      LEFT JOIN unit ON unit.id = products.unit_id
      WHERE products.id = $1
    `, [id]);
    if (!res.rows[0]) return null;
    // Map variant info back in a compatible structure for frontend
    const row = res.rows[0];
    return {
      ...row,
      size: row.size_name ? { name: row.size_name } : undefined,
      color: row.color_name ? { name: row.color_name } : undefined,
      unit: row.unit_name ? { name: row.unit_name } : undefined,
    };
  } catch (err) {
    console.error('❌ Error in getProductById:', err);
    throw err;
  }
};


// ➕ Add or update product & unit
const addProduct = async ({
  name, description, price, stock, barcode, image, shop_id,
  unit, unitPrice, unitStock, category_id
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert unit if not exists
    await client.query(
      `INSERT INTO units(name, category)
       VALUES ($1, 'quantity')
       ON CONFLICT (name) DO NOTHING`,
      [unit]
    );

    const unitRes = await client.query(`SELECT id FROM units WHERE name = $1`, [unit]);
    const unit_id = unitRes.rows[0]?.id;
    if (!unit_id) throw new Error('Unit not found or failed to insert');

    // 2. Check if product exists
    const productRes = await client.query(
      `SELECT id FROM products WHERE name = $1 AND shop_id = $2`,
      [name, shop_id]
    );

    let product_id;
    if (productRes.rowCount > 0) {
      // Update existing
      product_id = productRes.rows[0].id;
    } else {
      // Insert new
      const insertRes = await client.query(
        `INSERT INTO products(name, description, price, stock, barcode, image, shop_id, category_id)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [name, description, price, stock, barcode, image, shop_id, category_id]
      );
      product_id = insertRes.rows[0].id;
    }

    // 3. Upsert unit
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


const updateProductWithUnits = async ({
  id, shop_id, name, description, price, stock,
  barcode, image, category_id, units
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update product
    const updateFields = [];
    const values = [id];
    let idx = 2;

    const fieldMap = {
      name, description, price, stock,
      barcode, image, category_id
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (updateFields.length > 0) {
      await client.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = $1 AND shop_id = $${idx}`,
        [...values, shop_id]
      );
    }

    // Update units
    for (const unit of units) {
      const { name: unitName, price: unitPrice, stock: unitStock } = unit;
      if (!unitName) continue;

      await client.query(
        `INSERT INTO units(name, category)
         VALUES ($1, 'quantity')
         ON CONFLICT (name) DO NOTHING`,
        [unitName]
      );

      const unitRes = await client.query(`SELECT id FROM units WHERE name = $1`, [unitName]);
      const unit_id = unitRes.rows[0]?.id;
      if (!unit_id) throw new Error(`Unit not found: ${unitName}`);

      const existsRes = await client.query(
        `SELECT id FROM product_units WHERE product_id = $1 AND unit_id = $2`,
        [id, unit_id]
      );

      if (existsRes.rowCount > 0) {
        await client.query(
          `UPDATE product_units SET price = $1, stock = $2
           WHERE product_id = $3 AND unit_id = $4`,
          [unitPrice || price, unitStock || stock, id, unit_id]
        );
      } else {
        await client.query(
          `INSERT INTO product_units(product_id, unit_id, price, stock)
           VALUES ($1, $2, $3, $4)`,
          [id, unit_id, unitPrice || price, unitStock || stock]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in updateProductWithUnits:', err);
    throw err;
  } finally {
    client.release();
  }
};



module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProductWithUnits,   // <--- add this line
};
