// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   host: process.env.PGHOST || process.env.PG_HOST,
//   port: Number(process.env.PGPORT || process.env.PG_PORT) || 5432,
//   user: process.env.PGUSER || process.env.PG_USER,
//   password: process.env.PGPASSWORD || process.env.PG_PASSWORD,
//   database: process.env.PGDATABASE || process.env.PG_DATABASE,
//   ssl: {
//     rejectUnauthorized: false, // Required for Neon or any managed PostgreSQL with SSL
//   },
// });

// module.exports = pool;
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || process.env.PG_HOST,
  port: Number(process.env.PGPORT || process.env.PG_PORT) || 5432,
  user: process.env.PGUSER || process.env.PG_USER,
  password: process.env.PGPASSWORD || process.env.PG_PASSWORD,
  database: process.env.PGDATABASE || process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: false, // Required for Neon or any managed PostgreSQL with SSL
  },
});

// ✅ Handle errors from idle clients (avoids crashing the server)
pool.on('error', (err) => {
  console.error('🔥 Unexpected error on idle client', err);
  // Optionally log to external service like Sentry or email admin
});

module.exports = pool;
