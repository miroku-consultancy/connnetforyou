
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Services.css";

const API_BASE_URL = "https://connnet4you-server.onrender.com";

const AddService = () => {
  const navigate = useNavigate();
  const { shopSlug } = useParams();

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/categories`
        );

        if (!response.ok) return;

        const data = await response.json();

        // Adjust this if your category API returns
        // a different response structure.
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Please log in to add a service.");
      return;
    }

    if (
      form.pricing_type !== "quote" &&
      (form.price === "" || Number(form.price) < 0)
    ) {
      setError("Please enter a valid service price.");
      return;
    }

    const formData = new FormData();

    formData.append("title", form.title.trim());
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("pricing_type", form.pricing_type);

    if (form.pricing_type !== "quote") {
      formData.append("price", form.price);
    }

    if (image) {
      formData.append("image", image);
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
          data.message || "Failed to create service."
        );
      }

      alert(
        "Service created successfully! It is currently saved as a draft."
      );

      navigate(
        shopSlug
          ? `/${shopSlug}/services`
          : "/services"
      );
    } catch (err) {
      console.error("Create service error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-form-page">
      <div className="service-form-card">
        <div className="service-form-heading">
          <h2>Add a Service</h2>
          <p>
            Showcase your service on JusPing and reach
            more customers.
          </p>
        </div>

        {error && (
          <div className="service-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="service-form-group">
            <label>Service Name *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. AC Repair, Home Cleaning"
              maxLength={200}
              required
            />
          </div>

          <div className="service-form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your service..."
              rows={5}
            />
          </div>

          <div className="service-form-group">
            <label>Category</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.name}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <small>
              Categories depend on the response from
              your existing categories API.
            </small>
          </div>

          <div className="service-form-group">
            <label>Pricing Type *</label>

            <select
              name="pricing_type"
              value={form.pricing_type}
              onChange={handleChange}
            >
              <option value="fixed">Fixed Price</option>
              <option value="starting_from">
                Starting From
              </option>
              <option value="quote">
                Contact for Quote
              </option>
            </select>
          </div>

          {form.pricing_type !== "quote" && (
            <div className="service-form-group">
              <label>Price (₹) *</label>

              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
              />
            </div>
          )}

          <div className="service-form-group">
            <label>Service Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {preview && (
              <div className="service-image-preview">
                <img
                  src={preview}
                  alt="Service preview"
                />
              </div>
            )}
          </div>

          <div className="service-form-actions">
            <button
              type="button"
              className="service-btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="service-btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddService;