const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// 🔍 Build category tree
async function getCategoriesTree() {
  const res = await pool.query('SELECT id, name, parent_id FROM categories');
  const map = {};
  res.rows.forEach(c => {
    map[c.id] = { ...c, children: [] };
  });
  const roots = [];
  res.rows.forEach(c => {
    if (c.parent_id) map[c.parent_id]?.children.push(map[c.id]);
    else roots.push(map[c.id]);
  });
  return roots;
}

// ✅ GET /api/categories — Get full category tree
router.get('/', async (req, res) => {
  try {
    const tree = await getCategoriesTree();
    res.json(tree);
  } catch (err) {
    console.error('❌ Error loading categories:', err);
    res.status(500).json({ message: 'Error loading categories.' });
  }
});

// ✅ POST /api/categories — Add category or subcategory
router.post('/', async (req, res) => {
  const { name, parent_id } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required.' });
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO categories(name, parent_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name.trim(), parent_id || null]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('❌ Error adding category:', err);
    res.status(500).json({ message: 'Error adding category.' });
  }
});

module.exports = router;
