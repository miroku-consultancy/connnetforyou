const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `user_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ GET /api/user/me (already present)
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id || req.user.userId;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, mobile, profile_image FROM users WHERE id = $1',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST /api/user/update-profile
router.post('/update-profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { name, email, mobile } = req.body;
  const imagePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;

  try {
    let query, values;

    if (imagePath) {
      query = `
        UPDATE users
        SET name = $1, email = $2, mobile = $3, profile_image = $4
        WHERE id = $5
        RETURNING id, name, email, mobile, profile_image;
      `;
      values = [name, email, mobile, imagePath, userId];
    } else {
      query = `
        UPDATE users
        SET name = $1, email = $2, mobile = $3
        WHERE id = $4
        RETURNING id, name, email, mobile, profile_image;
      `;
      values = [name, email, mobile, userId];
    }

    const { rows } = await pool.query(query, values);
    res.json({ message: 'Profile updated successfully', user: rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
