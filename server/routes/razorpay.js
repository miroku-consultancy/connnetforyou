const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();

require('dotenv').config();

const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Route to create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    });

    res.json(order);
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});



// Add this in routes/razorpay.js, after your /create-order route
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
    }

    // Optionally save payment info to DB here

    res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ error: 'Payment verification error' });
  }
});



module.exports = router;
