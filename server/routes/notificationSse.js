const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const sseRouter = express.Router();

const clients = new Map();

/**
 * Broadcast notification data to all SSE subscribers for a given shop.
 * @param {string|number} shopId
 * @param {object} data Notification object to send
 */
function sendToClients(shopId, data) {
  const subscribers = clients.get(shopId);
  if (subscribers) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    subscribers.forEach(res => res.write(payload));
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
