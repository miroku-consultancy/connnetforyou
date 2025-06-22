// server/routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const { saveAddress } = require('../models/addressModel');
const pool = require('../db');
const authenticateToken = require('../middleware/authenticateToken');

// Save a new address for the logged-in user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const savedAddress = await saveAddress({ ...req.body, user_id });
    res.status(201).json(savedAddress);
  } catch (err) {
    console.error('Error saving address:', err);
    res.status(500).json({ message: 'Error saving address' });
  }
});

// Get the latest address for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No address found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching address:', err);
    res.status(500).json({ message: 'Error fetching address' });
  }
});

module.exports = router;
