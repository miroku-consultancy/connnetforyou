const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

module.exports = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    console.error('Authorization header missing');
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');
  const token = parts[1];

  if (!token) {
    console.error('Token missing');
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user (with role/shop) from DB
    const result = await pool.query(
      'SELECT id, email, name, role, shop_id FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = result.rows[0]; // ✅ Now includes role and shop_id
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
