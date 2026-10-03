import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateStore.css";
import { secondaryApiUrl } from "../config/apiConfig";

const CreateStore = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate(
        `/login?redirect=${encodeURIComponent("/create-store")}`,
        { replace: true }
      );
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    name: "",
    storeType: "product",
    address: "",
    phone: "",
    openTime: "",
    closeTime: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleStoreTypeChange = (storeType) => {
    setFormData((prev) => ({
      ...prev,
      storeType,
    }));

    setErrors((prev) => ({
      ...prev,
      storeType: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate(
        `/login?redirect=${encodeURIComponent("/create-store")}`
      );
      return;
    }

    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Store name is required";
    }

    if (!formData.storeType) {
      newErrors.storeType = "Please select your store type";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch(
        `${secondaryApiUrl}/api/shops/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          submit: data.error || "Failed to create store",
        });
        return;
      }

      alert(
        "Store created successfully. Now add your products or services."
      );

      navigate("/my-business");
    } catch (error) {
      console.error("Create store error:", error);

      setErrors({
        submit: "Unable to create store. Please try again.",
      });
    }
  };

  return (
    <div className="jp-create-store-page">
      <div className="jp-create-store-card">
        <div className="jp-create-store-header">
          <button
            type="button"
            className="jp-back-button"
            onClick={() => navigate("/")}
          >
            ←
          </button>

          <div>
            <h1>Create Your Store</h1>
            <p>Start your business on JusPing</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Store Name */}
          <div className="jp-form-group">
            <label>
              Store Name <span>*</span>
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your store name"
              maxLength={100}
            />

            {errors.name && (
              <small className="jp-form-error">
                {errors.name}
              </small>
            )}
          </div>

          {/* Store Type */}
          <div className="jp-form-group">
            <label>
              What do you want to offer? <span>*</span>
            </label>

            <div className="jp-store-type-grid">
              <button
                type="button"
                className={`jp-store-type ${
                  formData.storeType === "product" ? "active" : ""
                }`}
                onClick={() => handleStoreTypeChange("product")}
              >
                <div className="jp-store-type-icon product">
                  🛒
                </div>

                <div>
                  <strong>Products</strong>
                  <small>
                    Sell products, manage stock and orders
                  </small>
                </div>
              </button>

              <button
                type="button"
                className={`jp-store-type ${
                  formData.storeType === "service" ? "active" : ""
                }`}
                onClick={() => handleStoreTypeChange("service")}
              >
                <div className="jp-store-type-icon service">
                  🔧
                </div>

                <div>
                  <strong>Services</strong>
                  <small>
                    Offer services and accept bookings
                  </small>
                </div>
              </button>
            </div>

            {errors.storeType && (
              <small className="jp-form-error">
                {errors.storeType}
              </small>
            )}
          </div>

          {/* Address */}
          <div className="jp-form-group">
            <label>Address</label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your store address"
              rows={3}
            />
          </div>

          {/* Phone */}
          <div className="jp-form-group">
            <label>Phone</label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter business phone number"
              maxLength={15}
            />
          </div>

          {/* Opening / Closing Time */}
          <div className="jp-time-grid">
            <div className="jp-form-group">
              <label>Opening Time</label>

              <input
                type="time"
                name="openTime"
                value={formData.openTime}
                onChange={handleChange}
              />
            </div>

            <div className="jp-form-group">
              <label>Closing Time</label>

              <input
                type="time"
                name="closeTime"
                value={formData.closeTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Draft Information */}
          <div className="jp-review-info">
            <div className="jp-review-icon">✓</div>

            <div>
              <strong>Complete your store</strong>

              <p>
                Your store will be saved as a draft. Add your
                products or services and submit the complete store
                for admin approval when you're ready.
              </p>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div
              className="jp-form-error"
              style={{ marginBottom: "15px" }}
            >
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="jp-create-store-actions">
            <button
              type="button"
              className="jp-cancel-button"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="jp-create-store-submit"
            >
              Create Store
              <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStore;