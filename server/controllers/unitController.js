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

module.exports = { getUnits };
