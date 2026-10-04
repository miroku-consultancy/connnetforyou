const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const serviceController = require("../controllers/serviceController");

// ---------------------------------------------------------
// Multer - keep uploaded image in memory
// Images are uploaded to Cloudinary by the controller.
// Nothing is permanently stored on Render filesystem.
// ---------------------------------------------------------
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Only image files are allowed")
      );
    }

    cb(null, true);
  }
});


// ---------------------------------------------------------
// Vendor: Get my services
// ---------------------------------------------------------
router.get(
  "/my-services",
  authMiddleware,
  (req, res, next) => {
    console.log(
      "🔥🔥🔥 MY-SERVICES AFTER AUTH 🔥🔥🔥"
    );

    console.log(
      "USER:",
      req.user
    );

    next();
  },
  serviceController.getMyServices
);


// ---------------------------------------------------------
// Public marketplace services
// ---------------------------------------------------------
router.get(
  "/",
  (req, res, next) => {
    console.log(
      "🔥 SERVICES ROUTER HIT"
    );

    console.log(
      "URL:",
      req.originalUrl
    );

    console.log(
      "Query:",
      req.query
    );

    console.log(
      "User:",
      req.user || "No authenticated user"
    );

    next();
  },
  serviceController.getServices
);


// ---------------------------------------------------------
// Provider: Create service
// ---------------------------------------------------------
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  serviceController.createService
);


// ---------------------------------------------------------
// Provider: Update service
// ---------------------------------------------------------
router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  serviceController.updateService
);


// ---------------------------------------------------------
// Provider: Delete service
// ---------------------------------------------------------
router.delete(
  "/:id",
  authMiddleware,
  serviceController.deleteService
);


module.exports = router;