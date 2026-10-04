const serviceModel = require("../models/serviceModel");
const pool = require("../db");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ---------------------------------------------------------
// Resolve the vendor's shop from user_shop_roles
// ---------------------------------------------------------
const getVendorShopId = async (req) => {
  const userId = req.user?.id;

  if (!userId) {
    return null;
  }

  // If JWT already represents a vendor shop,
  // verify that the user actually owns that shop.
  if (req.user?.shop_id && req.user?.role === "vendor") {
    const selectedResult = await pool.query(
      `
      SELECT shop_id
      FROM user_shop_roles
      WHERE user_id = $1
        AND shop_id = $2
        AND role = 'vendor'
      LIMIT 1
      `,
      [userId, req.user.shop_id]
    );

    if (selectedResult.rows.length > 0) {
      return selectedResult.rows[0].shop_id;
    }
  }

  // Root login may have:
  // role = customer
  // shop_id = 1
  //
  // So fall back to the vendor shop linked
  // through user_shop_roles.
  const vendorResult = await pool.query(
    `
    SELECT shop_id
    FROM user_shop_roles
    WHERE user_id = $1
      AND role = 'vendor'
    ORDER BY id ASC
    LIMIT 1
    `,
    [userId]
  );

  return vendorResult.rows[0]?.shop_id || null;
};


// ---------------------------------------------------------
// Vendor: get all services belonging to vendor's shop
// ---------------------------------------------------------
exports.getMyServices = async (req, res) => {
  try {
    console.log("[getMyServices] HIT");
    console.log("[getMyServices] req.user:", req.user);

    const shopId = await getVendorShopId(req);

    console.log("[getMyServices] vendor shopId:", shopId);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const services = await serviceModel.getServicesByShop({
      shopId: Number(shopId)
    });

    console.log("[getMyServices] services:", services);

    return res.status(200).json(services);

  } catch (error) {
    console.error("[getMyServices] ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch your services"
    });
  }
};


// ---------------------------------------------------------
// Public: get published services
// ---------------------------------------------------------
exports.getServices = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.query.shop_id;

    if (!shopId) {
      return res.status(400).json({
        message: "Missing shopId query parameter"
      });
    }

    const services = await serviceModel.getPublishedServices({
      shopId: Number(shopId),
      category: req.query.category,
      search: req.query.search
    });

    return res.status(200).json(services);

  } catch (err) {
    console.error("Error fetching public services:", err);

    return res.status(500).json({
      message: "Error fetching public services"
    });
  }
};


// ---------------------------------------------------------
// Public details: only published services
// ---------------------------------------------------------
exports.getService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const service = await serviceModel.getServiceById(id);

    if (!service || service.status !== "published") {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    return res.json(service);

  } catch (error) {
    console.error("Get service error:", error);

    return res.status(500).json({
      message: "Failed to fetch service"
    });
  }
};


// ---------------------------------------------------------
// Authenticated provider creates service
// ---------------------------------------------------------
exports.createService = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);
    // -------------------------------------------------------
// Free plan: maximum 10 services
// -------------------------------------------------------
const serviceCount =
  await serviceModel.countServicesByShop({
    shopId: Number(shopId)
  });

const FREE_SERVICE_LIMIT = 10;

if (serviceCount >= FREE_SERVICE_LIMIT) {
  return res.status(403).json({
    message:
      "You have reached the Free plan limit of 10 services. Upgrade your plan to add more services.",
    code: "FREE_SERVICE_LIMIT_REACHED",
    limit: FREE_SERVICE_LIMIT,
    currentCount: serviceCount
  });
}

    console.log("[createService] vendor shopId:", shopId);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const {
      title,
      description,
      category,
      price,
      pricing_type
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Service title is required"
      });
    }

    const validPricingTypes = [
      "fixed",
      "starting_from",
      "quote"
    ];

    const pricingType = pricing_type || "fixed";

    if (!validPricingTypes.includes(pricingType)) {
      return res.status(400).json({
        message: "Invalid pricing type"
      });
    }

    let servicePrice = null;

    if (price !== undefined && price !== "") {
      servicePrice = Number(price);

      if (!Number.isFinite(servicePrice) || servicePrice < 0) {
        return res.status(400).json({
          message: "Price must be a valid non-negative number"
        });
      }
    }

    if (pricingType === "quote") {
      servicePrice = null;
    } else if (servicePrice === null) {
      return res.status(400).json({
        message: "Price is required for this pricing type"
      });
    }

    // -------------------------------------------------------
    // Upload service image to Cloudinary
    // -------------------------------------------------------
    let imageUrl = null;

    if (req.file) {
      console.log(
        "[createService] Uploading image to Cloudinary..."
      );

      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "jusping/services"
      );

      imageUrl = uploadedImage.secure_url;

      console.log(
        "[createService] Cloudinary image URL:",
        imageUrl
      );
    }

    // -------------------------------------------------------
    // Create service in database
    // -------------------------------------------------------
    const service = await serviceModel.createService({
      shop_id: Number(shopId),
      title: title.trim(),
      description,
      category,
      price: servicePrice,
      pricing_type: pricingType,
      image_url: imageUrl,

      // Store-level approval architecture:
      // service is initially part of the draft store.
      status: "draft"
    });

    return res.status(201).json({
      message: "Service created successfully",
      service
    });

  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      message: "Failed to create service"
    });
  }
};


// ---------------------------------------------------------
// Authenticated provider updates own service
// ---------------------------------------------------------
exports.updateService = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const {
      title,
      description,
      category,
      price,
      pricing_type
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Service title is required"
      });
    }

    const pricingType = pricing_type || "fixed";

    if (
      ![
        "fixed",
        "starting_from",
        "quote"
      ].includes(pricingType)
    ) {
      return res.status(400).json({
        message: "Invalid pricing type"
      });
    }

    let servicePrice = null;

    if (pricingType !== "quote") {
      servicePrice = Number(price);

      if (
        price === "" ||
        price === undefined ||
        !Number.isFinite(servicePrice) ||
        servicePrice < 0
      ) {
        return res.status(400).json({
          message: "A valid non-negative price is required"
        });
      }
    }

    // -------------------------------------------------------
    // Upload new image only if one was selected
    // -------------------------------------------------------
    let imageUrl = null;

    if (req.file) {
      console.log(
        "[updateService] Uploading new image to Cloudinary..."
      );

      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "jusping/services"
      );

      imageUrl = uploadedImage.secure_url;

      console.log(
        "[updateService] Cloudinary image URL:",
        imageUrl
      );
    }

    // -------------------------------------------------------
    // Update service in database
    // -------------------------------------------------------
    const service = await serviceModel.updateService(
      id,
      Number(shopId),
      {
        title: title.trim(),
        description,
        category,
        price: servicePrice,
        pricing_type: pricingType,

        // null means keep existing image because
        // serviceModel uses COALESCE()
        image_url: imageUrl,

        status:
          req.body.status === "inactive"
            ? "inactive"
            : "draft"
      }
    );

    if (!service) {
      return res.status(404).json({
        message:
          "Service not found or you do not own this service"
      });
    }

    return res.json({
      message: "Service updated successfully",
      service
    });

  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      message: "Failed to update service"
    });
  }
};


// ---------------------------------------------------------
// Authenticated provider deletes own service
// ---------------------------------------------------------
exports.deleteService = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const deleted = await serviceModel.deleteService(
      id,
      Number(shopId)
    );

    if (!deleted) {
      return res.status(404).json({
        message:
          "Service not found or you do not own this service"
      });
    }

    return res.json({
      message: "Service deleted successfully"
    });

  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      message: "Failed to delete service"
    });
  }
};