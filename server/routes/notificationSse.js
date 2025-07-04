// routes/notificationSse.js
const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('./firebaseAdmin'); // initialize firebase-admin SDK
const pool = require('../db');

const sseRouter = express.Router();
const clients = new Map();

async function sendToClients(shopId, data) {
  const subs = clients.get(shopId);
  const ssePayload = `data: ${JSON.stringify(data)}\n\n`;
  if (subs) subs.forEach(res => res.write(ssePayload));

  const result = await pool.query(
    'SELECT fcm_token FROM shop_tokens WHERE shop_id = $1',
    [shopId]
  );
  if (result.rows.length === 0) {
    console.warn(`⚠️ No FCM token for shop ${shopId}`);
    return;
  }

  for (const { fcm_token } of result.rows) {
    const message = {
      token: fcm_token,
      notification: {
        title: '🛒 New Order Received',
        body: data.message || 'You have a new order!',
      },
      webpush: {
        notification: {
          icon: '/favicon.ico',
          tag: 'shop-order',
          click_action: `/shop-orders`,
        },
        headers: { Urgency: 'high' },
      },
      android: { priority: 'high' },
    };

    try {
      const resp = await admin.messaging().send(message);
      console.log(`✅ FCM sent to ${fcm_token}:`, resp);
    } catch (err) {
      console.error(`❌ FCM failed for ${fcm_token}:`, err.message);
    }
  }
}

sseRouter.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end('Missing token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT verify failed:', err.message);
    return res.status(401).end('Invalid token');
  }

  const { shop_id, role } = decoded;
  if (role !== 'vendor' || !shop_id) {
    return res.status(403).end('Forbidden');
  }

  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });
  res.write(`: connected\n\n`);
  if (!clients.has(shop_id)) clients.set(shop_id, []);
  clients.get(shop_id).push(res);
  console.log(`📡 Shop ${shop_id} connected`);

  req.on('close', () => {
    const arr = (clients.get(shop_id) || []).filter(r => r !== res);
    clients.set(shop_id, arr);
    console.log(`❌ Shop ${shop_id} disconnected`);
  });
});

module.exports = { sseRouter, sendToClients };
