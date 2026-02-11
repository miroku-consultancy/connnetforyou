const express = require("express");
const admin = require("../firebaseAdmin"); // your existing firebase admin
const pool = require("../db");

const router = express.Router();

// 🔐 Internal auth middleware
router.use((req, res, next) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

/**
 * POST /api/notify/chat
 * Body:
 * {
 *   tenantId,
 *   threadId,
 *   receiverExternalUserId,
 *   title,
 *   body
 * }
 */
router.post("/notify/chat", async (req, res) => {
  try {
    const { receiverExternalUserId, title, body } = req.body;
console.log("🔔 Notify called");
    console.log("Headers x-internal-key:", req.headers["x-internal-key"]);
    console.log("Body:", req.body);
    if (!receiverExternalUserId) {
      return res.status(400).json({ error: "receiverExternalUserId missing" });
    }

    // 1️⃣ Get FCM token for that user
    const tokenResult = await pool.query(
      "SELECT fcm_token FROM user_tokens WHERE user_id = $1",
      [receiverExternalUserId]
    );

    const fcmToken = tokenResult.rows[0]?.fcm_token;

    if (!fcmToken) {
      return res.json({ ok: true, message: "No FCM token, skipping push" });
    }

    // 2️⃣ Send FCM
    const message = {
      token: fcmToken,
      notification: {
        title: title || "New message",
        body: body || "You have a new message",
      },
      android: { priority: "high" },
      webpush: {
        notification: {
          icon: "/favicon.ico",
          click_action: "/",
        },
      },
    };

    await admin.messaging().send(message);

    console.log("✅ Chat push sent to", receiverExternalUserId);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Chat notify error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

module.exports = router;
