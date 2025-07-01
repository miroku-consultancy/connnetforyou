const express = require('express');
const router = express.Router();
const { getUnits, addUnit } = require('../controllers/unitController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔐 Protect routes if needed
router.get('/', authMiddleware, getUnits);
router.post('/', authMiddleware, addUnit);

module.exports = router;
