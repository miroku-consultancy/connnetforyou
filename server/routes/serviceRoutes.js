const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();

const authMiddleware = require("../middleware/authMiddleware");
const serviceController = require("../controllers/serviceController");



fs.mkdirSync(uploadDir, { recursive: true });


const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  }
});

router.get(
  '/my-services',
  authMiddleware,
  (req, res, next) => {
    console.log('🔥🔥🔥 MY-SERVICES AFTER AUTH 🔥🔥🔥');
    console.log('USER:', req.user);
    next();
  },
  serviceController.getMyServices
);

// Public marketplace
router.get("/", (req, res, next) => {
    console.log("🔥 SERVICES ROUTER HIT");
    console.log("URL:", req.originalUrl);
    console.log("Query:", req.query);
    console.log("User:", req.user || "No authenticated user");
    next();
}, serviceController.getServices);

// Provider routes
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  serviceController.createService
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  serviceController.updateService
);

router.delete(
  "/:id",
  authMiddleware,
  serviceController.deleteService
);

module.exports = router;