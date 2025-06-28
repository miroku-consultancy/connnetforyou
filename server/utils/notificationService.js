const db = require('../db'); // Adjust based on your actual DB setup

async function sendShopNotification({ shopId, message }) {
  try {
    await db.query(
      'INSERT INTO notifications (shop_id, message) VALUES ($1, $2)',
      [shopId, message]
    );
    console.log(`[Notification] Sent to shop ${shopId}`);
  } catch (err) {
    console.error('[Notification Error]:', err);
  }
}

module.exports = {
  sendShopNotification
};
