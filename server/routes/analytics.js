// routes/analytics.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Create table if not already done
// CREATE TABLE IF NOT EXISTS visits (id SERIAL PRIMARY KEY, visited_at TIMESTAMP DEFAULT now());

router.post('/visit', async (req, res) => {
  try {
    await pool.query('INSERT INTO visits DEFAULT VALUES');
    res.status(200).json({ message: 'Visit logged' });
  } catch (err) {
    console.error('Visit log error:', err);
    res.status(500).json({ error: 'Could not log visit' });
  }
});

router.get('/visit-count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM visits');
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Visit count error:', err);
    res.status(500).json({ error: 'Could not fetch count' });
  }
});

module.exports = router;
