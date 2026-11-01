const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const productController = require("../controllers/productController");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Public products (only approved stores)
router.get("/", productController.getPublicProducts);

// Vendor's own products (including draft and pending stores)
// Must be before /:id
router.get(
  "/my-store",
  authMiddleware,
  productController.getProducts
);

// Single product
router.get("/:id", authMiddleware, productController.getProduct);

// Add product
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  productController.addProduct
);

// Update product
router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  productController.updateProduct
);

module.exports = router;