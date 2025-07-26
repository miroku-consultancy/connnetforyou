// routes/whatsapp.js
const express = require('express');
const router = express.Router();
const { sendWhatsappMessage } = require('../utils/whatsappService');

router.post('/send-whatsapp', async (req, res) => {
  const { to, message } = req.body;

  try {
    const data = await sendWhatsappMessage(to, message);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
