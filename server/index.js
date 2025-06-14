// server/index.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db'); // PostgreSQL connection module

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup (with silent rejection for unknown origins)
const allowedOrigins = [
  'http://localhost:3000',
  'https://connect4u-client.onrender.com',
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      // silently reject disallowed origins (no error thrown)
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ Preflight support

// ✅ Middleware
app.use(express.json());

// ✅ PostgreSQL connection
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

// ✅ Root route
app.get('/', (req, res) => {
  res.send('🛒 eCommerce backend is running!');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
