const express = require('express');
const auth = require('../middleware/authMiddleware');
const db = require('../db');

const router = express.Router();

// Save FCM token for a vendor/shop
router.post('/save-fcm-token', auth, async (req, res) => {
  const { fcm_token } = req.body;
  const { shop_id, role } = req.user;

  console.log('🔔 POST /save-fcm-token received:', { fcm_token, shop_id, role });

  if (!fcm_token || role !== 'vendor' || !shop_id) {
    console.error('❌ Missing FCM token or invalid user:', { fcm_token, role, shop_id });
    return res.status(400).json({ error: 'Missing FCM token or invalid user' });
  }

  try {
    console.log('Saving/updating FCM token for shop_id:', shop_id);
    await db.query(
      `INSERT INTO shop_tokens (shop_id, fcm_token)
       VALUES ($1, $2)
       ON CONFLICT (shop_id) DO UPDATE SET fcm_token = $2`,
      [shop_id, fcm_token]
    );
    console.log('✅ FCM token saved successfully');
    res.status(200).json({ message: 'FCM token saved' });
  } catch (err) {
    console.error('❌ Error saving FCM token:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
