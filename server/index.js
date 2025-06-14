const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db'); // PostgreSQL connection

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://connect4u-client.onrender.com'
];

// ✅ Define corsOptions
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ✅ Apply CORS globally
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight support

// ✅ JSON parser
app.use(express.json());

// ✅ Database check
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// ✅ Routes
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

// ✅ Root test
app.get('/', (req, res) => {
  res.send('🛒 eCommerce backend is running!');
});

// ✅ Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
