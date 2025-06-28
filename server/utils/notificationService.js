// notificationService.js (backend)
const db = require('../db');

async function sendShopNotification({ shopId, message }) {
  try {
    await db.query(
      'INSERT INTO notifications (shop_id, message) VALUES ($1, $2)',
      [shopId, message]
    );
    console.log(`Notification sent to shop ${shopId}`);
  } catch (err) {
    console.error('Notification error:', err);
  }
}

module.exports = {
  sendShopNotification,
};
