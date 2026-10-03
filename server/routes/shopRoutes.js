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
      WHERE id NOT IN (1)
      ORDER BY is_featured DESC NULLS LAST, rating DESC, orders_count DESC, created_at DESC
    `);

    console.log(
      `📦 Found ${result.rows.length} shops (excluding IDs 1) for dashboard`
    );

    res.json(result.rows || []);
  } catch (err) {
    console.error('🛑 Public shops fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});


// ============================================================
// GET /api/shops/vendor
// Get current vendor's shop + tenant status
// ============================================================
router.get('/vendor', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Missing auth token'
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization format'
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret'
    );

    console.log('Decoded JWT:', decoded);

    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid user information in token'
      });
    }

    /*
     * Find the vendor store for this user.
     *
     * If the JWT already points to a vendor shop,
     * prefer that shop.
     *
     * Otherwise, find the user's vendor shop from
     * user_shop_roles.
     */
    let result;

    if (decoded.shop_id) {
      result = await pool.query(
        `
        SELECT
          s.*,
          t.status AS tenant_status,
          usr.role
        FROM shops s
        INNER JOIN user_shop_roles usr
          ON usr.shop_id = s.id
         AND usr.user_id = $1
        LEFT JOIN tenants t
          ON t.shop_id = s.id
        WHERE s.id = $2
          AND usr.role = 'vendor'
        LIMIT 1
        `,
        [userId, decoded.shop_id]
      );
    }

    /*
     * Root/customer JWT or selected shop is not a vendor.
     * Find the user's vendor store.
     */
    if (!result || result.rows.length === 0) {
      result = await pool.query(
        `
        SELECT
          s.*,
          t.status AS tenant_status,
          usr.role
        FROM shops s
        INNER JOIN user_shop_roles usr
          ON usr.shop_id = s.id
         AND usr.user_id = $1
         AND usr.role = 'vendor'
        LEFT JOIN tenants t
          ON t.shop_id = s.id
        ORDER BY usr.id ASC
        LIMIT 1
        `,
        [userId]
      );
    }

    console.log('Vendor DB result:', result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No vendor store found for this user'
      });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error('🛑 Vendor fetch error:', err);

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

    return res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});


// ============================================================
// CREATE NEW STORE
//
// Flow:
// Create Store
//      ↓
// Draft
//      ↓
// Add Products / Services
//      ↓
// Submit Store for Approval
//      ↓
// Pending
// ============================================================
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
    // Create tenant as DRAFT
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
        'draft',
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
      message: 'Store created successfully',
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

// ============================================================
// SUBMIT STORE FOR APPROVAL
//
// Flow:
// draft
//   ↓
// pending
//
// Store owner submits the complete store for admin review.
// ============================================================
router.post(
  '/submit-for-approval',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      console.log(
        '[submit-for-approval] userId:',
        userId
      );

      // ---------------------------------------------------
      // Resolve vendor shop from user_shop_roles
      // Do NOT rely on JWT shop_id/role because root login
      // can have shop_id=1 and role=customer.
      // ---------------------------------------------------
      const vendorResult = await pool.query(
        `
        SELECT
          usr.shop_id,
          usr.role,
          s.name,
          s.slug,
          s.store_type,
          t.status AS tenant_status
        FROM user_shop_roles usr
        INNER JOIN shops s
          ON s.id = usr.shop_id
        LEFT JOIN tenants t
          ON t.shop_id = usr.shop_id
        WHERE usr.user_id = $1
          AND usr.role = 'vendor'
        ORDER BY usr.id ASC
        LIMIT 1
        `,
        [userId]
      );

      if (vendorResult.rows.length === 0) {
        return res.status(403).json({
          error: 'You do not have access to a vendor store'
        });
      }

      const shop = vendorResult.rows[0];

      console.log(
        '[submit-for-approval] Vendor shop:',
        shop
      );

      // ---------------------------------------------------
      // Make sure tenant exists
      // ---------------------------------------------------
      if (!shop.tenant_status) {
        return res.status(404).json({
          error: 'Store tenant not found'
        });
      }

      // ---------------------------------------------------
      // Only draft stores can be submitted
      // ---------------------------------------------------
      if (shop.tenant_status !== 'draft') {
        return res.status(400).json({
          error: `Store cannot be submitted from '${shop.tenant_status}' status`
        });
      }

      // ---------------------------------------------------
      // Submit store for approval
      // ---------------------------------------------------
      const updateResult = await pool.query(
        `
        UPDATE tenants
        SET
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $1
          AND status = 'draft'
        RETURNING
          id,
          shop_id,
          slug,
          status,
          updated_at
        `,
        [shop.shop_id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Store could not be submitted for approval'
        });
      }

      const tenant = updateResult.rows[0];

      console.log(
        '[submit-for-approval] Store submitted:',
        tenant
      );

      return res.status(200).json({
        message: 'Store submitted for approval successfully',
        store: {
          id: shop.shop_id,
          name: shop.name,
          slug: shop.slug,
          store_type: shop.store_type,
          tenant_status: tenant.status
        }
      });

    } catch (error) {
      console.error(
        '[submit-for-approval] ERROR:',
        error
      );

      return res.status(500).json({
        error: 'Failed to submit store for approval'
      });
    }
  }
);
// ============================================================
// SWITCH ACTIVE SHOP
// ============================================================
router.post('/switch-shop', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shop_id } = req.body;

    if (!shop_id) {
      return res.status(400).json({
        error: 'shop_id is required'
      });
    }


    // ------------------------------------------------
    // Verify that this user actually belongs to shop
    // ------------------------------------------------
    const roleResult = await pool.query(
      `
      SELECT
        usr.user_id,
        usr.shop_id,
        usr.role,
        s.name,
        s.slug,
        s.store_type,
        t.status AS tenant_status
      FROM user_shop_roles usr
      INNER JOIN shops s
        ON s.id = usr.shop_id
      LEFT JOIN tenants t
        ON t.shop_id = s.id
      WHERE usr.user_id = $1
        AND usr.shop_id = $2
      LIMIT 1
      `,
      [userId, shop_id]
    );


    if (roleResult.rows.length === 0) {
      return res.status(403).json({
        error: 'You do not have access to this shop'
      });
    }


    const shop = roleResult.rows[0];


    // ------------------------------------------------
    // For now, only vendor switching is supported
    // ------------------------------------------------
    if (shop.role !== 'vendor') {
      return res.status(403).json({
        error: 'You are not a vendor for this shop'
      });
    }


    // ------------------------------------------------
    // Create new JWT with selected shop context
    // ------------------------------------------------
    const tokenPayload = {
      id: userId,
      email: req.user.email,
      shop_id: shop.shop_id,
      role: shop.role
    };


    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      {
        expiresIn: '180d'
      }
    );


    return res.json({
      message: 'Shop switched successfully',

      token,

      shop: {
        id: shop.shop_id,
        name: shop.name,
        slug: shop.slug,
        store_type: shop.store_type,
        role: shop.role,
        tenant_status: shop.tenant_status
      }
    });

  } catch (err) {

    console.error('🛑 Switch shop error:', err);

    return res.status(500).json({
      error: 'Failed to switch shop',
      message: err.message
    });
  }
});


// ============================================================
// Existing: GET shop by slug
// ============================================================
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM shops WHERE LOWER(slug) = LOWER($1)',
      [slug]
    );

    const shop = result.rows[0];

    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found'
      });
    }

    res.json(shop);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Server error'
    });
  }
});


// ============================================================
// GET /api/shops?lat=...&lng=...
// ============================================================
router.get('/', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      error: 'Latitude and longitude are required'
    });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const maxDistance = 5; // in km


  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  };


  try {

    const result = await pool.query(`
      SELECT *
      FROM shops 
      WHERE lat IS NOT NULL
        AND lng IS NOT NULL 
        AND (is_featured IS DISTINCT FROM TRUE)
    `);


    const allShops = result.rows;


    const nearbyShops = allShops
      .map(shop => {

        const distance = getDistance(
          userLat,
          userLng,
          shop.lat,
          shop.lng
        );

        return {
          ...shop,
          distance
        };
      })
      .filter(shop => shop.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);


    res.json(
      nearbyShops.map(shop => ({
        id: shop.id,
        slug: shop.slug,
        name: shop.name,
        address: shop.address,
        image_url: shop.image_url,
        lat: shop.lat,
        lng: shop.lng,
        distance: shop.distance
      }))
    );

  } catch (err) {

    console.error('🛑 Nearby shop fetch error:', err);

    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});


module.exports = router;