const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Email setup
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   }
// });
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  connectionTimeout: 20000,
  logger: true,
  debug: true,
});



// 1️⃣ Send OTP to email
// router.post('/send-token', async (req, res) => {
//   const { email, shop_slug } = req.body;
//   if (!email || !shop_slug) {
//     return res.status(400).json({ error: 'Email and shop slug are required' });
//   }

//   const otp = crypto.randomInt(100000, 999999).toString();
//   const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

//   try {
//     const shopResult = await pool.query('SELECT id FROM shops WHERE slug = $1', [shop_slug]);
//     if (shopResult.rowCount === 0) {
//       return res.status(400).json({ error: 'Invalid shop slug' });
//     }
//     const shopId = shopResult.rows[0].id;

//     await pool.query(`
//       INSERT INTO public.users (email, otp, otp_expires_at, shop_id)
//       VALUES ($1, $2, $3, $4)
//       ON CONFLICT (email) DO UPDATE
//       SET otp = $2, otp_expires_at = $3, shop_id = $4
//     `, [email, otp, expires, shopId]);

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Your Login OTP',
//       text: `Your login OTP is: ${otp}. It expires in 5 minutes.`,
//     });

//     res.json({ message: 'OTP sent to email' });
//   } catch (err) {
//     console.error('Error sending OTP:', err);
//     res.status(500).json({ error: 'Server error while sending OTP' });
//   }
// });

const net = require('net');

app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // First test SMTP connection
  const socket = net.createConnection(587, 'smtp.gmail.com');
  socket.setTimeout(5000); // 5 seconds timeout

  socket.on('connect', async () => {
    socket.end();

    // Proceed with OTP generation and sending
    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    tokenStore[email] = { otp, expires };

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}\nIt expires in 5 minutes.`,
      });

      res.json({ message: 'OTP sent to email' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  });

  socket.on('timeout', () => {
    socket.destroy();
    res.status(504).json({ error: 'SMTP connection timed out' });
  });

  socket.on('error', (err) => {
    res.status(500).json({ error: `SMTP connection error: ${err.message}` });
  });
});


// 2️⃣ Verify OTP and generate JWT + Refresh Token
router.post('/login-with-token', async (req, res) => {
  const { email, token, shop_slug } = req.body;

  if (!email || !token || !shop_slug) {
    return res.status(400).json({ error: 'Email, OTP, and shop slug are required' });
  }

  try {
    const shopResult = await pool.query('SELECT id FROM shops WHERE slug = $1', [shop_slug]);
    if (shopResult.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid shop slug' });
    }
    const shopId = shopResult.rows[0].id;

    const userResult = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || user.otp !== token) {
      return res.status(401).json({ error: 'Invalid OTP or email' });
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    const roleResult = await pool.query(`
      SELECT role FROM user_shop_roles
      WHERE user_id = $1 AND shop_id = $2
      LIMIT 1
    `, [user.id, shopId]);

    const roleRow = roleResult.rows[0];
    const role = roleRow?.role || 'customer';

    // Generate Access Token (short-lived)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        shop_id: shopId,
        role: role
      },
      process.env.JWT_SECRET,
      { expiresIn: '180d' }
    );

    // Generate Refresh Token (long-lived)
    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in DB
    await pool.query(
      `UPDATE public.users 
   SET refresh_token = $1, otp = NULL, otp_expires_at = NULL, last_login_at = NOW() 
   WHERE id = $2`,
      [refreshToken, user.id]
    );


    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        shop_id: shopId,
        role: role
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 3️⃣ Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    // Verify refresh token first
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Check if refresh token exists in DB for user
    const userResult = await pool.query('SELECT * FROM public.users WHERE id = $1', [payload.id]);
    const user = userResult.rows[0];
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        shop_id: user.shop_id,
        // You might want to fetch role here too if needed
      },
      process.env.JWT_SECRET,
      { expiresIn: '180d' }
    );
    const newRefreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store the new refresh token in the database, replacing the old one
    await pool.query(
      'UPDATE public.users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.id]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // res.json({
    //   token: newAccessToken,
    // });

  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// 4️⃣ Logout (revoke refresh token)
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Clear refresh token in DB
    await pool.query('UPDATE public.users SET refresh_token = NULL WHERE id = $1', [payload.id]);

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(400).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
