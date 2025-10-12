// const express = require('express');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
// require('dotenv').config(); // To load environment variables from a .env file

// const app = express();
// app.use(express.json());

// const tokenStore = {}; // In-memory store: { email: { otp, expires } }

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Send OTP to email
// app.post('/api/auth/send-otp', async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ error: 'Email required' });

//   const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
//   const expires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

//   tokenStore[email] = { otp, expires };

//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Your OTP Code',
//       text: `Your OTP code is: ${otp}\nIt expires in 5 minutes.`,
//     });

//     res.json({ message: 'OTP sent to email' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to send OTP' });
//   }
// });

// // Verify OTP and generate JWT token
// app.post('/api/auth/verify-otp', (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

//   const record = tokenStore[email];
//   if (!record) return res.status(400).json({ error: 'No OTP found for this email' });
//   if (Date.now() > record.expires) return res.status(400).json({ error: 'OTP expired' });
//   if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

//   delete tokenStore[email]; // Remove OTP once verified

//   const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
//   // expiresIn: '1h' // ← this is commented out / not included
// });


//   res.json({ message: 'Login successful', token });
// });

// app.listen(5000, () => console.log('Server running on http://localhost:5000'));
