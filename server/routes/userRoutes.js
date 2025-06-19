const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.userId; // decoded from JWT in middleware

  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
