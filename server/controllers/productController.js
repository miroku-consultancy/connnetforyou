const productModel = require('../models/productModel');

const getProducts = async (req, res) => {
  try {
    const shopId = req.user?.shop_id;
    if (!shopId) {
      return res.status(400).json({ message: 'Missing shop_id in user token' });
    }

    const products = await productModel.getAllProducts(shopId);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

// 🆕 Public (no auth)
const getPublicProducts = async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Missing shopId query parameter' });
    }

    const products = await productModel.getAllProducts(shopId);
    res.json(products);
  } catch (err) {
    console.error('Error fetching public products:', err);
    res.status(500).json({ message: 'Error fetching public products', error: err.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, subcategory } = req.body;
    const shopId = req.user?.shop_id;

    if (!name || !price || !shopId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const image = req.file ? req.file.filename : null;

    const newProduct = await productModel.createProduct({
      name,
      description,
      price,
      subcategory,
      image,
      shopId,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, subcategory } = req.body;
    const image = req.file ? req.file.filename : null;

    const updatedProduct = await productModel.updateProduct(id, {
      name,
      description,
      price,
      subcategory,
      image,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found or not updated' });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

module.exports = {
  getProducts,
  getPublicProducts,
  getProduct,
  addProduct,
  updateProduct,
};
