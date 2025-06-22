const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Save or update address for logged-in user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      id, // optional address id for update
      name,
      street,
      city,
      zip,
      phone,
    } = req.body;

    if (!name || !street || !city || !zip || !phone) {
      return res.status(400).json({ message: 'All address fields are required.' });
    }

    if (id) {
      // Update existing address — only if it belongs to this user
      const addressCheck = await pool.query(
        'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (addressCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Address not found or unauthorized' });
      }

      // Update
      const updateResult = await pool.query(
        `UPDATE addresses 
         SET name = $1, street = $2, city = $3, zip = $4, phone = $5
         WHERE id = $6 RETURNING *`,
        [name, street, city, zip, phone, id]
      );

      return res.json(updateResult.rows[0]);
    } else {
      // Insert new address
      const insertResult = await pool.query(
        `INSERT INTO addresses (user_id, name, street, city, zip, phone)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user_id, name, street, city, zip, phone]
      );
      return res.json(insertResult.rows[0]);
    }
  } catch (error) {
    console.error('Error saving address:', error);
    res.status(500).json({ message: 'Server error saving address' });
  }
});

// Get addresses for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      'SELECT id, name, street, city, zip, phone FROM addresses WHERE user_id = $1 ORDER BY id',
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Server error fetching addresses' });
  }
});

module.exports = router;
