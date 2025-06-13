const productModel = require('../models/productModel');


// Get all products
const getProducts = async (req, res) => {
  console.log('Controller: getProducts called');
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err });
  }
};


// Get product by ID
const getProduct = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err });
  }
};

module.exports = {
  getProducts,
  getProduct,
};
