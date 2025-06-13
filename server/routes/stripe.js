const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config(); // Load environment variables

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use env variable

router.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Order Payment',
            images: ['https://your-logo-url.com/logo.png'], // optional
          },
          unit_amount: 50000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/summary',
      cancel_url: 'http://localhost:3000/payment',
    });

    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
