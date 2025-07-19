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
const { sseRouter } = require('./routes/notificationSse');
const notificationRoutes = require('./routes/notificationRoutes'); // ✅ ADD THIS
const ordersStatusRouter = require('./routes/ordersStatus'); // Adjust path as necessary
const unitRoutes = require('./routes/unitRoutes');
const saveFcmTokenRouter = require('./routes/saveFcmToken'); // adjust path

const categoriesRouter = require('./routes/categories');

const app = express();

const PORT = process.env.PORT || 5000;

// Ensure /images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
  console.log('📁 Created /images directory');
}

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://connect4u-client.onrender.com',
  'https://connectfree4u.com',
  'https://www.connectfree4u.com',
];

// Configure CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/shops', shopRoutes);
// Mount it at /api/orders
app.use('/api/orders', ordersStatusRouter);
// Use both SSE and normal notifications
app.use('/api/notifications', notificationRoutes); // ✅ Handles GET /api/notifications
app.use('/api/notifications', sseRouter);          // ✅ Handles /api/notifications/stream
app.use('/api/units', unitRoutes);
app.use('/api', saveFcmTokenRouter);

app.use('/api/categories', categoriesRouter);
app.use('/api/analytics', require('./routes/analytics'));

// Serve static assets (images and frontend build)
app.use('/images', express.static(imagesDir));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'build')));

// Send index.html for all other routes (React Router support)
app.get(/.*/, (req, res) => {
  console.log('✅ Express serving:', req.originalUrl);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS error', message: err.message });
  }
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Connect to PostgreSQL database and start the server
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB connection error:', err);
  });
