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
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  try {
    await pool.query(`
      INSERT INTO users (email, otp, otp_expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
      SET otp = $2, otp_expires_at = $3
    `, [email, otp, expires]);

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
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: 'Email and OTP required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || user.otp !== token) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // Clear OTP after login
    await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE id = $1', [user.id]);

    res.json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
