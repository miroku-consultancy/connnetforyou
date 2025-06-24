const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/shops/:slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query('SELECT * FROM shops WHERE slug = $1', [slug]);
    const shop = result.rows[0];
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
