// server/index.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db'); // PostgreSQL connection module

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup for both local and deployed frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://connect4u-client.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight (OPTIONS) requests
app.options('*', cors());

// ✅ Middleware to parse JSON
app.use(express.json());

// ✅ PostgreSQL connection check
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// ✅ Import and use routes
const addressRoutes = require('./routes/addressRoutes');
const stripeRoutes = require('./routes/stripe');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/products', productRoutes);

// ✅ Basic route for sanity check
app.get('/', (req, res) => {
  res.send('🛒 eCommerce backend is running!');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
