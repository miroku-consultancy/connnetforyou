const pool = require("../db");
const productModel = require("../models/productModel");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ============================================================
// Resolve the actual vendor shop for the logged-in user
// ============================================================
const getVendorShopId = async (req) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new Error("Missing authenticated user id");
  }

  const tokenShopId = req.user?.shop_id;
  const tokenRole = String(req.user?.role || "").toLowerCase();

  // If JWT confirms vendor + shop,
  // safely use the shop from JWT.
  if (tokenShopId && tokenRole === "vendor") {
    return Number(tokenShopId);
  }

  // Otherwise resolve vendor shop from DB.
  //
  // Handles current situation:
  //
  // JWT:
  // role    = customer
  // shop_id = 1
  //
  // user_shop_roles:
  // role    = vendor
  // shop_id = 34
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
    throw new Error("No vendor shop found for this user");
  }

  return Number(rows[0].shop_id);
};


// ============================================================
// GET PRODUCTS FOR CURRENT VENDOR
// ============================================================
const getProducts = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);

    console.log("[Product] Vendor shop resolved:", {
      userId: req.user?.id,
      tokenShopId: req.user?.shop_id,
      tokenRole: req.user?.role,
      resolvedShopId: shopId,
    });

    const products = await productModel.getAllProducts(shopId);

    res.json(products);

  } catch (err) {
    console.error("❌ Error fetching vendor products:", err);

    res.status(500).json({
      message: "Error fetching products",
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
        message: "Missing shopId query parameter",
      });
    }

    const products = await productModel.getAllProducts(shopId);

    res.json(products);

  } catch (err) {
    console.error("❌ Error fetching public products:", err);

    res.status(500).json({
      message: "Error fetching public products",
      error: err.message,
    });
  }
};


// ============================================================
// GET SINGLE PRODUCT
// ============================================================
const getProduct = async (req, res) => {
  try {
    const product = await productModel.getProductById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);

  } catch (err) {
    console.error("❌ Error fetching product:", err);

    res.status(500).json({
      message: "Error fetching product",
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

    // --------------------------------------------------------
    // Upload image to Cloudinary
    // --------------------------------------------------------
    let image = null;

    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "jusping/products"
      );

      image = uploaded.secure_url;
    }

    console.log("[Product] Creating product:", {
      userId: req.user?.id,
      tokenShopId: req.user?.shop_id,
      tokenRole: req.user?.role,
      resolvedShopId: shop_id,
      productName: name,
      hasImage: !!image,
    });

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------
    if (
      !name ||
      !price ||
      !stock ||
      !unit ||
      !category_id ||
      !shop_id
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // --------------------------------------------------------
    // Save product
    // --------------------------------------------------------
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

    console.log("✅ New product added:", {
      ...newProduct,
      shop_id,
      image,
    });

    res.status(201).json({
      ...newProduct,
      shop_id,
      image,
    });

  } catch (err) {
    console.error("❌ Error adding product:", err);

    res.status(500).json({
      message: "Error adding product",
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
      stock,
      barcode,
      unit,
      unitPrice,
      unitStock,
      category_id,
    } = req.body;

    // --------------------------------------------------------
    // Resolve actual vendor shop
    // --------------------------------------------------------
    const shop_id = await getVendorShopId(req);

    // --------------------------------------------------------
    // IMPORTANT:
    //
    // No new image:
    //     undefined
    //     → model keeps existing image
    //
    // New image:
    //     upload to Cloudinary
    //     → replace image URL
    // --------------------------------------------------------
    let image;

    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "jusping/products"
      );

      image = uploaded.secure_url;
    }

    console.log("[Product] Updating product:", {
      productId: id,
      userId: req.user?.id,
      tokenShopId: req.user?.shop_id,
      tokenRole: req.user?.role,
      resolvedShopId: shop_id,
      hasNewImage: !!req.file,
    });

    // --------------------------------------------------------
    // Build units array expected by model
    // --------------------------------------------------------
    const units = [];

    if (unit) {
      units.push({
        name: unit,
        price: unitPrice || price,
        stock: unitStock || stock,
      });
    }

    // --------------------------------------------------------
    // Update product
    // --------------------------------------------------------
    await productModel.updateProductWithUnits({
      id: Number(id),
      shop_id,
      name,
      description,
      price,
      stock,
      barcode,
      image,
      category_id,
      units,
    });

    // --------------------------------------------------------
    // Get updated product
    // --------------------------------------------------------
    const updatedProduct = await productModel.getProductById(
      Number(id)
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found or does not belong to this vendor",
      });
    }

    console.log("✅ Product updated:", {
      productId: id,
      shop_id,
      hasNewImage: !!req.file,
    });

    res.json(updatedProduct);

  } catch (err) {
    console.error("❌ Error updating product:", err);

    res.status(500).json({
      message: "Error updating product",
      error: err.message,
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getProducts,
  getPublicProducts,
  getProduct,
  addProduct,
  updateProduct,
};