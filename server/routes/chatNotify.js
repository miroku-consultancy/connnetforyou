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
router.get("/internal/users/:id", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const id = req.params.id;

  const result = await pool.query(
    "SELECT id, name FROM users WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0)
    return res.status(404).json({ error: "User not found" });

  res.json(result.rows[0]);
});


router.post("/notify/chat", async (req, res) => {
  try {
    const {
      receiverExternalUserId,
      senderExternalUserId,
      shopId,   // 👈 INT shop id from ecom (from .NET JWT claim)
      threadId,
      body
    } = req.body;

    console.log("🔔 Notify called", req.body);

    if (!receiverExternalUserId || !senderExternalUserId || !shopId || !threadId) {
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
      [senderExternalUserId, shopId]
    );

    const role = roleResult.rows[0]?.role;

    let senderName = "New message";

    if (role === "vendor") {
      // 4️⃣ Vendor → get shop name
      const shopResult = await pool.query(
        "SELECT name FROM shops WHERE id = $1",
        [shopId]
      );
      senderName = shopResult.rows[0]?.name || "Shop";
    } else {
      // 5️⃣ Customer → use user name
      senderName = senderUser.name || "Customer";
    }
const chatUrl = `https://www.connectfree4u.com/#/chat/${threadId}`;

    // 6️⃣ Build FCM message
const message = {
  token: fcmToken,
  data: {
    type: "chat",                 // ✅ IMPORTANT
    title: senderName,
    body: body || "New message",
    threadId: String(threadId),
    url: chatUrl
  },
  android: {
    priority: "high",
  },
};

    // 7️⃣ Send push
    await admin.messaging().send(message);
    console.log("✅ Chat push sent to", receiverExternalUserId, "from", senderName);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Chat notify error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});




module.exports = router;
