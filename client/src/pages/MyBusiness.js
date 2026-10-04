import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";
import "./MyBusiness.css";

const MyBusiness = () => {
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadMyBusiness = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${secondaryApiUrl}/api/shops/vendor`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to load your business"
        );
      }

      console.log("[MyBusiness] Vendor shop:", data);

      const currentShop = Array.isArray(data)
        ? data[0]
        : data;

      setShop(currentShop || null);
    } catch (err) {
      console.error(
        "Load my business error:",
        err
      );

      setError(
        err.message ||
          "Failed to load your business"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBusiness();
  }, []);

  const getStoreTypeLabel = (storeType) => {
    if (storeType === "service") {
      return "Service Business";
    }

    return "Product Business";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "draft":
        return "Draft";

      case "pending":
        return "Under Review";

      case "active":
        return "Active";

      case "rejected":
        return "Needs Changes";

      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "draft":
        return "status-draft";

      case "pending":
        return "status-pending";

      case "active":
        return "status-active";

      case "rejected":
        return "status-rejected";

      default:
        return "status-unknown";
    }
  };

  const handleManageStore = () => {
    if (!shop) return;

    if (shop.store_type === "service") {
      navigate("/my-service-store");
      return;
    }

    navigate("/products");
  };

  const handleCompleteStore = () => {
    if (!shop) return;

    if (shop.store_type === "service") {
      navigate("/my-service-store");
      return;
    }

    navigate("/products");
  };

  const handleSubmitForApproval = async () => {
    if (!shop || submitting) return;

    try {
      setSubmitting(true);

      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${secondaryApiUrl}/api/shops/submit-for-approval`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to submit store for approval"
        );
      }

      alert(
        "Your store has been submitted successfully for admin approval."
      );

      await loadMyBusiness();
    } catch (err) {
      console.error(
        "Submit store for approval error:",
        err
      );

      alert(
        err.message ||
          "Unable to submit store for approval."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="my-business-page">
        <div className="business-loading-card">
          <div className="business-spinner"></div>
          <p>Loading your business...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-business-page">

      {/* =========================
          PAGE HEADER
         ========================= */}
      <div className="my-business-page-header">

        <div>
          <span className="business-eyebrow">
            JUSPING BUSINESS
          </span>

          <h1>My Business</h1>

          <p>
            Manage your business, services,
            products and customer presence.
          </p>
        </div>

      </div>


      {/* =========================
          ERROR
         ========================= */}
      {error && (
        <div className="business-error">
          <span className="business-error-icon">
            !
          </span>

          <div>
            <strong>
              Something went wrong
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}


      {/* =========================
          NO BUSINESS
         ========================= */}
      {!error && !shop && (
        <div className="empty-business-card">

          <div className="empty-business-icon">
            🏪
          </div>

          <h2>
            Create your business
          </h2>

          <p>
            Create your JusPing business profile
            and start showcasing your services or
            products to customers.
          </p>

          <button
            className="business-primary-btn"
            onClick={() =>
              navigate("/create-store")
            }
          >
            Create Your Business
          </button>

        </div>
      )}


      {/* =========================
          BUSINESS
         ========================= */}
      {shop && (
        <div className="business-dashboard">

          {/* =========================
              BUSINESS HERO
             ========================= */}
          <section className="business-hero-card">

            <div className="business-hero-main">

              <div className="business-logo-wrapper">

                {shop.image_url ? (
                  <img
                    src={shop.image_url}
                    alt={shop.name}
                    className="business-logo"
                  />
                ) : (
                  <div className="business-logo-placeholder">
                    {shop.name
                      ?.charAt(0)
                      ?.toUpperCase() || "J"}
                  </div>
                )}

              </div>

              <div className="business-hero-content">

                <div className="business-title-row">

                  <h2>
                    {shop.name}
                  </h2>

                  <span
                    className={`business-status ${getStatusClass(
                      shop.tenant_status
                    )}`}
                  >
                    <span className="status-dot"></span>

                    {getStatusLabel(
                      shop.tenant_status
                    )}
                  </span>

                </div>

                <p className="business-type">
                  {shop.store_type === "service"
                    ? "🛠️"
                    : "🛍️"}{" "}
                  {getStoreTypeLabel(
                    shop.store_type
                  )}
                </p>

                {shop.slug && (
                  <div className="business-url">
                    <span>
                      jusping.com/
                    </span>

                    <strong>
                      {shop.slug}
                    </strong>
                  </div>
                )}

              </div>

            </div>

            <div className="business-hero-action">

              {shop.tenant_status === "active" && (
                <button
                  className="business-primary-btn"
                  onClick={handleManageStore}
                >
                  {shop.store_type === "service"
                    ? "Manage Services"
                    : "Manage Products"}

                  <span>→</span>
                </button>
              )}

            </div>

          </section>


          {/* =========================
              BUSINESS INFO
             ========================= */}
          <section className="business-info-grid">

            <div className="business-info-card">

              <span className="info-label">
                BUSINESS NAME
              </span>

              <strong>
                {shop.name || "—"}
              </strong>

            </div>

            <div className="business-info-card">

              <span className="info-label">
                BUSINESS TYPE
              </span>

              <strong>
                {getStoreTypeLabel(
                  shop.store_type
                )}
              </strong>

            </div>

            <div className="business-info-card">

              <span className="info-label">
                STORE URL
              </span>

              <strong className="store-url-text">
                /{shop.slug || "—"}
              </strong>

            </div>

            <div className="business-info-card">

              <span className="info-label">
                STATUS
              </span>

              <strong>
                {getStatusLabel(
                  shop.tenant_status
                )}
              </strong>

            </div>

          </section>


          {/* =========================
              DRAFT
             ========================= */}
          {shop.tenant_status === "draft" && (
            <section className="business-action-card draft-card">

              <div className="action-card-icon">
                🚀
              </div>

              <div className="action-card-content">

                <div className="action-card-heading">

                  <div>
                    <span className="action-label">
                      NEXT STEP
                    </span>

                    <h3>
                      Complete your business
                    </h3>
                  </div>

                  <span className="action-status">
                    Draft
                  </span>

                </div>

                <p>
                  Add your{" "}
                  {shop.store_type === "service"
                    ? "services"
                    : "products"}{" "}
                  and complete your business
                  information before submitting
                  it for admin approval.
                </p>

                <div className="business-actions">

                  <button
                    className="business-primary-btn"
                    onClick={handleCompleteStore}
                  >
                    {shop.store_type === "service"
                      ? "Add Services"
                      : "Add Products"}

                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="business-secondary-btn"
                    onClick={
                      handleSubmitForApproval
                    }
                    disabled={submitting}
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit for Approval"}
                  </button>

                </div>

              </div>

            </section>
          )}


          {/* =========================
              PENDING
             ========================= */}
          {shop.tenant_status === "pending" && (
            <section className="business-action-card pending-card">

              <div className="action-card-icon">
                ⏳
              </div>

              <div className="action-card-content">

                <span className="action-label">
                  UNDER REVIEW
                </span>

                <h3>
                  Your business is being reviewed
                </h3>

                <p>
                  Your business has been submitted
                  for admin approval. Once approved,
                  your JusPing business page will
                  become active.
                </p>

              </div>

            </section>
          )}


          {/* =========================
              REJECTED
             ========================= */}
          {shop.tenant_status === "rejected" && (
            <section className="business-action-card rejected-card">

              <div className="action-card-icon">
                ⚠️
              </div>

              <div className="action-card-content">

                <span className="action-label">
                  ACTION REQUIRED
                </span>

                <h3>
                  Your business needs some changes
                </h3>

                <p>
                  Please update your business
                  information and submit it again
                  for admin approval.
                </p>

                <div className="business-actions">

                  <button
                    className="business-primary-btn"
                    onClick={handleCompleteStore}
                  >
                    Update Business

                    <span>→</span>
                  </button>

                </div>

              </div>

            </section>
          )}


          {/* =========================
              ACTIVE
             ========================= */}
          {shop.tenant_status === "active" && (
            <section className="business-active-card">

              <div>

                <span className="active-label">
                  YOUR BUSINESS IS LIVE
                </span>

                <h3>
                  Start connecting with customers
                </h3>

                <p>
                  Your JusPing business is active.
                  Manage your{" "}
                  {shop.store_type === "service"
                    ? "services"
                    : "products"}{" "}
                  and keep your business profile
                  up to date.
                </p>

              </div>

              <button
                className="business-primary-btn"
                onClick={handleManageStore}
              >
                {shop.store_type === "service"
                  ? "Manage Services"
                  : "Manage Products"}

                <span>→</span>
              </button>

            </section>
          )}

        </div>
      )}

    </div>
  );
};

export default MyBusiness;