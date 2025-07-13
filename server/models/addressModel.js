// server/models/addressModel.js
//const { Pool } = require('pg');
require('dotenv').config();

const pool = require('../db');

const saveAddress = async (address) => {
  const { name, street, city, zip, phone, user_id } = address;

  try {
    const result = await pool.query(
      `INSERT INTO addresses (name, street, city, zip, phone, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, street, city, zip, phone, user_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('DB Error:', error);
    throw error;
  }
};

module.exports = { saveAddress };
