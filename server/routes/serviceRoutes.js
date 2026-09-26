const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("../middleware/authMiddleware");
const serviceController = require("../controllers/serviceController");

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "services"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `service-${Date.now()}${ext}`);
  }
});

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

// Public marketplace
router.get("/", serviceController.getServices);
router.get("/:id", serviceController.getService);

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