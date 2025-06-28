const express = require('express');
const auth = require('../middleware/authMiddleware');
const db = require('../db');

const router = express.Router();

// GET /api/notifications - Get notifications for the current shop
router.get('/', auth, async (req, res) => {
  const { shop_id, role } = req.user;

  console.log('[Notifications] Authenticated user:', req.user); // For debugging

  if (role !== 'vendor' || !shop_id) {
    return res.status(403).json({ error: 'Only vendor accounts can access notifications' });
  }

  try {
    const result = await db.query(
      'SELECT id, message, is_read, created_at FROM notifications WHERE shop_id = $1 ORDER BY created_at DESC',
      [shop_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
