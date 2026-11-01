
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

  // If JWT confirms vendor + shop, use that shop.
  if (tokenShopId && tokenRole === "vendor") {
    return Number(tokenShopId);
  }

  // Otherwise resolve vendor shop from DB.
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

    return res.json(products);

  } catch (err) {
    console.error("Error fetching vendor products:", err);

    return res.status(500).json({
      message: "Error fetching products",
      error: err.message,
    });
  }
};


// ============================================================
// PUBLIC PRODUCTS
// Only products from approved stores are visible
// GET /api/products?shopId=123
// ============================================================

const getPublicProducts = async (req, res) => {
  try {
    const shopId = Number(req.query.shopId);

    if (!Number.isInteger(shopId) || shopId <= 0) {
      return res.status(400).json({
        message: "Valid shopId query parameter is required",
      });
    }

    // Allow newly approved stores and existing active stores.
    const tenantResult = await pool.query(
      `
        SELECT id
        FROM tenants
        WHERE shop_id = $1
          AND status IN ('approved', 'active')
        LIMIT 1
      `,
      [shopId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        message: "Store is not available",
      });
    }

    const products = await productModel.getAllProducts(shopId);

    return res.json(products);

  } catch (err) {
    console.error("Error fetching public products:", err);

    return res.status(500).json({
      message: "Error fetching public products",
      error: err.message,
    });
  }
};



// ============================================================
// GET SINGLE PRODUCT
// Existing authenticated route
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

    return res.json(product);

  } catch (err) {
    console.error("Error fetching product:", err);

    return res.status(500).json({
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

    const shop_id = await getVendorShopId(req);

    // Upload image to Cloudinary.
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

    console.log("New product added:", {
      ...newProduct,
      shop_id,
      image,
    });

    return res.status(201).json({
      ...newProduct,
      shop_id,
      image,
    });

  } catch (err) {
    console.error("Error adding product:", err);

    return res.status(500).json({
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

    const shop_id = await getVendorShopId(req);

    // Keep existing image if no new image is uploaded.
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

    const units = [];

    if (unit) {
      units.push({
        name: unit,
        price: unitPrice || price,
        stock: unitStock || stock,
      });
    }

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

    const updatedProduct = await productModel.getProductById(
      Number(id)
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found or does not belong to this vendor",
      });
    }

    console.log("Product updated:", {
      productId: id,
      shop_id,
      hasNewImage: !!req.file,
    });

    return res.json(updatedProduct);

  } catch (err) {
    console.error("Error updating product:", err);

    return res.status(500).json({
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
