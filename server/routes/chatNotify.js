const express = require("express");
const admin = require('./firebaseAdmin'); // your existing firebase admin
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
    const {
      receiverExternalUserId,
      senderExternalUserId,
      tenantId,   // shop_id
      body
    } = req.body;

    console.log("🔔 Notify called", req.body);

    if (!receiverExternalUserId || !senderExternalUserId || !tenantId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 1️⃣ Get FCM token for receiver
    const tokenResult = await pool.query(
      "SELECT fcm_token FROM user_tokens WHERE user_id = $1",
      [receiverExternalUserId]
    );

    const fcmToken = tokenResult.rows[0]?.fcm_token;
    if (!fcmToken) {
      return res.json({ ok: true, message: "No FCM token, skipping push" });
    }

    // 2️⃣ Load sender user
    const senderUserResult = await pool.query(
      "SELECT id, name FROM users WHERE id = $1",
      [senderExternalUserId]
    );

    const senderUser = senderUserResult.rows[0];
    if (!senderUser) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // 3️⃣ Check role in user_shop_roles
    const roleResult = await pool.query(
      "SELECT role FROM user_shop_roles WHERE user_id = $1 AND shop_id = $2 LIMIT 1",
      [senderExternalUserId, tenantId]
    );

    const role = roleResult.rows[0]?.role; // e.g. 'vendor' or undefined

    let senderName = "New message";

    if (role === "vendor") {
      // 4️⃣ Vendor → get shop name
      const shopResult = await pool.query(
        "SELECT name FROM shops WHERE id = $1",
        [tenantId]
      );
      senderName = shopResult.rows[0]?.name || "Shop";
    } else {
      // 5️⃣ Customer → use user name
      senderName = senderUser.name || "Customer";
    }

    // 6️⃣ Build FCM message
    const message = {
      token: fcmToken,
      notification: {
        title: senderName,
        body: body || "New message"
      },
      android: { priority: "high" },
      webpush: {
        notification: {
          icon: "/favicon.ico",
          click_action: "/"
        }
      }
    };

    // 7️⃣ Send push
    const resp = await admin.messaging().send(message);
    console.log("✅ Chat push sent to", receiverExternalUserId, "from", senderName);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Chat notify error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});


module.exports = router;
