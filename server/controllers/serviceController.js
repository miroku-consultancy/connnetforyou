const serviceModel = require("../models/serviceModel");

const getShopId = (req) => {
  return req.user?.shop_id;
};

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

// Public details: only published services
exports.getService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await serviceModel.getServiceById(id);

    if (!service || service.status !== "published") {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({ message: "Failed to fetch service" });
  }
};

// Authenticated provider creates service
exports.createService = async (req, res) => {
  try {
    const shopId = getShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a shop"
      });
    }

    const { title, description, category, price, pricing_type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Service title is required"
      });
    }

    const validPricingTypes = ["fixed", "starting_from", "quote"];
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

    const service = await serviceModel.createService({
      shop_id: shopId,
      title: title.trim(),
      description,
      category,
      price: servicePrice,
      pricing_type: pricingType,
      image_url: req.file
        ? `/images/services/${req.file.filename}`
        : null,
      status: "draft"
    });

    res.status(201).json({
      message: "Service created successfully",
      service
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({ message: "Failed to create service" });
  }
};

// Authenticated provider updates own service
exports.updateService = async (req, res) => {
  try {
    const shopId = getShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a shop"
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const { title, description, category, price, pricing_type } = req.body;

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

      if (price === "" || price === undefined ||
          !Number.isFinite(servicePrice) || servicePrice < 0) {
        return res.status(400).json({
          message: "A valid non-negative price is required"
        });
      }
    }

    const service = await serviceModel.updateService(id, shopId, {
      title: title.trim(),
      description,
      category,
      price: servicePrice,
      pricing_type: pricingType,
      image_url: req.file
        ? `/images/services/${req.file.filename}`
        : null,
      status: req.body.status === "inactive"
        ? "inactive"
        : "draft"
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found or you do not own this service"
      });
    }

    res.json({
      message: "Service updated successfully",
      service
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ message: "Failed to update service" });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const shopId = getShopId(req);

    if (!shopId) {
      return res.status(403).json({
        message: "Your account is not linked to a shop"
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const deleted = await serviceModel.deleteService(id, shopId);

    if (!deleted) {
      return res.status(404).json({
        message: "Service not found or you do not own this service"
      });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: "Failed to delete service" });
  }
};