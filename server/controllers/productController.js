const productModel = require('../models/productModel');

// GET all products
const getProducts = async (req, res) => {
  try {
    const shopId = req.user?.shop_id;
    if (!shopId) return res.status(400).json({ message: 'Missing shop_id' });

    const products = await productModel.getAllProducts(shopId);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

// GET one product
const getProduct = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    product
      ? res.json(product)
      : res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

// ADD new product or unit
const addProduct = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'vendor')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const {
      name, description, price, stock, barcode, category, subcategory,
      unit, unitPrice, unitStock,
    } = req.body;

    if (!name || !price || !stock || !category || !subcategory || !unit) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const image = req.file ? req.file.filename : null;
    const shop_id = user.shop_id;

    const product = await productModel.addProduct({
      name, description, price, stock, barcode, category, subcategory,
      image, shop_id, unit, unitPrice, unitStock,
    });

    res.status(201).json({
      message: '✅ Product added/updated successfully',
      product,
    });
  } catch (err) {
    console.error('❌ Error adding product:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  addProduct,
};
