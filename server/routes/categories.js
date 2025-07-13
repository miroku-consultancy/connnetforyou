const express = require('express');
const router = express.Router();
require('dotenv').config();

const pool = require('../db');  // make sure your db connection exports a pool

// 🔁 Helper: Recursively build category tree
async function getCategoriesTree() {
  const res = await pool.query('SELECT id, name, parent_id FROM categories ORDER BY id');
  const map = {};
  res.rows.forEach(cat => {
    map[cat.id] = { ...cat, children: [] };
  });

  const tree = [];
  res.rows.forEach(cat => {
    if (cat.parent_id) {
      map[cat.parent_id]?.children.push(map[cat.id]);
    } else {
      tree.push(map[cat.id]);
    }
  });

  return tree;
}

// ✅ GET /api/categories
router.get('/', async (req, res) => {
  try {
    const tree = await getCategoriesTree();
    res.json(tree);
  } catch (err) {
    console.error('❌ Error loading categories:', err);
    res.status(500).json({ message: 'Error loading categories.' });
  }
});

// ✅ POST /api/categories — Create new category or subcategory
router.post('/', async (req, res) => {
  const { name, parent_id } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  try {
    // Check for duplicate category with the same name under the same parent
    const checkRes = await pool.query(
      `SELECT 1 FROM categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2`,
      [name.trim(), parent_id || null]
    );

    if (checkRes.rows.length > 0) {
      return res.status(409).json({ message: 'Category already exists under the selected parent.' });
    }

    const insertRes = await pool.query(
      `INSERT INTO categories (name, parent_id)
       VALUES ($1, $2)
       RETURNING id, name, parent_id`,
      [name.trim(), parent_id || null]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('❌ Error adding category:', err);
    res.status(500).json({ message: 'Error adding category.' });
  }
});

module.exports = router;
