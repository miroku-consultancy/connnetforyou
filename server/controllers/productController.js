const productModel = require('../models/productModel');

// GET /api/products
const getProducts = async (req, res) => {
  console.log('Controller: getProducts called');
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

// POST /api/products
const addProduct = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Ensure only admin or vendor can add products
    if (!user || (user.role !== 'admin' && user.role !== 'vendor')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const {
      name,
      description,
      price,
      stock,
      barcode,
      category,
      subcategory
    } = req.body;

    // ✅ Basic validation
    if (!name || !price || !stock) {
      return res.status(400).json({ message: 'Missing required fields (name, price, stock)' });
    }

    const shopId = user.shop_id || null;

    const newProduct = await productModel.addProduct({
      name,
      description,
      price,
      stock,
      barcode,
      category,
      subcategory,
      shop_id: shopId
    });

    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  addProduct,
};
