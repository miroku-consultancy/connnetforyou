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
    // Fetch products by shopId
    const productRes = await pool.query(
      'SELECT * FROM products WHERE shop_id = $1',
      [shopId]
    );
    const products = productRes.rows;

    if (products.length === 0) return [];

    // Extract product IDs
    const productIds = products.map((p) => p.id);

    // Fetch units for all product IDs
    const unitsRes = await pool.query(
      'SELECT * FROM product_units WHERE product_id = ANY($1::int[])',
      [productIds]
    );

    const unitMap = {};
    unitsRes.rows.forEach((unit) => {
      if (!unitMap[unit.product_id]) {
        unitMap[unit.product_id] = [];
      }
      unitMap[unit.product_id].push({
        id: unit.id,
        name: unit.name,
        price: unit.price,
        stock: unit.stock,
      });
    });

    // Attach units to products
    const enrichedProducts = products.map((product) => ({
      ...product,
      units: unitMap[product.id] || [], // attach units or empty array
    }));

    return enrichedProducts;
  } catch (err) {
    console.error('❌ Error fetching products with units from DB', err);
    throw err;
  }
};

// Get a single product by ID
const getProductById = async (id) => {
  try {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0];
  } catch (err) {
    console.error(`Error fetching product id ${id} from DB`, err);
    throw err;
  }
};

// Add new product to DB
const addProduct = async ({
  name,
  description,
  price,
  stock,
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
    console.error('Error adding product to DB:', err);
    throw err;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
};
