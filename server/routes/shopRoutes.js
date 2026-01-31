const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// ✅ NEW: GET /api/shops/vendor
router.get('/vendor', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing auth token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Decoded JWT:', decoded);

    if (decoded.role !== 'vendor') {
      return res.status(403).json({ error: 'Unauthorized vendor access' });
    }

    const shopId = decoded.shop_id;

    console.log('Fetching shop for shopId:', shopId);
    const result = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    console.log('DB result rows:', result.rows);


    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('🛑 Vendor fetch error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

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

// ✅ NEW: GET /api/shops?lat=...&lng=...
router.get('/', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const maxDistance = 5; // in km

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  try {
    const result = await pool.query(`
  SELECT * FROM shops 
  WHERE lat IS NOT NULL AND lng IS NOT NULL 
    AND (is_featured IS DISTINCT FROM TRUE)
`);

    const allShops = result.rows;

    const nearbyShops = allShops
      .map(shop => {
        const distance = getDistance(userLat, userLng, shop.lat, shop.lng);
        return { ...shop, distance };
      })
      .filter(shop => shop.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyShops.map(shop => ({
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      address: shop.address,
      image_url: shop.image_url,
      lat: shop.lat,
      lng: shop.lng,
      distance: shop.distance
    })));
  } catch (err) {
    console.error('🛑 Nearby shop fetch error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// 🔥 ADD THIS NEW ROUTE - GET /api/shops/public (ALL shops for dashboard)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, address, phone, image_url, 
             open_time, close_time, minordervalue, lat, lng, is_featured 
      FROM shops 
      ORDER BY is_featured DESC NULLS LAST, created_at DESC
    `);
    
    console.log(`📦 Found ${result.rows.length} shops for dashboard`);
    res.json(result.rows);
  } catch (err) {
    console.error('🛑 Public shops fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch shops', message: err.message });
  }
});


module.exports = router;
