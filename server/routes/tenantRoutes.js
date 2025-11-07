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
    const { name, phone, rent, advance, owner_id } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const result = await pool.query(
      `INSERT INTO tenants (name, phone, rent, advance, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, phone, rent || 0, advance || 0, owner_id || 1]
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
    const { name, phone, rent, advance } = req.body;

    const result = await pool.query(
      `UPDATE tenants
       SET name = $1, phone = $2, rent = $3, advance = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, phone, rent, advance, id]
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
