const express = require('express');
const pool = require('../db'); // same DB pool used in other routes
const router = express.Router();

/**
 * 📦 GET /tenants
 * Fetch all tenants (for now, no authentication — can add owner filter later)
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenants ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('🛑 Tenant fetch error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * 🧾 POST /tenants
 * Add a new tenant
 * Body: { name, phone, rent, advance, owner_id (optional) }
 */
router.post('/', async (req, res) => {
  try {
    const {
      roomNo,
      name,
      email,
      phone,
      aadhar,
      pan,
      tenantAddress,
      ownerName,
      ownerAddress,
      rentMonthYear,
      paymentMode,
      paymentDate,
      advancePaymentDate,
      rentFinalPerMonth,
      rent,
      advance,
      owner_id
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const result = await pool.query(
      `INSERT INTO tenants (
          room_no, name, email, phone, aadhar, pan, tenant_address,
          owner_name, owner_address, rent_month_year, payment_mode,
          payment_date, advance_payment_date, rent_final_per_month,
          rent, advance, owner_id
       ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17
       ) RETURNING *`,
      [
        roomNo, name, email, phone, aadhar, pan, tenantAddress,
        ownerName, ownerAddress, rentMonthYear, paymentMode,
        paymentDate, advancePaymentDate, rentFinalPerMonth,
        rent || 0, advance || 0, owner_id || 1
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🛑 Tenant add error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});


/**
 * ✏️ PUT /tenants/:id
 * Update tenant info (optional — for later)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomNo,
      name,
      email,
      phone,
      aadhar,
      pan,
      tenantAddress,
      ownerName,
      ownerAddress,
      rentMonthYear,
      paymentMode,
      paymentDate,
      advancePaymentDate,
      rentFinalPerMonth,
      rent,
      advance,
      owner_id
    } = req.body;

    const result = await pool.query(
      `UPDATE tenants SET
          room_no = $1,
          name = $2,
          email = $3,
          phone = $4,
          aadhar = $5,
          pan = $6,
          tenant_address = $7,
          owner_name = $8,
          owner_address = $9,
          rent_month_year = $10,
          payment_mode = $11,
          payment_date = $12,
          advance_payment_date = $13,
          rent_final_per_month = $14,
          rent = $15,
          advance = $16,
          owner_id = $17,
          updated_at = NOW()
       WHERE id = $18
       RETURNING *`,
      [
        roomNo,
        name,
        email,
        phone,
        aadhar,
        pan,
        tenantAddress,
        ownerName,
        ownerAddress,
        rentMonthYear,
        paymentMode,
        paymentDate,
        advancePaymentDate,
        rentFinalPerMonth,
        rent,
        advance,
        owner_id,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('🛑 Tenant update error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});


/**
 * ❌ DELETE /tenants/:id
 * Remove tenant (optional — for later)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tenants WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (err) {
    console.error('🛑 Tenant delete error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
