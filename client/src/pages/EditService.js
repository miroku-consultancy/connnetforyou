import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";
import "./EditService.css";

const EditService = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricingType, setPricingType] = useState("fixed");
  const [price, setPrice] = useState("");

  const [existingImage, setExistingImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [serviceStatus, setServiceStatus] = useState("");

  const token = localStorage.getItem("token");

  // --------------------------------------------------
  // Load categories
  // --------------------------------------------------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${secondaryApiUrl}/api/categories`);

        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Load categories error:", err);
      }
    };

    loadCategories();
  }, []);

  // --------------------------------------------------
  // Load service
  // --------------------------------------------------
  useEffect(() => {
    const loadService = async () => {
      try {
        setLoading(true);
        setError("");

        // First use service passed from MyServiceStore
        const passedService = location.state?.service;

        if (passedService) {
          populateForm(passedService);
          return;
        }

        // If page is refreshed, state is lost.
        // Fetch vendor's services and find this service.
        const response = await fetch(
          `${secondaryApiUrl}/api/services/my-services`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load your services");
        }

        const data = await response.json();

        const serviceList = Array.isArray(data)
          ? data
          : data.services || data.data || [];

        const foundService = serviceList.find(
          (service) => String(service.id) === String(id)
        );

        if (!foundService) {
          throw new Error("Service not found");
        }

        populateForm(foundService);
      } catch (err) {
        console.error("Load service error:", err);
        setError(err.message || "Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, location.state, token]);

  // --------------------------------------------------
  // Populate form
  // --------------------------------------------------
  const populateForm = (service) => {
    setTitle(service.title || "");
    setDescription(service.description || "");
    setCategory(service.category || "");

    setPricingType(service.pricing_type || "fixed");

    setPrice(
      service.price !== null && service.price !== undefined
        ? service.price
        : ""
    );

    setExistingImage(service.image_url || "");
    setServiceStatus(service.status || "");
  };

  // --------------------------------------------------
  // Image selection
  // --------------------------------------------------
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // --------------------------------------------------
  // Remove selected new image
  // --------------------------------------------------
  const handleRemoveNewImage = () => {
    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------
  const validateForm = () => {
    if (!title.trim()) {
      setError("Please enter a service title.");
      return false;
    }

    if (!pricingType) {
      setError("Please select a pricing type.");
      return false;
    }

    if (
      (pricingType === "fixed" || pricingType === "starting_from") &&
      (!price || Number(price) <= 0)
    ) {
      setError("Please enter a valid price.");
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // Save service
  // --------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("pricing_type", pricingType);

      if (pricingType !== "quote") {
        formData.append("price", price);
      }

      // Only send image if user selected a new image.
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(
        `${secondaryApiUrl}/api/services/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update service"
        );
      }

      setSuccess(
        "Service updated successfully and submitted for review."
      );

      setTimeout(() => {
        navigate("/my-service-store");
      }, 1200);
    } catch (err) {
      console.error("Update service error:", err);
      setError(err.message || "Failed to update service.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Delete service
  // --------------------------------------------------
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${secondaryApiUrl}/api/services/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to delete service"
        );
      }

      navigate("/my-service-store");
    } catch (err) {
      console.error("Delete service error:", err);
      setError(err.message || "Failed to delete service.");
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // Price display
  // --------------------------------------------------
  const getPricingText = () => {
    if (pricingType === "quote") {
      return "Customer will request a quote";
    }

    if (pricingType === "starting_from") {
      return "Starting from this price";
    }

    return "Fixed service price";
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="edit-service-page">
        <div className="edit-service-container">
          <div className="edit-service-loading">
            <div className="edit-service-spinner"></div>
            <p>Loading service...</p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Error loading service
  // --------------------------------------------------
  if (error && !title) {
    return (
      <div className="edit-service-page">
        <div className="edit-service-container">
          <div className="edit-service-error-card">
            <div className="edit-service-error-icon">!</div>

            <h2>Unable to load service</h2>

            <p>{error}</p>

            <button
              className="edit-btn edit-btn-primary"
              onClick={() => navigate("/my-service-store")}
            >
              Back to My Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-service-page">
      <div className="edit-service-container">

        {/* ---------------------------------------------
            Header
        --------------------------------------------- */}
        <div className="edit-service-header">
          <div className="edit-service-header-left">
            <button
              type="button"
              className="edit-back-button"
              onClick={() => navigate("/my-service-store")}
              aria-label="Back"
            >
              ←
            </button>

            <div>
              <div className="edit-service-eyebrow">
                MY SERVICE STORE
              </div>

              <h1>Edit Service</h1>

              <p>
                Update your service information and keep your
                listing fresh.
              </p>
            </div>
          </div>

          {serviceStatus && (
            <div className={`edit-current-status status-${serviceStatus}`}>
              {serviceStatus === "published"
                ? "Published"
                : serviceStatus === "pending_review"
                ? "Pending Review"
                : serviceStatus === "rejected"
                ? "Rejected"
                : serviceStatus === "inactive"
                ? "Inactive"
                : "Draft"}
            </div>
          )}
        </div>

        {/* ---------------------------------------------
            Alerts
        --------------------------------------------- */}
        {error && (
          <div className="edit-alert edit-alert-error">
            <span className="edit-alert-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="edit-alert edit-alert-success">
            <span className="edit-alert-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* ---------------------------------------------
            Review notice
        --------------------------------------------- */}
        <div className="edit-review-notice">
          <div className="edit-review-icon">✓</div>

          <div>
            <strong>Changes go through review</strong>
            <p>
              When you update a service, the changes may be
              submitted for admin review before becoming live.
            </p>
          </div>
        </div>

        {/* ---------------------------------------------
            Main Form
        --------------------------------------------- */}
        <form
          className="edit-service-form"
          onSubmit={handleSubmit}
        >

          {/* LEFT COLUMN */}
          <div className="edit-service-main">

            {/* Basic Information */}
            <section className="edit-card">
              <div className="edit-card-header">
                <div>
                  <h2>Basic Information</h2>
                  <p>
                    Tell customers what service you provide.
                  </p>
                </div>

                <span className="edit-section-number">
                  01
                </span>
              </div>

              <div className="edit-form-group">
                <label htmlFor="service-title">
                  Service Title
                  <span>*</span>
                </label>

                <input
                  id="service-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Home AC Repair"
                  maxLength={120}
                />

                <div className="edit-input-meta">
                  <span>
                    Use a clear name customers can understand.
                  </span>

                  <span>{title.length}/120</span>
                </div>
              </div>

              <div className="edit-form-group">
                <label htmlFor="service-description">
                  Description
                </label>

                <textarea
                  id="service-description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe what is included in this service..."
                  rows={6}
                  maxLength={1000}
                />

                <div className="edit-input-meta">
                  <span>
                    Explain what customers can expect.
                  </span>

                  <span>
                    {description.length}/1000
                  </span>
                </div>
              </div>

              <div className="edit-form-group">
                <label htmlFor="service-category">
                  Category
                </label>

                <select
                  id="service-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map((item, index) => {
                    const value =
                      typeof item === "string"
                        ? item
                        : item.name ||
                          item.category ||
                          item.title ||
                          "";

                    if (!value) return null;

                    return (
                      <option
                        key={item.id || index}
                        value={value}
                      >
                        {value}
                      </option>
                    );
                  })}
                </select>
              </div>
            </section>

            {/* Pricing */}
            <section className="edit-card">
              <div className="edit-card-header">
                <div>
                  <h2>Pricing</h2>
                  <p>
                    Choose how customers should see your
                    service price.
                  </p>
                </div>

                <span className="edit-section-number">
                  02
                </span>
              </div>

              <div className="pricing-options">

                <button
                  type="button"
                  className={`pricing-option ${
                    pricingType === "fixed"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setPricingType("fixed")}
                >
                  <div className="pricing-option-icon">
                    ₹
                  </div>

                  <div className="pricing-option-content">
                    <strong>Fixed Price</strong>
                    <span>
                      One fixed price for the service
                    </span>
                  </div>

                  <div className="pricing-radio">
                    {pricingType === "fixed" && "✓"}
                  </div>
                </button>

                <button
                  type="button"
                  className={`pricing-option ${
                    pricingType === "starting_from"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setPricingType("starting_from")
                  }
                >
                  <div className="pricing-option-icon">
                    ↗
                  </div>

                  <div className="pricing-option-content">
                    <strong>Starting From</strong>
                    <span>
                      Show a minimum starting price
                    </span>
                  </div>

                  <div className="pricing-radio">
                    {pricingType === "starting_from" &&
                      "✓"}
                  </div>
                </button>

                <button
                  type="button"
                  className={`pricing-option ${
                    pricingType === "quote"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setPricingType("quote");
                    setPrice("");
                  }}
                >
                  <div className="pricing-option-icon">
                    ?
                  </div>

                  <div className="pricing-option-content">
                    <strong>Request a Quote</strong>
                    <span>
                      Customer contacts you for pricing
                    </span>
                  </div>

                  <div className="pricing-radio">
                    {pricingType === "quote" && "✓"}
                  </div>
                </button>

              </div>

              {pricingType !== "quote" && (
                <div className="edit-price-wrapper">
                  <label htmlFor="service-price">
                    {pricingType === "starting_from"
                      ? "Starting Price"
                      : "Service Price"}
                    <span>*</span>
                  </label>

                  <div className="edit-price-input">
                    <span>₹</span>

                    <input
                      id="service-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <p className="edit-price-help">
                    {getPricingText()}
                  </p>
                </div>
              )}
            </section>

            {/* Image */}
            <section className="edit-card">
              <div className="edit-card-header">
                <div>
                  <h2>Service Image</h2>
                  <p>
                    Add a professional image to make your
                    service stand out.
                  </p>
                </div>

                <span className="edit-section-number">
                  03
                </span>
              </div>

              <div className="edit-image-area">

                {(imagePreview || existingImage) ? (
                  <div className="edit-image-preview">

                    <img
                      src={
                        imagePreview ||
                        existingImage
                      }
                      alt={title || "Service"}
                    />

                    <div className="edit-image-overlay">
                      <button
                        type="button"
                        className="edit-image-change"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        Change Image
                      </button>

                      {imagePreview && (
                        <button
                          type="button"
                          className="edit-image-remove"
                          onClick={handleRemoveNewImage}
                        >
                          Use Existing Image
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="edit-upload-box"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    <div className="edit-upload-icon">
                      ↑
                    </div>

                    <strong>
                      Upload service image
                    </strong>

                    <span>
                      JPG, PNG or WEBP · Maximum 5 MB
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  hidden
                />

              </div>

              <div className="edit-image-help">
                <span>💡</span>
                <p>
                  Use a clear, high-quality image related
                  to your service. If you don't select a new
                  image, your current image will be kept.
                </p>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <aside className="edit-service-sidebar">

            {/* Preview */}
            <div className="edit-card preview-card">

              <div className="edit-card-header">
                <div>
                  <h2>Preview</h2>
                  <p>
                    How your service looks to you.
                  </p>
                </div>
              </div>

              <div className="service-live-preview">

                <div className="service-preview-image">
                  {imagePreview || existingImage ? (
                    <img
                      src={
                        imagePreview ||
                        existingImage
                      }
                      alt={title || "Service preview"}
                    />
                  ) : (
                    <div className="service-preview-placeholder">
                      <span>✦</span>
                    </div>
                  )}
                </div>

                <div className="service-preview-content">

                  <span className="service-preview-category">
                    {category || "Service Category"}
                  </span>

                  <h3>
                    {title || "Your Service Title"}
                  </h3>

                  <p>
                    {description ||
                      "Your service description will appear here."}
                  </p>

                  <div className="service-preview-bottom">

                    <strong>
                      {pricingType === "quote"
                        ? "Get Quote"
                        : `₹${
                            price
                              ? Number(price).toLocaleString(
                                  "en-IN"
                                )
                              : "0"
                          }`}
                    </strong>

                    <span>
                      {pricingType ===
                      "starting_from"
                        ? "starting"
                        : pricingType === "quote"
                        ? "Contact"
                        : "fixed"}
                    </span>

                  </div>

                </div>
              </div>

            </div>

            {/* Tips */}
            <div className="edit-tips-card">

              <div className="edit-tips-icon">
                ✦
              </div>

              <div>
                <strong>
                  Make your service stand out
                </strong>

                <ul>
                  <li>Use a clear service title</li>
                  <li>Add a useful description</li>
                  <li>Upload a quality image</li>
                  <li>Keep pricing accurate</li>
                </ul>
              </div>

            </div>

            {/* Actions */}
            <div className="edit-actions">

              <button
                type="submit"
                className="edit-btn edit-btn-primary"
                disabled={saving || deleting}
              >
                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="edit-btn edit-btn-secondary"
                onClick={() =>
                  navigate("/my-service-store")
                }
                disabled={saving || deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="edit-delete-button"
                onClick={handleDelete}
                disabled={saving || deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Service"}
              </button>

            </div>

          </aside>

        </form>
      </div>
    </div>
  );
};

export default EditService;