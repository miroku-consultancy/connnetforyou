
const serviceModel = require("../models/serviceModel");
const pool = require("../db");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ---------------------------------------------------------
// Resolve vendor shop from user_shop_roles
// ---------------------------------------------------------
const getVendorShopId = async (req) => {
  const userId = req.user?.id;

  if (!userId) return null;

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
// Vendor: get own services
// ---------------------------------------------------------
exports.getMyServices = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const services = await serviceModel.getServicesByShop({
      shopId: Number(shopId)
    });

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
    const rawShopId = req.query.shopId || req.query.shop_id;
    const shopId = Number(rawShopId);

    if (
      !rawShopId ||
      !Number.isInteger(shopId) ||
      shopId <= 0
    ) {
      return res.status(400).json({
        message: "A valid shopId query parameter is required"
      });
    }

    const services = await serviceModel.getPublishedServices({
      shopId,
      category: req.query.category,
      search: req.query.search
    });

    return res.status(200).json(services);
  } catch (error) {
    console.error("[getServices] ERROR:", error);

    return res.status(500).json({
      message: "Error fetching public services"
    });
  }
};

// ---------------------------------------------------------
// Public: get one published service
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
    console.error("[getService] ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch service"
    });
  }
};

// ---------------------------------------------------------
// Vendor: create service
// Initial status = draft
// ---------------------------------------------------------
exports.createService = async (req, res) => {
  try {
    const shopId = await getVendorShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const serviceCount = await serviceModel.countServicesByShop({
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

    if (!["fixed", "starting_from", "quote"].includes(pricingType)) {
      return res.status(400).json({
        message: "Invalid pricing type"
      });
    }

    let servicePrice = null;

    if (pricingType !== "quote") {
      servicePrice = Number(price);

      if (
        price === undefined ||
        price === "" ||
        !Number.isFinite(servicePrice) ||
        servicePrice < 0
      ) {
        return res.status(400).json({
          message: "A valid non-negative price is required"
        });
      }
    }

    let imageUrl = null;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "jusping/services"
      );

      imageUrl = uploadedImage.secure_url;
    }

    const service = await serviceModel.createService({
      shop_id: Number(shopId),
      title: title.trim(),
      description,
      category,
      price: servicePrice,
      pricing_type: pricingType,
      image_url: imageUrl,
      status: "draft"
    });

    return res.status(201).json({
      message: "Service created successfully. Submit it for review when ready.",
      service
    });
  } catch (error) {
    console.error("[createService] ERROR:", error);

    return res.status(500).json({
      message: "Failed to create service"
    });
  }
};

// ---------------------------------------------------------
// Vendor: update own service
//
// published      -> pending_review
// pending_review -> pending_review
// rejected       -> draft
// draft          -> draft
// inactive       -> inactive
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

    if (!["fixed", "starting_from", "quote"].includes(pricingType)) {
      return res.status(400).json({
        message: "Invalid pricing type"
      });
    }

    let servicePrice = null;

    if (pricingType !== "quote") {
      servicePrice = Number(price);

      if (
        price === undefined ||
        price === "" ||
        !Number.isFinite(servicePrice) ||
        servicePrice < 0
      ) {
        return res.status(400).json({
          message: "A valid non-negative price is required"
        });
      }
    }

    // Read current status and verify ownership.
    const existingResult = await pool.query(
      `
      SELECT id, status
      FROM services
      WHERE id = $1
        AND shop_id = $2
      LIMIT 1
      `,
      [id, Number(shopId)]
    );

    if (existingResult.rowCount === 0) {
      return res.status(404).json({
        message: "Service not found or you do not own this service"
      });
    }

    const currentStatus = existingResult.rows[0].status;

    let nextStatus;

    if (
      currentStatus === "published" ||
      currentStatus === "pending_review"
    ) {
      nextStatus = "pending_review";
    } else if (currentStatus === "inactive") {
      nextStatus = "inactive";
    } else {
      nextStatus = "draft";
    }

    let imageUrl = null;

    if (req.file) {
      const uploadedImage = await uploadToCloudinary(
        req.file.buffer,
        "jusping/services"
      );

      imageUrl = uploadedImage.secure_url;
    }

    const service = await serviceModel.updateService(
      id,
      Number(shopId),
      {
        title: title.trim(),
        description,
        category,
        price: servicePrice,
        pricing_type: pricingType,
        image_url: imageUrl,
        status: nextStatus
      }
    );

    if (!service) {
      return res.status(404).json({
        message: "Service could not be updated"
      });
    }

    return res.json({
      message:
        nextStatus === "pending_review"
          ? "Service updated and submitted for review"
          : "Service updated successfully",
      service
    });
  } catch (error) {
    console.error("[updateService] ERROR:", error);

    return res.status(500).json({
      message: "Failed to update service"
    });
  }
};

// ---------------------------------------------------------
// Vendor: submit draft/rejected service for review
// draft/rejected -> pending_review
// ---------------------------------------------------------
exports.submitServiceForReview = async (req, res) => {
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

    const result = await pool.query(
      `
      UPDATE services
      SET
        status = 'pending_review',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND shop_id = $2
        AND status IN ('draft', 'rejected')
      RETURNING *
      `,
      [id, Number(shopId)]
    );

    if (result.rowCount === 0) {
      const existing = await pool.query(
        `
        SELECT status
        FROM services
        WHERE id = $1
          AND shop_id = $2
        LIMIT 1
        `,
        [id, Number(shopId)]
      );

      if (existing.rowCount === 0) {
        return res.status(404).json({
          message: "Service not found or you do not own this service"
        });
      }

      return res.status(409).json({
        message: `Service cannot be submitted from '${existing.rows[0].status}' status`,
        status: existing.rows[0].status
      });
    }

    return res.json({
      message: "Service submitted for review successfully",
      service: result.rows[0]
    });
  } catch (error) {
    console.error("[submitServiceForReview] ERROR:", error);

    return res.status(500).json({
      message: "Failed to submit service for review"
    });
  }
};

// ---------------------------------------------------------
// Master admin: approve service
// pending_review -> published
// ---------------------------------------------------------
exports.adminApproveService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const result = await pool.query(
      `
      UPDATE services s
      SET
        status = 'published',
        updated_at = CURRENT_TIMESTAMP
      FROM tenants t
      WHERE s.id = $1
        AND s.status = 'pending_review'
        AND t.shop_id = s.shop_id
        AND t.status IN ('approved', 'active')
      RETURNING s.*
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message: "Service is not awaiting review or its store is not approved"
      });
    }

    return res.json({
      message: "Service approved and published successfully",
      service: result.rows[0]
    });
  } catch (error) {
    console.error("[adminApproveService] ERROR:", error);

    return res.status(500).json({
      message: "Failed to approve service"
    });
  }
};

// ---------------------------------------------------------
// Master admin: reject service
// pending_review -> rejected
// ---------------------------------------------------------
exports.adminRejectService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const result = await pool.query(
      `
      UPDATE services
      SET
        status = 'rejected',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND status = 'pending_review'
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message: "Service is not awaiting review"
      });
    }

    return res.json({
      message: "Service rejected successfully",
      service: result.rows[0]
    });
  } catch (error) {
    console.error("[adminRejectService] ERROR:", error);

    return res.status(500).json({
      message: "Failed to reject service"
    });
  }
};

// ---------------------------------------------------------
// Vendor: delete own service
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
        message: "Service not found or you do not own this service"
      });
    }

    return res.json({
      message: "Service deleted successfully"
    });
  } catch (error) {
    console.error("[deleteService] ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete service"
    });
  }
};
