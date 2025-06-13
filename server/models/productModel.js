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
const getAllProducts = async () => {
  console.log('Model: getAllProducts called');
  try {
    const res = await pool.query('SELECT * FROM products ORDER BY id');
    return res.rows;
  } catch (err) {
    console.error('Error fetching products from DB', err);
    throw err;
  }
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

module.exports = {
  getAllProducts,
  getProductById,
};
