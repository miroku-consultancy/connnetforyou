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
    console.log('[authMiddleware] Token decoded:', decoded);

    // Get basic user info
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      console.error('[authMiddleware] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get all roles for the user from user_shop_roles
    const roleResult = await pool.query(
      'SELECT role, shop_id FROM user_shop_roles WHERE user_id = $1',
      [user.id]
    );

    const roles = roleResult.rows;

    // Attach user to request
    req.user = {
      ...user,
      roles, // e.g. [{ role: 'vendor', shop_id: 12 }, { role: 'admin', shop_id: null }]
      role: roles.length > 0 ? roles[0].role : null, // for backward compatibility
      shop_id: roles.length > 0 ? roles[0].shop_id : null, // default shop_id (optional)
    };

    console.log('[authMiddleware] Authenticated user:', req.user);
    next();
  } catch (err) {
    console.error('[authMiddleware] Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
