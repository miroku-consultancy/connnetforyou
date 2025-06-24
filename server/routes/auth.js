const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// 1️⃣ Send OTP to email
router.post('/send-token', async (req, res) => {
  const { email, shop_slug } = req.body;
  if (!email || !shop_slug) {
    return res.status(400).json({ error: 'Email and shop slug are required' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  try {
    // 1. Get shop_id from slug
    const shopResult = await pool.query('SELECT id FROM shops WHERE slug = $1', [shop_slug]);
    if (shopResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid shop slug' });
    }
    const shopId = shopResult.rows[0].id;

    // 2. Insert or update user
    await pool.query(`
      INSERT INTO public.users (email, otp, otp_expires_at, shop_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
      SET otp = $2, otp_expires_at = $3, shop_id = $4
    `, [email, otp, expires, shopId]);

    // 3. Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Login OTP',
      text: `Your login OTP is: ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Server error while sending OTP' });
  }
});


// 2️⃣ Verify OTP and generate JWT
router.post('/login-with-token', async (req, res) => {
  const { email, token, shop_slug } = req.body;
  if (!email || !token || !shop_slug) {
    return res.status(400).json({ error: 'Email, OTP, and shop slug are required' });
  }

  try {
    // 1. Resolve shop_id from slug
    const shopResult = await pool.query('SELECT id FROM shops WHERE slug = $1', [shop_slug]);
    if (shopResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid shop slug' });
    }
    const shopId = shopResult.rows[0].id;

    // 2. Get user with matching shop_id
    const result = await pool.query(
      'SELECT * FROM public.users WHERE email = $1 AND shop_id = $2',
      [email, shopId]
    );
    const user = result.rows[0];

    if (!user || user.otp !== token) {
      return res.status(401).json({ error: 'Invalid OTP or email' });
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    // 3. Generate token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, shop_id: user.shop_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Clear OTP and update login timestamp
    await pool.query(
      'UPDATE public.users SET otp = NULL, otp_expires_at = NULL, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // 5. Return token and user info
    res.json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        shop_id: user.shop_id
      }
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});


module.exports = router;
