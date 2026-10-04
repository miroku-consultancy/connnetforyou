const pool = require('../config/db');
const productModel = require('../models/productModel');

// ============================================================
// Resolve the actual vendor shop for the logged-in user
// ============================================================
const getVendorShopId = async (req) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new Error('Missing authenticated user id');
  }

  const tokenShopId = req.user?.shop_id;
  const tokenRole = String(req.user?.role || '').toLowerCase();

  // If JWT itself confirms the user is a vendor,
  // we can safely use its shop_id.
  if (tokenShopId && tokenRole === 'vendor') {
    return Number(tokenShopId);
  }

  // Otherwise resolve vendor shop from DB.
  // This handles your current case where:
  //
  // JWT:
  //   role    = customer
  //   shop_id = 1
  //
  // but user_shop_roles says:
  //   role    = vendor
  //   shop_id = 34
  //
  const { rows } = await pool.query(
    `
      SELECT shop_id
      FROM user_shop_roles
      WHERE user_id = $1
        AND role = 'vendor'
      ORDER BY shop_id ASC
      LIMIT 1
    `,
    [userId]
  );

  if (!rows.length) {
    throw new Error('No vendor shop found for this user');
  }

  return Number(rows[0].shop_id);
};


// ============================================================
// GET PRODUCTS FOR CURRENT VENDOR
// ============================================================
const getProducts = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);

    console.log('[Product] Vendor shop resolved:', {
      userId: req.user?.id,
      tokenShopId: req.user?.shop_id,
      tokenRole: req.user?.role,
      resolvedShopId: shopId,
    });

    const products = await productModel.getAllProducts(shopId);

    res.json(products);
  } catch (err) {
    console.error('Error fetching vendor products:', err);

    res.status(500).json({
      message: 'Error fetching products',
      error: err.message,
    });
  }
};


// ============================================================
// PUBLIC PRODUCTS
// ============================================================
const getPublicProducts = async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({
        message: 'Missing shopId query parameter',
      });
    }

    const products = await productModel.getAllProducts(shopId);

    res.json(products);
  } catch (err) {
    console.error('Error fetching public products:', err);

    res.status(500).json({
      message: 'Error fetching public products',
      error: err.message,
    });
  }
};


// ============================================================
// GET SINGLE PRODUCT
// ============================================================
const getProduct = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);

    res.status(500).json({
      message: 'Error fetching product',
      error: err.message,
    });
  }
};


// ============================================================
// ADD PRODUCT
// ============================================================
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      barcode,
      unit,
      unitPrice,
      unitStock,
      category_id,
    } = req.body;

    // IMPORTANT:
    // Do NOT use req.user.shop_id directly.
    const shop_id = await getVendorShopId(req);

    const image = req.file ? req.file.filename : null;

    console.log('[Product] Creating product for vendor shop:', {
      userId: req.user?.id,
      tokenShopId: req.user?.shop_id,
      tokenRole: req.user?.role,
      resolvedShopId: shop_id,
      productName: name,
    });

    // Basic validation
    if (
      !name ||
      !price ||
      !stock ||
      !unit ||
      !category_id ||
      !shop_id
    ) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    const newProduct = await productModel.addProduct({
      name,
      description,
      price,
      stock,
      barcode,
      image,
      shop_id,
      unit,
      unitPrice,
      unitStock,
      category_id,
    });

    console.log('✅ New product added:', {
      ...newProduct,
      shop_id,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('❌ Error adding product:', err);

    res.status(500).json({
      message: 'Error adding product',
      error: err.message,
    });
  }
};


// ============================================================
// UPDATE PRODUCT
// ============================================================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      subcategory,
    } = req.body;

    // Resolve actual vendor shop
    const shop_id = await getVendorShopId(req);

    const image = req.file ? req.file.filename : null;

    console.log('[Product] Updating product:', {
      productId: id,
      userId: req.user?.id,
      resolvedShopId: shop_id,
    });

    const updatedProduct = await productModel.updateProduct(id, {
      name,
      description,
      price,
      subcategory,
      image,
      shop_id,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        message: 'Product not found or not updated',
      });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);

    res.status(500).json({
      message: 'Error updating product',
      error: err.message,
    });
  }
};


module.exports = {
  getProducts,
  getPublicProducts,
  getProduct,
  addProduct,
  updateProduct,
};