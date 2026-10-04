import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";
import "./AddService.css";

const AddService = () => {
  const navigate = useNavigate();

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricingType, setPricingType] = useState("fixed");
  const [price, setPrice] = useState("");

  const [categories, setCategories] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [limitReached, setLimitReached] = useState(false);

  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // ---------------------------------------------------------
  // Load categories
  // ---------------------------------------------------------
  // useEffect(() => {
  //   const loadCategories = async () => {
  //     try {
  //       setLoadingCategories(true);

  //       const token = getAuthToken();

  //       const response = await fetch(
  //         `${secondaryApiUrl}/api/categories`,
  //         {
  //           headers: token
  //             ? {
  //                 Authorization: `Bearer ${token}`,
  //               }
  //             : {},
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to load categories");
  //       }

  //       const data = await response.json();

  //       if (Array.isArray(data)) {
  //         setCategories(data);
  //       } else if (Array.isArray(data.categories)) {
  //         setCategories(data.categories);
  //       } else {
  //         setCategories([]);
  //       }
  //     } catch (err) {
  //       console.error("Load categories error:", err);
  //       setError("Unable to load service categories.");
  //     } finally {
  //       setLoadingCategories(false);
  //     }
  //   };

  //   loadCategories();
  // }, []);

  // ---------------------------------------------------------
  // Image selection
  // ---------------------------------------------------------
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

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
  };

  // ---------------------------------------------------------
  // Remove image
  // ---------------------------------------------------------
  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------
  // Cleanup preview
  // ---------------------------------------------------------
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------
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
      pricingType !== "quote" &&
      (!price || Number(price) <= 0)
    ) {
      setError("Please enter a valid price.");
      return false;
    }

    return true;
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLimitReached(false);

    if (!validateForm()) return;

    const token = getAuthToken();

    if (!token) {
      setError("Your session has expired. Please login again.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("pricing_type", pricingType);

      if (pricingType !== "quote") {
        formData.append("price", price);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(
        `${secondaryApiUrl}/api/services`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      // Free plan limit
      if (
        response.status === 403 &&
        data.code === "FREE_SERVICE_LIMIT_REACHED"
      ) {
        setLimitReached(true);
        setError("");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create service."
        );
      }

      setSuccess(
        "Service created successfully and submitted for review."
      );

      setTimeout(() => {
        navigate("/my-service-store");
      }, 1200);
    } catch (err) {
      console.error("Create service error:", err);

      setError(
        err.message ||
          "Something went wrong while creating the service."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Category helper
  // ---------------------------------------------------------
  const getCategoryValue = (item) => {
    if (typeof item === "string") {
      return item;
    }

    return (
      item?.name ||
      item?.category ||
      item?.title ||
      ""
    );
  };

  return (
    <div className="add-service-page">
      <div className="add-service-container">

        {/* HEADER */}
        <div className="add-service-header">
          <div className="add-service-header-left">

            <button
              type="button"
              className="add-back-button"
              onClick={() =>
                navigate("/my-service-store")
              }
              disabled={submitting}
              aria-label="Back"
            >
              ←
            </button>

            <div>
              <div className="add-service-eyebrow">
                MY SERVICE STORE
              </div>

              <h1>Add Service</h1>

              <p>
                Create a service that customers can discover
                and connect with you about.
              </p>
            </div>

          </div>
        </div>

        {/* FREE PLAN LIMIT */}
        {limitReached && (
          <div className="service-limit-card">
            <div className="service-limit-icon">
              ↑
            </div>

            <div className="service-limit-content">
              <span className="service-limit-label">
                FREE PLAN LIMIT REACHED
              </span>

              <h2>
                You've reached your 10-service limit
              </h2>

              <p>
                Your Free plan allows up to 10 services.
                Upgrade your plan to add more services
                and grow your business on JusPing.
              </p>

              <button
                type="button"
                className="service-limit-button"
                onClick={() =>
                  alert(
                    "Plan upgrade will be available soon."
                  )
                }
              >
                View Upgrade Plans →
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="add-alert add-alert-error">
            <span className="add-alert-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="add-alert add-alert-success">
            <span className="add-alert-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* MAIN FORM */}
        <form
          className="add-service-form"
          onSubmit={handleSubmit}
        >

          {/* LEFT */}
          <div className="add-service-main">

            {/* BASIC INFORMATION */}
            <section className="add-card">

              <div className="add-card-header">
                <div>
                  <h2>Basic Information</h2>
                  <p>
                    Tell customers what service you provide.
                  </p>
                </div>

                <span className="add-section-number">
                  01
                </span>
              </div>

              {/* TITLE */}
              <div className="add-form-group">

                <label htmlFor="service-title">
                  Service Title <span>*</span>
                </label>

                <input
                  id="service-title"
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Home AC Repair"
                  maxLength={120}
                  required
                />

                <div className="add-input-meta">
                  <span>
                    Use a clear name customers can
                    understand.
                  </span>

                  <span>
                    {title.length}/120
                  </span>
                </div>

              </div>

              {/* DESCRIPTION */}
              <div className="add-form-group">

                <div className="add-label-row">
                  <label htmlFor="service-description">
                    Description
                  </label>

                  <span>
                    {description.length}/1000
                  </span>
                </div>

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

                <div className="add-input-meta">
                  <span>
                    Explain what customers can expect.
                  </span>
                </div>

              </div>

              {/* CATEGORY */}
              <div className="add-form-group">

                <label htmlFor="service-category">
                  Category
                </label>

                <select
                  id="service-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select a category"}
                  </option>

                  {categories.map((item, index) => {
                    const value =
                      getCategoryValue(item);

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

            {/* PRICING */}
            <section className="add-card">

              <div className="add-card-header">
                <div>
                  <h2>Pricing</h2>

                  <p>
                    Choose how customers should see
                    your service price.
                  </p>
                </div>

                <span className="add-section-number">
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
                  onClick={() =>
                    setPricingType("fixed")
                  }
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
                <div className="add-price-wrapper">

                  <label htmlFor="service-price">
                    {pricingType === "starting_from"
                      ? "Starting Price"
                      : "Service Price"}

                    <span>*</span>
                  </label>

                  <div className="add-price-input">
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
                      required
                    />
                  </div>

                </div>
              )}

            </section>

          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="add-service-sidebar">

            {/* IMAGE */}
            <section className="add-card image-card">

              <div className="add-card-header">
                <div>
                  <h2>Service Image</h2>

                  <p>
                    Add an image that represents your
                    service.
                  </p>
                </div>

                <span className="add-section-number">
                  03
                </span>
              </div>

              {/* CAMERA */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                hidden
              />

              {/* GALLERY */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                hidden
              />

              {!imagePreview ? (
                <div className="image-upload-area">

                  <div className="image-upload-icon">
                    ↑
                  </div>

                  <strong>
                    Add your service image
                  </strong>

                  <span className="image-upload-description">
                    Take a photo or choose one from
                    your gallery.
                  </span>

                  <div className="image-source-buttons">

                    <button
                      type="button"
                      className="image-source-button"
                      onClick={() =>
                        cameraInputRef.current?.click()
                      }
                    >
                      <span className="image-source-icon">
                        📷
                      </span>
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      className="image-source-button"
                      onClick={() =>
                        galleryInputRef.current?.click()
                      }
                    >
                      <span className="image-source-icon">
                        🖼️
                      </span>
                      <span>Gallery</span>
                    </button>

                  </div>

                  <small>
                    JPG, PNG or WEBP · Maximum 5 MB
                  </small>

                </div>
              ) : (
                <div className="selected-image-area">

                  <img
                    src={imagePreview}
                    alt="Service preview"
                  />

                  <div className="selected-image-actions">

                    <button
                      type="button"
                      onClick={() =>
                        cameraInputRef.current?.click()
                      }
                    >
                      📷 Replace
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        galleryInputRef.current?.click()
                      }
                    >
                      🖼 Gallery
                    </button>

                    <button
                      type="button"
                      className="remove-image-button"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>

                  </div>

                </div>
              )}

              <div className="image-upload-help">
                <span>💡</span>

                <p>
                  A clear photo helps customers understand
                  your service before contacting you.
                </p>
              </div>

            </section>

            {/* CUSTOMER PREVIEW */}
            <section className="add-card preview-card">

              <div className="add-card-header">
                <div>
                  <h2>Customer Preview</h2>

                  <p>
                    See how your service will appear.
                  </p>
                </div>
              </div>

              <div className="service-live-preview">

                <div className="service-preview-image">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Service preview"
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
                      {pricingType === "starting_from"
                        ? "starting"
                        : pricingType === "quote"
                        ? "Contact"
                        : "fixed"}
                    </span>

                  </div>

                </div>

              </div>

            </section>

            {/* TIPS */}
            <div className="add-tips-card">

              <div className="add-tips-icon">
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

            {/* ACTIONS */}
            <div className="add-actions">

              <button
                type="submit"
                className="add-btn add-btn-primary"
                disabled={submitting || limitReached}
              >
                {submitting ? (
                  <>
                    <span className="add-button-spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    Submit for Review
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="add-btn add-btn-secondary"
                onClick={() =>
                  navigate("/my-service-store")
                }
                disabled={submitting}
              >
                Cancel
              </button>

            </div>

          </aside>

        </form>
      </div>
    </div>
  );
};

export default AddService;