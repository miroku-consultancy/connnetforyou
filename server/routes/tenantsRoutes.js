const express = require('express');
const pool = require('../db');

const router = express.Router();

// Resolve tenant from current hostname
router.get('/resolve', async (req, res) => {
  try {
    // Example:
    // kanji-sweets.jusping.com
    const hostname = (req.query.domain || req.hostname)
  .toLowerCase()
  .trim();

    console.log('[Tenant Resolve] Hostname:', hostname);

    const result = await pool.query(
      `
      SELECT
        t.id AS tenant_id,
        t.slug AS tenant_slug,
        t.status AS tenant_status,

        d.id AS domain_id,
        d.domain,
        d.domain_type,

        s.id AS shop_id,
        s.slug AS shop_slug,
        s.name AS shop_name,
        s.address AS shop_address,
        s.phone AS shop_phone,
        s.image_url,
        s.price_markup_percent

      FROM domains d
      INNER JOIN tenants t
        ON t.id = d.tenant_id

      INNER JOIN shops s
        ON s.id = t.shop_id

      WHERE LOWER(d.domain) = $1
        AND d.is_active = TRUE
        AND d.is_verified = TRUE
        AND t.status = 'active'

      LIMIT 1
      `,
      [hostname]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tenant not found',
        domain: hostname
      });
    }

    const row = result.rows[0];

    res.json({
      tenantId: row.tenant_id,
      tenantSlug: row.tenant_slug,
      tenantStatus: row.tenant_status,

      domainId: row.domain_id,
      domain: row.domain,
      domainType: row.domain_type,

      shopId: row.shop_id,
      shopSlug: row.shop_slug,

      shop: {
        id: row.shop_id,
        name: row.shop_name,
        slug: row.shop_slug,
        address: row.shop_address,
        phone: row.shop_phone,
        imageUrl: row.image_url,
        priceMarkupPercent: Number(row.price_markup_percent || 0)
      }
    });

  } catch (err) {
    console.error('[Tenant Resolve] Error:', err);

    res.status(500).json({
      error: 'Failed to resolve tenant'
    });
  }
});

module.exports = router;