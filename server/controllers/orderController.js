// server/controllers/orderController.js
const orderModel = require('../models/orderModel');

// Handle GET request to fetch all orders
const getOrders = async (req, res) => {
  try {
    const orders = await orderModel.getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err });
  }
};

// Handle GET request to fetch an order by ID
const getOrder = async (req, res) => {
  try {
    const order = await orderModel.getOrderById(req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order', error: err });
  }
};

module.exports = { getOrders, getOrder };
