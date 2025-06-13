// server/routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const { saveAddress } = require('../models/addressModel');

router.post('/', async (req, res) => {
  try {
    const savedAddress = await saveAddress(req.body);
    res.status(201).json(savedAddress);
  } catch (err) {
    console.error('Error saving address:', err);
    res.status(500).json({ message: 'Error saving address' });
  }
});

module.exports = router;
