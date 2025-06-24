require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const addressRoutes = require('./routes/addressRoutes');
const stripeRoutes = require('./routes/stripe');
const shopRoutes = require('./routes/shopRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Ensure /images directory exists before upload
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
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ✅ Connect to PostgreSQL DB
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// ✅ Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/shops', shopRoutes); 

// ✅ Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// ✅ Root test endpoint
app.get('/', (req, res) => {
  res.send('🛒 eCommerce backend is running!');
});

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 🔧 Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS error', message: err.message });
  }
  res.status(500).json({ error: 'Server error', message: err.message });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
