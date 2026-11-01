
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const authMiddleware = require('../middleware/authMiddleware');
const masterAdminMiddleware = require('../middleware/masterAdminMiddleware');

const productModel = require('../models/productModel');
const serviceModel = require('../models/serviceModel');

const router = express.Router();

// ============================================================
// MASTER ADMIN ACCESS TEST
// GET /api/shops/admin/check
// ============================================================
router.get(
  '/admin/check',
  authMiddleware,
  masterAdminMiddleware,
  async (req, res) => {
    return res.json({
      success: true,
      message: 'Master admin access verified',
      admin: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    });
  }
);


// ============================================================
// MASTER ADMIN - GET PENDING SHOPS
// GET /api/shops/admin/pending
// ============================================================
router.get(
  '/admin/pending',
  authMiddleware,
  masterAdminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          s.*,
          t.id AS tenant_id,
          t.slug AS tenant_slug,
          t.status AS tenant_status,
          t.created_at AS submitted_at,
          t.updated_at AS status_updated_at
        FROM tenants t
        INNER JOIN shops s ON s.id = t.shop_id
        WHERE t.status = 'pending'
        ORDER BY t.updated_at ASC
      `);

      return res.json({
        success: true,
        count: result.rows.length,
        shops: result.rows
      });
    } catch (error) {
      console.error('[Admin] Pending shops error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to load pending shops'
      });
    }
  }
);


// ============================================================
// MASTER ADMIN - GET SHOP REVIEW DETAILS
// GET /api/shops/admin/:shopId/review
// ============================================================
router.get(
  '/admin/:shopId/review',
  authMiddleware,
  masterAdminMiddleware,
  async (req, res) => {
    try {
      const shopId = Number(req.params.shopId);

      if (!Number.isInteger(shopId) || shopId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid shop ID'
        });
      }

      const shopResult = await pool.query(
        `
        SELECT
          s.*,
          t.id AS tenant_id,
          t.slug AS tenant_slug,
          t.status AS tenant_status,
          t.created_at AS tenant_created_at,
          t.updated_at AS tenant_updated_at
        FROM shops s
        INNER JOIN tenants t ON t.shop_id = s.id
        WHERE s.id = $1
        `,
        [shopId]
      );

      if (shopResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Shop not found'
        });
      }

      const [products, services] = await Promise.all([
        productModel.getAllProducts(shopId),
        serviceModel.getServicesByShop({ shopId })
      ]);

      return res.json({
        success: true,
        shop: shopResult.rows[0],
        products: products || [],
        services: services || []
      });
    } catch (error) {
      console.error('[Admin] Shop review error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to load shop review'
      });
    }
  }
);


// ============================================================
// MASTER ADMIN - APPROVE SHOP
// POST /api/shops/admin/:shopId/approve
// ============================================================
router.post(
  '/admin/:shopId/approve',
  authMiddleware,
  masterAdminMiddleware,
  async (req, res) => {
    try {
      const shopId = Number(req.params.shopId);

      if (!Number.isInteger(shopId) || shopId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid shop ID'
        });
      }

      const result = await pool.query(
        `
        UPDATE tenants
        SET
          status = 'approved',
          updated_at = NOW()
        WHERE shop_id = $1
          AND status = 'pending'
        RETURNING id, shop_id, slug, status, updated_at
        `,
        [shopId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Pending shop not found or already reviewed'
        });
      }

      return res.json({
        success: true,
        message: 'Shop approved successfully',
        tenant: result.rows[0]
      });
    } catch (error) {
      console.error('[Admin] Approve shop error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to approve shop'
      });
    }
  }
);


// ============================================================
// MASTER ADMIN - REJECT SHOP
// POST /api/shops/admin/:shopId/reject
// ============================================================
router.post(
  '/admin/:shopId/reject',
  authMiddleware,
  masterAdminMiddleware,
  async (req, res) => {
    try {
      const shopId = Number(req.params.shopId);

      if (!Number.isInteger(shopId) || shopId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid shop ID'
        });
      }

      const result = await pool.query(
        `
        UPDATE tenants
        SET
          status = 'rejected',
          updated_at = NOW()
        WHERE shop_id = $1
          AND status = 'pending'
        RETURNING id, shop_id, slug, status, updated_at
        `,
        [shopId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Pending shop not found or already reviewed'
        });
      }

      return res.json({
        success: true,
        message: 'Shop rejected successfully',
        tenant: result.rows[0]
      });
    } catch (error) {
      console.error('[Admin] Reject shop error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to reject shop'
      });
    }
  }
);


// ============================================================
// PUBLIC SHOPS
// Only approved tenant shops are visible
// GET /api/shops/public
// ============================================================
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.address,
        s.phone,
        s.image_url,
         s.store_type,
        s.open_time,
        s.close_time,
        s.minordervalue,
        s.lat,
        s.lng,
        s.is_featured,
        COALESCE(s.rating, 4.2) AS rating,
        COALESCE(s.review_count, 0) AS review_count,
        COALESCE(s.orders_count, 0) AS orders_count
      FROM shops s
      INNER JOIN tenants t
        ON t.shop_id = s.id
       AND t.status IN ('approved', 'active')
      WHERE s.id NOT IN (1)
      ORDER BY
        s.is_featured DESC NULLS LAST,
        s.rating DESC,
        s.orders_count DESC,
        s.created_at DESC
    `);

    console.log(
      `Found ${result.rows.length} approved shops for dashboard`
    );

    return res.json(result.rows || []);
  } catch (err) {
    console.error('Public shops fetch error:', err);

    return res.status(500).json({
      error: 'Failed to fetch shops'
    });
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

    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid user information in token'
      });
    }

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

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No vendor store found for this user'
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Vendor fetch error:', err);

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
// Initial status: draft
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

    await client.query(
      'SELECT pg_advisory_xact_lock($1::bigint)',
      [userId]
    );

    const existingStore = await client.query(
      `
      SELECT shop_id
      FROM user_shop_roles
      WHERE user_id = $1
        AND role = 'vendor'
      LIMIT 1
      `,
      [userId]
    );

    if (existingStore.rows.length > 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(409).json({
        error: 'STORE_ALREADY_EXISTS',
        message: 'You already have a store. You cannot create another store.'
      });
    }

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
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
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

    const tenantResult = await client.query(
      `
      INSERT INTO tenants (
        shop_id,
        slug,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'draft', NOW(), NOW())
      RETURNING *
      `,
      [shop.id, slug]
    );

    const tenant = tenantResult.rows[0];

    await client.query(
      `
      INSERT INTO user_shop_roles (
        user_id,
        shop_id,
        role
      )
      VALUES ($1, $2, 'vendor')
      `,
      [userId, shop.id]
    );

    await client.query('COMMIT');

    console.log(
      `Store created: ${shop.id} | ${shop.name} | ${storeType} | user ${userId}`
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

    console.error('Store creation error:', err);

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
// draft -> pending
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

      if (!shop.tenant_status) {
        return res.status(404).json({
          error: 'Store tenant not found'
        });
      }

      if (shop.tenant_status !== 'draft') {
        return res.status(400).json({
          error: `Store cannot be submitted from '${shop.tenant_status}' status`
        });
      }

      const updateResult = await pool.query(
        `
        UPDATE tenants
        SET
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $1
          AND status = 'draft'
        RETURNING id, shop_id, slug, status, updated_at
        `,
        [shop.shop_id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Store could not be submitted for approval'
        });
      }

      const tenant = updateResult.rows[0];

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
      console.error('[submit-for-approval] ERROR:', error);

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

    if (shop.role !== 'vendor') {
      return res.status(403).json({
        error: 'You are not a vendor for this shop'
      });
    }

    const tokenPayload = {
      id: userId,
      email: req.user.email,
      shop_id: shop.shop_id,
      role: shop.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '180d' }
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
    console.error('Switch shop error:', err);

    return res.status(500).json({
      error: 'Failed to switch shop',
      message: err.message
    });
  }
});


// ============================================================
// GET SHOP BY SLUG
// Only approved shops are publicly accessible
// ============================================================
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT s.*
      FROM shops s
      INNER JOIN tenants t
        ON t.shop_id = s.id
       AND t.status = 'approved'
      WHERE LOWER(s.slug) = LOWER($1)
      `,
      [slug]
    );

    const shop = result.rows[0];

    if (!shop) {
      return res.status(404).json({
        error: 'Shop not found'
      });
    }

    return res.json(shop);
  } catch (err) {
    console.error('Shop by slug error:', err);

    return res.status(500).json({
      error: 'Server error'
    });
  }
});


// ============================================================
// GET /api/shops?lat=...&lng=...
// NEARBY APPROVED SHOPS
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

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return res.status(400).json({
      error: 'Invalid latitude or longitude'
    });
  }

  const maxDistance = 5;

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

    return R * c;
  };

  try {
    const result = await pool.query(`
      SELECT s.*
      FROM shops s
      INNER JOIN tenants t
        ON t.shop_id = s.id
       AND t.status = 'approved'
      WHERE s.lat IS NOT NULL
        AND s.lng IS NOT NULL
        AND (s.is_featured IS DISTINCT FROM TRUE)
    `);

    const nearbyShops = result.rows
      .map(shop => ({
        ...shop,
        distance: getDistance(
          userLat,
          userLng,
          Number(shop.lat),
          Number(shop.lng)
        )
      }))
      .filter(shop => shop.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    return res.json(
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
    console.error('Nearby shop fetch error:', err);

    return res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});


module.exports = router;
