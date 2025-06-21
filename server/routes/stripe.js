const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { order, success_url, cancel_url } = req.body;

    if (!order || !success_url || !cancel_url) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Construct line_items from order items
    const line_items = order.items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [], // make sure full URL or hosted somewhere
        },
        unit_amount: Math.round(item.price * 100), // amount in paise (INR subunit)
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url,
      cancel_url,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
