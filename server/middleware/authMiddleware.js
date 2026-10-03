const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    // --------------------------------------------------
    // 1. Get Authorization header
    // --------------------------------------------------
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    // Expected:
    // Authorization: Bearer <token>

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization format'
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token missing'
      });
    }

    // --------------------------------------------------
    // 2. Verify JWT
    // --------------------------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log('[authMiddleware] Token decoded:', decoded);

    // --------------------------------------------------
    // 3. Find user
    // --------------------------------------------------
    const userResult = await pool.query(
      `
      SELECT
        id,
        email,
        name
      FROM users
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // --------------------------------------------------
    // 4. Resolve active shop/role
    // --------------------------------------------------
    let roleResult;

    /*
      New tokens created by switch-shop contain:

      shop_id
      role

      Therefore, when shop_id exists in JWT,
      we MUST resolve the role for that specific shop.
    */

    if (decoded.shop_id) {
      roleResult = await pool.query(
        `
        SELECT
          role,
          shop_id
        FROM user_shop_roles
        WHERE user_id = $1
          AND shop_id = $2
        LIMIT 1
        `,
        [
          user.id,
          decoded.shop_id
        ]
      );
    } else {
      /*
        Backward compatibility for old JWTs
        that don't contain shop_id.
      */

      roleResult = await pool.query(
        `
        SELECT
          role,
          shop_id
        FROM user_shop_roles
        WHERE user_id = $1
        ORDER BY id ASC
        LIMIT 1
        `,
        [user.id]
      );
    }

    const roles = roleResult.rows;

    // --------------------------------------------------
    // 5. Build authenticated user
    // --------------------------------------------------

    const activeRole =
      roles.length > 0
        ? roles[0].role
        : decoded.role || null;

    const activeShopId =
      roles.length > 0
        ? roles[0].shop_id
        : decoded.shop_id || null;

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,

      // All resolved roles
      roles,

      // Currently active shop context
      role: activeRole,
      shop_id: activeShopId
    };

    console.log(
      '[authMiddleware] Authenticated user:',
      req.user
    );

    // --------------------------------------------------
    // 6. Continue request
    // --------------------------------------------------

    next();

  } catch (err) {

    console.error(
      '[authMiddleware] Authentication error:',
      err
    );

    // JWT specific errors
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expired'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token'
      });
    }

    // Database / unexpected errors
    return res.status(403).json({
      error: 'Forbidden'
    });
  }
};