const express = require('express');
const auth = require('../middleware/authMiddleware');
const pool = require('../db');

const sseRouter = express.Router();

// Track SSE connections per shop
const clients = new Map();

/**
 * Utility to send a notification to all SSE clients of a shop
 */
function sendToClients(shopId, data) {
  const subscribers = clients.get(shopId);
  if (subscribers) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    subscribers.forEach(res => res.write(payload));
  }
}

/**
 * SSE endpoint - Keeps the connection open and streams notifications
 */
sseRouter.get('/stream', auth, (req, res) => {
  const { shop_id, role } = req.user;

  if (role !== 'vendor' || !shop_id) {
    return res.status(403).end();
  }

  // Setup headers for SSE
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });
  res.write(`data: ${JSON.stringify(payload)}\n\n`);


  // Register client
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

/**
 * Optional: Fetch past notifications (for dashboard display)
 */
sseRouter.get('/history', auth, async (req, res) => {
  const { shop_id, role } = req.user;

  if (role !== 'vendor' || !shop_id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await pool.query(
      'SELECT id, message, is_read, created_at FROM notifications WHERE shop_id = $1 ORDER BY created_at DESC',
      [shop_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notification history:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = {
  sseRouter,
  sendToClients,
};
