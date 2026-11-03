
const express = require("express");
const multer = require("multer");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const masterAdminMiddleware = require("../middleware/masterAdminMiddleware");
const serviceController = require("../controllers/serviceController");

const storage = multer.memoryStorage();

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

// ---------------------------------------------------------
// Vendor routes
// ---------------------------------------------------------

router.get(
  "/my-services",
  authMiddleware,
  serviceController.getMyServices
);

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

router.post(
  "/:id/submit-for-review",
  authMiddleware,
  serviceController.submitServiceForReview
);

router.delete(
  "/:id",
  authMiddleware,
  serviceController.deleteService
);

// ---------------------------------------------------------
// Master admin routes
// ---------------------------------------------------------

router.post(
  "/admin/:id/approve",
  authMiddleware,
  masterAdminMiddleware,
  serviceController.adminApproveService
);

router.post(
  "/admin/:id/reject",
  authMiddleware,
  masterAdminMiddleware,
  serviceController.adminRejectService
);

// ---------------------------------------------------------
// Public routes
// Keep these after specific routes.
// ---------------------------------------------------------

router.get(
  "/",
  serviceController.getServices
);

router.get(
  "/:id",
  serviceController.getService
);

module.exports = router;
