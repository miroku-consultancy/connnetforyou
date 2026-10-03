const serviceModel = require("../models/serviceModel");
const pool = require("../db");

/*
 * Resolve the vendor shop for the authenticated user.
 *
 * The normal JusPing login can produce a JWT like:
 *
 *   user_id = 1430
 *   shop_id = 1
 *   role = customer
 *
 * But the same user can own vendor stores through:
 *
 *   user_shop_roles
 *
 * Therefore, vendor operations must not blindly trust
 * req.user.shop_id.
 */
const getVendorShopId = async (req) => {
  const userId = req.user?.id;

  if (!userId) {
    return null;
  }

  /*
   * ----------------------------------------------------
   * CASE 1:
   * JWT already represents a selected vendor shop.
   * ----------------------------------------------------
   *
   * Example:
   *
   *   user_id = 1430
   *   shop_id = 32
   *   role = vendor
   *
   * Verify that the user really owns that shop.
   */
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

  /*
   * ----------------------------------------------------
   * CASE 2:
   * Normal/root customer JWT.
   *
   * Find a vendor shop belonging to this user.
   * ----------------------------------------------------
   */
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


/*
 * ======================================================
 * Vendor: get all services belonging to the vendor shop
 * ======================================================
 */
exports.getMyServices = async (req, res) => {
  try {
    console.log("[getMyServices] HIT");
    console.log("[getMyServices] req.user:", req.user);

    const shopId = await getVendorShopId(req);

    console.log("[getMyServices] resolved vendor shopId:", shopId);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a vendor shop"
      });
    }

    const services = await serviceModel.getServicesByShop({
      shopId: Number(shopId)
    });

    console.log(
      "[getMyServices] services:",
      services
    );

    return res.status(200).json(services);

  } catch (error) {
    console.error(
      "[getMyServices] ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch your services"
    });
  }
};


/*
 * ======================================================
 * Public marketplace services
 * ======================================================
 */
exports.getServices = async (req, res) => {
  try {
    const shopId =
      req.query.shopId ||
      req.query.shop_id;

    if (!shopId) {
      return res.status(400).json({
        message: "Missing shopId query parameter"
      });
    }

    const services =
      await serviceModel.getPublishedServices({
        shopId: Number(shopId),
        category: req.query.category,
        search: req.query.search
      });

    return res.status(200).json(services);

  } catch (err) {
    console.error(
      "Error fetching public services:",
      err
    );

    return res.status(500).json({
      message: "Error fetching public services"
    });
  }
};


/*
 * ======================================================
 * Public service details
 *
 * Only published services are publicly accessible.
 * ======================================================
 */
exports.getService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID"
      });
    }

    const service =
      await serviceModel.getServiceById(id);

    if (
      !service ||
      service.status !== "published"
    ) {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    res.json(service);

  } catch (error) {
    console.error(
      "Get service error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch service"
    });
  }
};


/*
 * ======================================================
 * Authenticated vendor creates a service
 * ======================================================
 *
 * IMPORTANT:
 * Services are part of the store approval flow.
 *
 * Therefore we DO NOT use:
 *
 *   pending_review
 *
 * here.
 *
 * New services are created as draft.
 *
 * Store:
 *
 *   draft
 *      ↓
 *   add services
 *      ↓
 *   submit store
 *      ↓
 *   pending
 *      ↓
 *   admin approval
 */
exports.createService = async (req, res) => {
  try {
    const shopId =
      await getVendorShopId(req);

    console.log(
      "[createService] resolved vendor shopId:",
      shopId
    );

    if (!shopId) {
      return res.status(403).json({
        message:
          "Your account is not linked to a vendor shop"
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

    const pricingType =
      pricing_type || "fixed";

    if (
      !validPricingTypes.includes(
        pricingType
      )
    ) {
      return res.status(400).json({
        message: "Invalid pricing type"
      });
    }

    let servicePrice = null;

    if (
      price !== undefined &&
      price !== ""
    ) {
      servicePrice = Number(price);

      if (
        !Number.isFinite(servicePrice) ||
        servicePrice < 0
      ) {
        return res.status(400).json({
          message:
            "Price must be a valid non-negative number"
        });
      }
    }

    /*
     * Quote-based services don't require a price.
     */
    if (pricingType === "quote") {
      servicePrice = null;
    } else if (servicePrice === null) {
      return res.status(400).json({
        message:
          "Price is required for this pricing type"
      });
    }

    const service =
      await serviceModel.createService({
        shop_id: Number(shopId),

        title: title.trim(),

        description,

        category,

        price: servicePrice,

        pricing_type: pricingType,

        image_url: req.file
          ? `/images/services/${req.file.filename}`
          : null,

        /*
         * Store-level approval architecture.
         */
        status: "draft"
      });

    console.log(
      "[createService] created service:",
      service
    );

    return res.status(201).json({
      message:
        "Service created successfully",
      service
    });

  } catch (error) {
    console.error(
      "Create service error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create service"
    });
  }
};


/*
 * ======================================================
 * Authenticated vendor updates own service
 * ======================================================
 */
exports.updateService = async (req, res) => {
  try {
    const shopId =
      await getVendorShopId(req);

    console.log(
      "[updateService] resolved vendor shopId:",
      shopId
    );

    if (!shopId) {
      return res.status(403).json({
        message:
          "Your account is not linked to a vendor shop"
      });
    }

    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid service ID"
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
        message:
          "Service title is required"
      });
    }

    const pricingType =
      pricing_type || "fixed";

    if (
      ![
        "fixed",
        "starting_from",
        "quote"
      ].includes(pricingType)
    ) {
      return res.status(400).json({
        message:
          "Invalid pricing type"
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
          message:
            "A valid non-negative price is required"
        });
      }
    }

    /*
     * Keep the existing behavior:
     *
     * inactive → inactive
     * anything else → draft
     *
     * This keeps editing from accidentally publishing
     * a service before the store is approved.
     */
    const status =
      req.body.status === "inactive"
        ? "inactive"
        : "draft";

    const service =
      await serviceModel.updateService(
        id,
        Number(shopId),
        {
          title: title.trim(),

          description,

          category,

          price: servicePrice,

          pricing_type: pricingType,

          image_url: req.file
            ? `/images/services/${req.file.filename}`
            : null,

          status
        }
      );

    if (!service) {
      return res.status(404).json({
        message:
          "Service not found or you do not own this service"
      });
    }

    return res.json({
      message:
        "Service updated successfully",
      service
    });

  } catch (error) {
    console.error(
      "Update service error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update service"
    });
  }
};


/*
 * ======================================================
 * Authenticated vendor deletes own service
 * ======================================================
 */
exports.deleteService = async (req, res) => {
  try {
    const shopId =
      await getVendorShopId(req);

    console.log(
      "[deleteService] resolved vendor shopId:",
      shopId
    );

    if (!shopId) {
      return res.status(403).json({
        message:
          "Your account is not linked to a vendor shop"
      });
    }

    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid service ID"
      });
    }

    const deleted =
      await serviceModel.deleteService(
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
      message:
        "Service deleted successfully"
    });

  } catch (error) {
    console.error(
      "Delete service error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete service"
    });
  }
};