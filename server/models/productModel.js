const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// 🔍 Get all products with enriched unit data
const getAllProducts = async (shopId) => {
  console.log('🔍 getAllProducts called with shopId:', shopId);

  try {
    // Fetch products by shopId
    const productRes = await pool.query(
      'SELECT * FROM products WHERE shop_id = $1',
      [shopId]
    );
    const products = productRes.rows;
    console.log(`✅ Found ${products.length} products for shopId ${shopId}`);

    if (products.length === 0) return [];

    // Extract product IDs
    const productIds = products.map((p) => p.id);
    console.log('➡️ Product IDs:', productIds);

    // Fetch product units joined with unit info
    const unitsRes = await pool.query(
      `
      SELECT pu.id, pu.product_id, pu.unit_id, pu.price, pu.stock, 
             u.name AS unit_name, u.category AS unit_category
      FROM product_units pu
      JOIN units u ON pu.unit_id = u.id
      WHERE pu.product_id = ANY($1::int[])
      `,
      [productIds]
    );
    console.log(`✅ Found ${unitsRes.rows.length} unit entries for products`);

    // Map product_id to unit details
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
    console.log('➡️ Constructed unitMap:', unitMap);

    // Enrich products with their units
    const enrichedProducts = products.map((product) => ({
      ...product,
      units: unitMap[product.id] || [],
    }));
    console.log('✅ Enriched products with unit info');

    return enrichedProducts;
  } catch (err) {
    console.error('❌ Error fetching products with units from DB:', err);
    throw err;
  }
};

// 🔍 Get a single product by ID
const getProductById = async (id) => {
  console.log(`🔍 getProductById called with id: ${id}`);

  try {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      console.warn(`⚠️ No product found with id ${id}`);
      return null;
    }
    console.log(`✅ Product found with id ${id}`);
    return res.rows[0];
  } catch (err) {
    console.error(`❌ Error fetching product id ${id} from DB:`, err);
    throw err;
  }
};

// ➕ Add a new product to the DB
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
  console.log('➕ addProduct called with data:', {
    name,
    description,
    price,
    stock,
    barcode,
    category,
    subcategory,
    image,
    shop_id,
  });

  try {
    const result = await pool.query(
      `INSERT INTO products
        (name, description, price, stock, barcode, category, subcategory, image, shop_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, description, price, stock, barcode, category, subcategory, image, shop_id]
    );
    console.log('✅ Product added successfully with id:', result.rows[0].id);
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
