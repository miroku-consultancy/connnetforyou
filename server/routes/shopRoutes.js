const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Existing: GET shop by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM shops WHERE LOWER(slug) = LOWER($1)',
      [slug]
    );
    const shop = result.rows[0];
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ NEW: GET /api/shops/vendor
router.get('/vendor', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing auth token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    if (decoded.role !== 'vendor') {
      return res.status(403).json({ error: 'Unauthorized vendor access' });
    }

    const shopId = decoded.shop_id;

    const result = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('🛑 Vendor fetch error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
