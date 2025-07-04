const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('./firebaseAdmin');  // Adjust path if needed
const pool = require('../db');

const sseRouter = express.Router();

const clients = new Map();

/**
 * Broadcast notification data to all SSE subscribers for a given shop.
 * @param {string|number} shopId
 * @param {object} data Notification object to send
 */
async function sendToClients(shopId, data) {
  const subscribers = clients.get(shopId);
  const payload = `data: ${JSON.stringify(data)}\n\n`;

  // SSE push
  if (subscribers) {
    subscribers.forEach(res => res.write(payload));
  }

  // FCM push notification
  try {
    // Query the FCM token(s) for this shop (adjust table/column names as needed)
    const result = await pool.query(
      'SELECT fcm_token FROM shop_tokens WHERE shop_id = $1',
      [shopId]
    );

    if (result.rows.length === 0) {
      console.warn(`⚠️ No FCM token found for shop ${shopId}`);
      return;
    }

    // Send notification to each token (or you can batch)
    for (const row of result.rows) {
      const message = {
        token: row.fcm_token,
        notification: {
          title: '🛒 New Order Received',
          body: data.message || 'You have a new order!',
        },
        webpush: {
          notification: {
            icon: '/favicon.ico',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ FCM sent to token ${row.fcm_token}:`, response);
    }
  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error);
  }
}


// SSE stream endpoint for real-time notifications
sseRouter.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).end('Unauthorized: Missing token');
  }

  let decoded;
  try {
    // Use your JWT secret from env or fallback
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).end('Unauthorized: Invalid token');
  }

  const { shop_id, role } = decoded;

  if (role !== 'vendor' || !shop_id) {
    return res.status(403).end('Forbidden: Not a vendor or missing shop_id');
  }

  // Setup SSE headers to keep connection alive
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });

  // Initial comment to establish connection
  res.write(`: connected\n\n`);

  // Register this client for the shop's SSE subscribers
  if (!clients.has(shop_id)) clients.set(shop_id, []);
  clients.get(shop_id).push(res);

  console.log(`📡 Shop ${shop_id} connected to SSE`);

  // Clean up when client disconnects
  req.on('close', () => {
    const updatedClients = (clients.get(shop_id) || []).filter(r => r !== res);
    clients.set(shop_id, updatedClients);
    console.log(`❌ Shop ${shop_id} disconnected from SSE`);
  });
});

module.exports = {
  sseRouter,
  sendToClients,
};
