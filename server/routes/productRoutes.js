const express = require('express');
const router = express.Router();
const multer = require('multer');

const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// ============================================================
// Multer - memory storage
// Cloudinary will receive the file buffer.
// Do NOT use diskStorage because Render local storage is temporary.
// ============================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  },
});


// ============================================================
// PUBLIC
// ============================================================

router.get(
  '/',
  productController.getPublicProducts
);


// ============================================================
// PROTECTED
// ============================================================

router.get(
  '/:id',
  authMiddleware,
  productController.getProduct
);

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  productController.addProduct
);

router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  productController.updateProduct
);


module.exports = router;