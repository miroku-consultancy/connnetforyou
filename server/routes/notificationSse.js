const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const sseRouter = express.Router();

const clients = new Map();

function sendToClients(shopId, data) {
  const subscribers = clients.get(shopId);
  if (subscribers) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    subscribers.forEach(res => res.write(payload));
  }
}

// Replace your old /stream route with this:
sseRouter.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).end('Unauthorized: Missing token');
  }

  let decoded;
  try {
    // Replace 'your_jwt_secret' with your actual JWT secret or env var
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).end('Unauthorized: Invalid token');
  }

  const { shop_id, role } = decoded;

  if (role !== 'vendor' || !shop_id) {
    return res.status(403).end('Forbidden: Not a vendor or missing shop_id');
  }

  // Setup SSE headers
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });

  // Optional initial comment to keep connection alive
  res.write(`: connected\n\n`);

  // Register client for this shop
  if (!clients.has(shop_id)) clients.set(shop_id, []);
  clients.get(shop_id).push(res);

  console.log(`📡 Shop ${shop_id} connected to SSE`);

  // Remove client on disconnect
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
