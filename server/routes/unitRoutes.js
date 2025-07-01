const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/units
router.get('/', authMiddleware, unitController.getUnits);

module.exports = router;
