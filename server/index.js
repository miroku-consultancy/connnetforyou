require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./db'); // PostgreSQL pool

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const addressRoutes = require('./routes/addressRoutes');
const stripeRoutes = require('./routes/stripe');
const shopRoutes = require('./routes/shopRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Ensure /images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
  console.log('📁 Created /images directory');
}

// ✅ CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://connect4u-client.onrender.com',
  'https://connectfree4u.com',
  'https://www.connectfree4u.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ✅ PostgreSQL DB connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// ✅ Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/shops', shopRoutes);

// ✅ Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// =======================
// React frontend serving with /shop basename
// Serve everything in /build under the /shop path
// Serve React static assets under /shop
app.use('/shop', express.static(path.join(__dirname, 'build')));

// Handle all React routes under /shop
app.get('/shop/*', (req, res) => {
  console.log('🌐 React route hit:', req.originalUrl);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



// =======================

// ❌ Catch-all for unexpected server errors
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS error', message: err.message });
  }
  res.status(500).json({ error: 'Server error', message: err.message });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
