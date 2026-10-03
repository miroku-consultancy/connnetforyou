const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

module.exports = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');
  const token = parts[1];

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id=$1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    let roleResult;

    // If JWT contains an active shop, use that shop
    if (decoded.shop_id) {
      roleResult = await pool.query(
        `
        SELECT role, shop_id
        FROM user_shop_roles
        WHERE user_id = $1
          AND shop_id = $2
        LIMIT 1
        `,
        [user.id, decoded.shop_id]
      );
    } else {
      // Backward compatibility for old JWTs
      roleResult = await pool.query(
        `
        SELECT role, shop_id
        FROM user_shop_roles
        WHERE user_id = $1
        ORDER BY id ASC
        LIMIT 1
        `,
        [user.id]
      );
    }

    const roles = roleResult.rows;

    req.user = {
      ...user,
      roles,
      role: roles.length > 0 ? roles[0].role : decoded.role || null,
      shop_id: roles.length > 0 ? roles[0].shop_id : decoded.shop_id || null,
    };

    next();

  } catch (err) {
    console.error('Auth middleware error:', err.message);

    return res.status(403).json({
      error: 'Forbidden'
    });
  }
};