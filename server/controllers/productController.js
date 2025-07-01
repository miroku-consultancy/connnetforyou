const productModel = require('../models/productModel');

// GET /api/products
const getProducts = async (req, res) => {
  console.log('Controller: getProducts called');
  try {
    const shopId = req.user?.shop_id; // ✅ Get shop_id from authenticated user
    if (!shopId) return res.status(400).json({ message: 'Missing shop_id in user data' });
    const products = await productModel.getAllProducts(shopId);
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

const addProduct = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'vendor')) {
      return res.status(403).json({ message: 'You are not authorized to add products' });
    }

    const {
      name,
      description,
      price,
      stock,
      barcode,
      category,
      subcategory,
      unit,
      unitPrice,
      unitStock,
    } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('📦 req.file:', req.file); 
    console.log('📝 req.body:', req.body); 

    const image = req.file ? req.file.filename : null;
    const shopId = user.shop_id;

    const newProduct = await productModel.addProduct({
      name,
      description,
      price,
      stock,
      barcode,
      category,
      subcategory,
      image,
      shop_id: shopId,
      unit,
      unitPrice,
      unitStock,
    });

    res.status(201).json({
      message: '✅ Product added successfully',
      product: newProduct,
    });
  } catch (err) {
    console.error('❌ Error adding product:', err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};




module.exports = {
  getProducts,
  getProduct,
  addProduct,
};
