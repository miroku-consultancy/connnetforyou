import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddService.css";

const API_BASE_URL =
  "https://connnet4you-server.onrender.com";

const AddService = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    pricing_type: "fixed",
    price: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("authToken");

  // ---------------------------------------------------------
  // Load categories
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/categories`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setCategories(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Failed to load categories:",
          err
        );
      }
    };

    fetchCategories();
  }, []);

  // ---------------------------------------------------------
  // Cleanup preview URL
  // ---------------------------------------------------------
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // ---------------------------------------------------------
  // Handle text/select changes
  // ---------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ---------------------------------------------------------
  // Image selection
  // ---------------------------------------------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5 MB."
      );
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ---------------------------------------------------------
  // Remove selected image
  // ---------------------------------------------------------
  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "Please log in to add a service."
      );
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Please enter a service name."
      );
      return;
    }

    if (
      form.pricing_type !== "quote" &&
      (form.price === "" ||
        Number(form.price) < 0)
    ) {
      setError(
        "Please enter a valid service price."
      );
      return;
    }

    const formData = new FormData();

    formData.append(
      "title",
      form.title.trim()
    );

    formData.append(
      "description",
      form.description
    );

    formData.append(
      "category",
      form.category
    );

    formData.append(
      "pricing_type",
      form.pricing_type
    );

    if (form.pricing_type !== "quote") {
      formData.append(
        "price",
        form.price
      );
    }

    if (image) {
      formData.append(
        "image",
        image
      );
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/services`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create service."
        );
      }

      console.log(
        "Service created:",
        data
      );

      alert(
        "Service submitted successfully for review."
      );

      navigate("/my-service-store");

    } catch (err) {
      console.error(
        "Create service error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-service-page">

      {/* =====================================================
          PAGE HEADER
         ===================================================== */}

      <div className="add-service-page-header">

        <div>
          <span className="add-service-eyebrow">
            JUSPING BUSINESS
          </span>

          <h1>
            Add a Service
          </h1>

          <p>
            Create a professional service listing
            and help customers discover what you offer.
          </p>
        </div>

        <button
          type="button"
          className="add-service-back-btn"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          ← Back
        </button>

      </div>


      {/* =====================================================
          ERROR
         ===================================================== */}

      {error && (
        <div className="add-service-error">

          <div className="add-service-error-icon">
            !
          </div>

          <div>
            <strong>
              Please check the following
            </strong>

            <p>
              {error}
            </p>
          </div>

        </div>
      )}


      {/* =====================================================
          MAIN FORM
         ===================================================== */}

      <form
        className="add-service-layout"
        onSubmit={handleSubmit}
      >

        {/* ===================================================
            LEFT SIDE
           =================================================== */}

        <div className="add-service-main-column">

          {/* Basic information */}

          <section className="add-service-card">

            <div className="add-service-section-header">

              <div className="section-number">
                01
              </div>

              <div>
                <h2>
                  Service information
                </h2>

                <p>
                  Tell customers what service you provide.
                </p>
              </div>

            </div>


            {/* Service name */}

            <div className="add-service-field">

              <label htmlFor="title">
                Service Name
                <span>*</span>
              </label>

              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. AC Repair, Home Cleaning"
                maxLength={200}
                required
              />

              <div className="field-hint">
                Use a clear name customers will
                understand quickly.
              </div>

            </div>


            {/* Description */}

            <div className="add-service-field">

              <div className="field-label-row">

                <label htmlFor="description">
                  Description
                </label>

                <span className="character-count">
                  {form.description.length}/1000
                </span>

              </div>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what customers can expect from this service..."
                rows={7}
                maxLength={1000}
              />

              <div className="field-hint">
                Explain what is included, how it
                works and what makes your service useful.
              </div>

            </div>


            {/* Category */}

            <div className="add-service-field">

              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">
                  Select a category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}

              </select>

            </div>

          </section>


          {/* Pricing */}

          <section className="add-service-card">

            <div className="add-service-section-header">

              <div className="section-number">
                02
              </div>

              <div>
                <h2>
                  Pricing
                </h2>

                <p>
                  Tell customers how you charge.
                </p>
              </div>

            </div>


            <div className="pricing-options">

              <label
                className={`pricing-option ${
                  form.pricing_type === "fixed"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="pricing_type"
                  value="fixed"
                  checked={
                    form.pricing_type === "fixed"
                  }
                  onChange={handleChange}
                />

                <span className="pricing-radio"></span>

                <span className="pricing-content">
                  <strong>
                    Fixed Price
                  </strong>

                  <small>
                    Charge one fixed amount
                  </small>
                </span>

              </label>


              <label
                className={`pricing-option ${
                  form.pricing_type ===
                  "starting_from"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="pricing_type"
                  value="starting_from"
                  checked={
                    form.pricing_type ===
                    "starting_from"
                  }
                  onChange={handleChange}
                />

                <span className="pricing-radio"></span>

                <span className="pricing-content">
                  <strong>
                    Starting From
                  </strong>

                  <small>
                    Show a minimum starting price
                  </small>
                </span>

              </label>


              <label
                className={`pricing-option ${
                  form.pricing_type === "quote"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="pricing_type"
                  value="quote"
                  checked={
                    form.pricing_type === "quote"
                  }
                  onChange={handleChange}
                />

                <span className="pricing-radio"></span>

                <span className="pricing-content">
                  <strong>
                    Contact for Quote
                  </strong>

                  <small>
                    Let customers ask for pricing
                  </small>
                </span>

              </label>

            </div>


            {form.pricing_type !== "quote" && (
              <div className="price-input-wrapper">

                <label htmlFor="price">
                  Price
                  <span>*</span>
                </label>

                <div className="price-input">

                  <span>
                    ₹
                  </span>

                  <input
                    id="price"
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />

                </div>

              </div>
            )}

          </section>

        </div>


        {/* ===================================================
            RIGHT SIDE
           =================================================== */}

        <aside className="add-service-sidebar">

          {/* Image */}

          <section className="add-service-card image-card">

            <div className="add-service-section-header">

              <div className="section-number">
                03
              </div>

              <div>
                <h2>
                  Service image
                </h2>

                <p>
                  Add an image that represents your service.
                </p>
              </div>

            </div>


            {!preview ? (
              <label
                className="image-upload-area"
                htmlFor="service-image"
              >

                <div className="image-upload-icon">
                  ↑
                </div>

                <strong>
                  Upload service image
                </strong>

                <span>
                  Click to choose an image
                </span>

                <small>
                  JPG, PNG or WEBP · Maximum 5 MB
                </small>

                <input
                  id="service-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

              </label>
            ) : (
              <div className="service-preview-wrapper">

                <img
                  src={preview}
                  alt="Service preview"
                  className="service-preview-image"
                />

                <div className="service-preview-overlay">

                  <label
                    htmlFor="service-image-replace"
                    className="preview-action"
                  >
                    Change
                  </label>

                  <button
                    type="button"
                    className="preview-action remove"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </button>

                </div>

                <input
                  id="service-image-replace"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />

              </div>
            )}

            <div className="image-tip">
              <span>💡</span>

              <p>
                Use a clear image that helps
                customers understand your service.
              </p>
            </div>

          </section>


          {/* Preview card */}

          <section className="service-mini-preview">

            <span className="mini-preview-label">
              CUSTOMER PREVIEW
            </span>

            <div className="mini-preview-image">

              {preview ? (
                <img
                  src={preview}
                  alt=""
                />
              ) : (
                <div>
                  🛠️
                </div>
              )}

            </div>

            <div className="mini-preview-content">

              <h3>
                {form.title.trim() ||
                  "Your Service Name"}
              </h3>

              <p>
                {form.description.trim()
                  ? form.description
                  : "Your service description will appear here."}
              </p>

              <div className="mini-preview-bottom">

                <span>
                  {form.pricing_type === "quote"
                    ? "Contact for Quote"
                    : form.pricing_type ===
                      "starting_from"
                    ? `From ₹${
                        form.price || "0"
                      }`
                    : `₹${
                        form.price || "0"
                      }`}
                </span>

              </div>

            </div>

          </section>

        </aside>

      </form>


      {/* =====================================================
          ACTION BAR
         ===================================================== */}

      <div className="add-service-action-bar">

        <div>
          <strong>
            Ready to publish your service?
          </strong>

          <span>
            Your service will be submitted for admin review.
          </span>
        </div>

        <div className="add-service-action-buttons">

          <button
            type="button"
            className="add-service-cancel-btn"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="add-service-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Submitting...
              </>
            ) : (
              <>
                Submit for Review
                <span>→</span>
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
};

export default AddService;