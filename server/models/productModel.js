const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Get all products
const getAllProducts = async (shopId) => {
  const result = await pool.query('SELECT * FROM products WHERE shop_id = $1', [shopId]);
  const products = result.rows;
  const productIds = products.map(p => p.id);

  const unitsResult = await pool.query(
    'SELECT * FROM product_units WHERE product_id = ANY($1::int[])',
    [productIds]
  );

  const unitMap = unitsResult.rows.reduce((map, unit) => {
    if (!map[unit.product_id]) map[unit.product_id] = [];
    map[unit.product_id].push(unit);
    return map;
  }, {});

  return products.map((product) => ({
    ...product,
    units: unitMap[product.id] || [],
  }));
};




// Get product by ID
const getProductById = async (id) => {
  try {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0];
  } catch (err) {
    console.error(`Error fetching product id ${id} from DB`, err);
    throw err;
  }
};

// Add product to DB
const addProduct = async ({
  name,
  description,
  price,
  stock,
  barcode,
  category,
  subcategory,
  image,     // Add this here
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
  addProduct, // ✅ Make sure this is exported
};
