// server/index.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db'); // Your PostgreSQL connection module

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins for CORS (adjust the React frontend URL after deployment)
const allowedOrigins = [
  'http://localhost:3000',                // local dev React frontend
  'https://connect4u-client.onrender.com' // deployed React frontend (update this)
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Middleware to parse JSON
app.use(express.json());

// Connect to PostgreSQL
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// Import your routes
const addressRoutes = require('./routes/addressRoutes');
const stripeRoutes = require('./routes/stripe');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/auth');

// Use routes with prefix
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/products', productRoutes);

// Basic root route for sanity check
app.get('/', (req, res) => {
  res.send('🛒 eCommerce backend is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
