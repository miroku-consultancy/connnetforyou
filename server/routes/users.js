const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // use userId from the decoded token
    const user = await User.findById(userId).select('-password'); // exclude password

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
