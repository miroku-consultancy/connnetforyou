const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust path if needed

router.patch('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Accepted', 'In Transit', 'Delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const updateResult = await pool.query(
      'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING id, order_status',
      [status, orderId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ id: updateResult.rows[0].id, order_status: updateResult.rows[0].order_status });
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
