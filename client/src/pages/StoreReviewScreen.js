
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";
import "./StoreReviewScreen.css";

const StoreReviewScreen = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const token = localStorage.getItem("authToken");

  const loadStoreReview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${secondaryApiUrl}/api/shops/admin/${shopId}/review`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to load store review."
        );
      }

      setShop(data.shop || null);
      setProducts(
        Array.isArray(data.products) ? data.products : []
      );
      setServices(
        Array.isArray(data.services) ? data.services : []
      );
    } catch (err) {
      console.error("[StoreReviewScreen] Load error:", err);
      setError(err.message || "Failed to load store details.");
    } finally {
      setLoading(false);
    }
  }, [shopId, navigate, token]);

  useEffect(() => {
    loadStoreReview();
  }, [loadStoreReview]);

  const getStoreType = () => {
    return String(shop?.store_type || "").toLowerCase();
  };

  const isServiceStore = getStoreType() === "service";

  const getStatusLabel = (status) => {
    const value = String(status || "unknown").toLowerCase();

    const labels = {
      pending: "Pending Approval",
      approved: "Approved",
      active: "Active",
      rejected: "Rejected",
      draft: "Draft",
    };

    return labels[value] || value;
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Price not set";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return value;
    }

    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getProductImage = (product) => {
    return (
      product.image_url ||
      product.image ||
      product.imageUrl ||
      ""
    );
  };

  const getProductName = (product) => {
    return product.name || product.title || "Unnamed Product";
  };

  const getProductPrice = (product) => {
    return product.price ?? product.base_price ?? 0;
  };

  const getProductStock = (product) => {
    return product.stock ?? product.quantity ?? 0;
  };

  const getServicePrice = (service) => {
    if (service.pricing_type === "quote") {
      return "Contact for price";
    }

    const price = formatPrice(service.price);

    if (service.pricing_type === "starting_from") {
      return `From ${price}`;
    }

    return price;
  };

  const handleApprove = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to approve "${shop?.name || "this store"}"?`
    );

    if (!confirmed || actionLoading) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${secondaryApiUrl}/api/shops/admin/${shopId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Store approval failed."
        );
      }

      window.alert("Store approved successfully.");
      navigate("/master-admin");
    } catch (err) {
      console.error("[StoreReviewScreen] Approve error:", err);
      window.alert(err.message || "Unable to approve store.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      window.alert("Please enter a rejection reason.");
      return;
    }

    if (actionLoading) return;

    const confirmed = window.confirm(
      `Are you sure you want to reject "${shop?.name || "this store"}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${secondaryApiUrl}/api/shops/admin/${shopId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectionReason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Store rejection failed."
        );
      }

      window.alert("Store rejected.");
      navigate("/master-admin");
    } catch (err) {
      console.error("[StoreReviewScreen] Reject error:", err);
      window.alert(err.message || "Unable to reject store.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="store-review-page">
        <div className="store-review-loading">
          <div className="store-review-spinner" />
          <h3>Loading store details...</h3>
          <p>Please wait while we prepare the review.</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="store-review-page">
        <div className="store-review-error">
          <h2>Unable to open store review</h2>
          <p>{error || "Store details were not found."}</p>

          <div className="store-review-error-actions">
            <button
              type="button"
              className="sr-btn sr-btn-secondary"
              onClick={() => navigate("/master-admin")}
            >
              Back to Pending Stores
            </button>

            <button
              type="button"
              className="sr-btn sr-btn-primary"
              onClick={loadStoreReview}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const storeStatus = shop.tenant_status || shop.status || "pending";
  const isPending = String(storeStatus).toLowerCase() === "pending";

  return (
    <div className="store-review-page">
      <div className="store-review-container">

        {/* HEADER */}
        <div className="store-review-header">
          <div>
            <button
              type="button"
              className="store-review-back"
              onClick={() => navigate("/master-admin")}
            >
              ← Back to Pending Stores
            </button>

            <span className="store-review-eyebrow">
              JUSPING MASTER ADMIN
            </span>

            <h1>Store Review</h1>
            <p>Review the submitted business information and listing.</p>
          </div>

          <span
            className={`sr-status-badge sr-status-${String(
              storeStatus
            ).toLowerCase()}`}
          >
            {getStatusLabel(storeStatus)}
          </span>
        </div>

        {/* STORE INFORMATION */}
        <section className="sr-panel">
          <div className="sr-panel-heading">
            <div>
              <span className="sr-section-label">STORE INFORMATION</span>
              <h2>{shop.name || "Unnamed Store"}</h2>
            </div>

            <div className="sr-store-type">
              {isServiceStore ? "🛠️ Service Store" : "🛍️ Product Store"}
            </div>
          </div>

          <div className="sr-store-info-grid">
            <div className="sr-info-item">
              <span>Store ID</span>
              <strong>#{shop.id || shopId}</strong>
            </div>

            <div className="sr-info-item">
              <span>Store Type</span>
              <strong>
                {isServiceStore ? "Service Business" : "Product Business"}
              </strong>
            </div>

            <div className="sr-info-item">
              <span>Tenant URL</span>
              <strong>
                {shop.tenant_slug || shop.slug
                  ? `${shop.tenant_slug || shop.slug}.jusping.com`
                  : "Not available"}
              </strong>
            </div>

            <div className="sr-info-item">
              <span>Location</span>
              <strong>
                {shop.address ||
                  shop.location ||
                  shop.city ||
                  "Not provided"}
              </strong>
            </div>

            <div className="sr-info-item">
              <span>Contact</span>
              <strong>
                {shop.phone ||
                  shop.mobile ||
                  shop.contact_number ||
                  "Not provided"}
              </strong>
            </div>

            <div className="sr-info-item">
              <span>Email</span>
              <strong>{shop.email || "Not provided"}</strong>
            </div>

            <div className="sr-info-item">
              <span>Submitted</span>
              <strong>
                {shop.tenant_created_at || shop.created_at
                  ? new Date(
                      shop.tenant_created_at || shop.created_at
                    ).toLocaleDateString("en-IN")
                  : "Not available"}
              </strong>
            </div>

            <div className="sr-info-item">
              <span>Current Status</span>
              <strong>{getStatusLabel(storeStatus)}</strong>
            </div>
          </div>

          {shop.description && (
            <div className="sr-business-description">
              <span>Business Description</span>
              <p>{shop.description}</p>
            </div>
          )}
        </section>

        {/* PRODUCT LIST */}
        {!isServiceStore && (
          <section className="sr-panel">
            <div className="sr-list-heading">
              <div>
                <span className="sr-section-label">SUBMITTED LISTING</span>
                <h2>Products</h2>
                <p>Review the products submitted by this store.</p>
              </div>

              <span className="sr-count-badge">
                {products.length} Products
              </span>
            </div>

            {products.length === 0 ? (
              <div className="sr-empty-state">
                <span>📦</span>
                <h3>No products found</h3>
                <p>This store has not submitted any products.</p>
              </div>
            ) : (
              <div className="sr-product-grid">
                {products.map((product, index) => {
                  const productId =
                    product.id || product.product_id || index;

                  const image = getProductImage(product);

                  return (
                    <article className="sr-product-card" key={productId}>
                      <div className="sr-product-image">
                        {image ? (
                          <img
                            src={image}
                            alt={getProductName(product)}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>

                      <div className="sr-product-content">
                        <h3>{getProductName(product)}</h3>

                        {product.category_name && (
                          <span className="sr-category">
                            {product.category_name}
                          </span>
                        )}

                        <strong className="sr-price">
                          {formatPrice(getProductPrice(product))}
                        </strong>

                        <span className="sr-stock">
                          Stock: {getProductStock(product)}
                        </span>

                        {product.description && (
                          <p className="sr-item-description">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SERVICE LIST */}
        {isServiceStore && (
          <section className="sr-panel">
            <div className="sr-list-heading">
              <div>
                <span className="sr-section-label">SUBMITTED LISTING</span>
                <h2>Services</h2>
                <p>Review the services submitted by this business.</p>
              </div>

              <span className="sr-count-badge">
                {services.length} Services
              </span>
            </div>

            {services.length === 0 ? (
              <div className="sr-empty-state">
                <span>🛠️</span>
                <h3>No services found</h3>
                <p>This store has not submitted any services.</p>
              </div>
            ) : (
              <div className="sr-service-list">
                {services.map((service, index) => (
                  <article
                    className="sr-service-card"
                    key={service.id || index}
                  >
                    <div className="sr-service-image">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.title || "Service"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>🛠️</span>
                      )}
                    </div>

                    <div className="sr-service-content">
                      <div className="sr-service-title-row">
                        <h3>{service.title || "Unnamed Service"}</h3>

                        {service.category && (
                          <span className="sr-category">
                            {service.category}
                          </span>
                        )}
                      </div>

                      <p>
                        {service.description ||
                          "No service description provided."}
                      </p>

                      <strong className="sr-price">
                        {getServicePrice(service)}
                      </strong>

                      {service.status && (
                        <span className="sr-service-status">
                          Listing status: {service.status}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ADMIN ACTIONS */}
        <section className="sr-admin-actions">
          <div>
            <span className="sr-section-label">ADMIN DECISION</span>
            <h2>Review this application</h2>
            <p>
              Verify the store details and submitted listing before making
              your decision.
            </p>
          </div>

          {isPending ? (
            <div className="sr-action-buttons">
              <button
                type="button"
                className="sr-btn sr-btn-approve"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? "Please wait..." : "✓ Approve Store"}
              </button>

              <button
                type="button"
                className="sr-btn sr-btn-reject"
                onClick={() => setShowRejectForm((current) => !current)}
                disabled={actionLoading}
              >
                ✕ Reject Store
              </button>
            </div>
          ) : (
            <p className="sr-already-reviewed">
              This store is no longer pending approval.
            </p>
          )}

          {showRejectForm && isPending && (
            <div className="sr-reject-form">
              <label htmlFor="rejectionReason">
                Reason for rejection
              </label>

              <textarea
                id="rejectionReason"
                rows="4"
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(event.target.value)
                }
                placeholder="Explain what needs to be corrected by the store owner..."
              />

              <div className="sr-reject-form-actions">
                <button
                  type="button"
                  className="sr-btn sr-btn-secondary"
                  onClick={() => setShowRejectForm(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="sr-btn sr-btn-reject"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Please wait..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default StoreReviewScreen;
