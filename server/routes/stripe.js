const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, success_url, cancel_url } = req.body;

    console.log('Stripe request received:', req.body);

    if (!items || !items.length || !success_url || !cancel_url) {
      return res.status(400).json({ error: 'Missing items or URLs' });
    }

    // Calculate total from items (price * quantity)
    const total = items.reduce((sum, item) => {
      const price = Number(item.price);
      const qty = Number(item.quantity);
      if (isNaN(price) || isNaN(qty)) throw new Error('Invalid price or quantity in items');
      return sum + price * qty;
    }, 0);

    const amount = Math.round(total * 100);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid total amount');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Order Payment',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
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
