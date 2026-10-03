const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🔥 PUBLIC SHOPS - EXCLUDE JusPing (ID=1,24)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, address, phone, image_url, 
             open_time, close_time, minordervalue, lat, lng, is_featured,
             COALESCE(rating, 4.2) as rating,
             COALESCE(review_count, 0) as review_count,
             COALESCE(orders_count, 0) as orders_count
      FROM shops 
      WHERE id NOT IN (1)  -- 🚫 EXCLUDE ID 1 & 24
      ORDER BY is_featured DESC NULLS LAST, rating DESC, orders_count DESC, created_at DESC
    `);
    
    console.log(`📦 Found ${result.rows.length} shops (excluding IDs 1) for dashboard`);
    res.json(result.rows || []);
  } catch (err) {
    console.error('🛑 Public shops fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});


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

// ✅ CREATE NEW STORE
// User must be logged in.
// Creates:
// 1. shops row
// 2. tenants row with pending status
// 3. user_shop_roles row with vendor role
router.post('/create', authMiddleware, async (req, res) => {
  const client = await pool.connect();
let transactionStarted = false;

try {
    const userId = req.user.id;

    const {
      name,
      storeType,
      address,
      phone,
      openTime,
      closeTime
    } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Store name is required'
      });
    }

    if (!['product', 'service'].includes(storeType)) {
      return res.status(400).json({
        error: 'Store type must be product or service'
      });
    }

    // -----------------------------
    // Generate slug
    // -----------------------------
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) {
      return res.status(400).json({
        error: 'Invalid store name'
      });
    }

    await client.query('BEGIN');
transactionStarted = true;

    // -----------------------------
    // Make slug unique
    // -----------------------------
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const slugCheck = await client.query(
        'SELECT id FROM shops WHERE LOWER(slug) = LOWER($1) LIMIT 1',
        [slug]
      );

      if (slugCheck.rows.length === 0) {
        break;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // -----------------------------
    // Create shop
    // -----------------------------
    const shopResult = await client.query(
      `
      INSERT INTO shops (
        name,
        slug,
        address,
        phone,
        open_time,
        close_time,
        store_type,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        NOW()
      )
      RETURNING *
      `,
      [
        name.trim(),
        slug,
        address || null,
        phone || null,
        openTime || null,
        closeTime || null,
        storeType
      ]
    );

    const shop = shopResult.rows[0];

    // -----------------------------
    // Create tenant
    // -----------------------------
    const tenantResult = await client.query(
      `
      INSERT INTO tenants (
        shop_id,
        slug,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        'pending',
        NOW(),
        NOW()
      )
      RETURNING *
      `,
      [
        shop.id,
        slug
      ]
    );

    const tenant = tenantResult.rows[0];

    // -----------------------------
    // Link user to new shop
    // -----------------------------
    await client.query(
      `
      INSERT INTO user_shop_roles (
        user_id,
        shop_id,
        role
      )
      VALUES ($1, $2, 'vendor')
      `,
      [
        userId,
        shop.id
      ]
    );

    await client.query('COMMIT');

    console.log(
      `🏪 Store created: ${shop.id} | ${shop.name} | ${storeType} | user ${userId}`
    );

    return res.status(201).json({
      message: 'Store submitted successfully for review',
      shop,
      tenant
    });

  } catch (err) {
  if (transactionStarted) {
    await client.query('ROLLBACK');
  }

  console.error('🛑 Store creation error:', err);

  return res.status(500).json({
    error: 'Failed to create store',
    message: err.message
  });
} finally {
    client.release();
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


module.exports = router;
