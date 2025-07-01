const pool = require('../db');

// GET /api/units
const getUnits = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, category FROM units ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching units:', err);
    res.status(500).json({ message: 'Failed to fetch units', error: err.message });
  }
};

// POST /api/units
const addUnit = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Unit name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO units(name, category)
       VALUES ($1, 'quantity')
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name]
    );

    if (result.rows.length === 0) {
      // Unit already exists, return existing one
      const existing = await pool.query(`SELECT * FROM units WHERE name = $1`, [name]);
      return res.status(200).json(existing.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error adding unit:', err);
    res.status(500).json({ message: 'Failed to add unit', error: err.message });
  }
};

module.exports = { getUnits, addUnit };
