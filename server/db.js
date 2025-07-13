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

module.exports = pool;
