const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Get all products with their units
const getAllProducts = async (shopId) => {
  console.log('🔍 getAllProducts called with shopId:', shopId);
  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.subcategory,
        p.image,
        p.barcode,
        p.shop_id,
        json_agg(
          json_build_object(
            'unit_type', pu.unit_type,
            'price', pu.price,
            'stock', pu.stock
          )
        ) FILTER (WHERE pu.id IS NOT NULL) AS units
      FROM products p
      LEFT JOIN product_units pu ON pu.product_id = p.id
      WHERE p.shop_id = $1
      GROUP BY p.id
      ORDER BY p.name ASC;
      `,
      [shopId]
    );
    console.log('📦 Products fetched with units:', result.rows);
    return result.rows;
  } catch (err) {
    console.error('❌ Error fetching products from DB:', err);
    throw err;
  }
};

// Get a single product by ID with its units
const getProductById = async (id) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.subcategory,
        p.image,
        p.barcode,
        p.shop_id,
        json_agg(
          json_build_object(
            'unit_type', pu.unit_type,
            'price', pu.price,
            'stock', pu.stock
          )
        ) FILTER (WHERE pu.id IS NOT NULL) AS units
      FROM products p
      LEFT JOIN product_units pu ON pu.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id;
      `,
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error(`❌ Error fetching product id ${id} from DB`, err);
    throw err;
  }
};

// Add product (basic version)
const addProduct = async ({
  name,
  description,
  price, // optional if using product_units instead
  stock, // optional if using product_units instead
  barcode,
  category,
  subcategory,
  image,
  shop_id,
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO products
        (name, description, price, stock, barcode, category, subcategory, image, shop_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, description, price, stock, barcode, category, subcategory, image, shop_id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('❌ Error adding product to DB:', err);
    throw err;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
};
