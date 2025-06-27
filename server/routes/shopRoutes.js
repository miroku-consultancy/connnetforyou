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

    // Send only public info to frontend:
    res.json({
      name: shop.name,
      slug: shop.slug,
      address: shop.address,
      // add more fields here if needed
    });
  } catch (err) {
    console.error('Error fetching shop by slug:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
