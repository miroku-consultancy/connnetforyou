import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";

const MyBusiness = () => {
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      return "Service Store";
    }

    return "Product Store";
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
        return "Rejected";

      default:
        return status || "Unknown";
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
  if (!shop) return;

  try {
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

    // Refresh store status
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
  }
};

  if (loading) {
    return (
      <div className="my-business-page">
        <div className="my-business-card">
          <p>Loading your business...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-business-page">

      <div className="my-business-header">
        <div>
          <h1>My Business</h1>
          <p>
            Manage your JusPing business
          </p>
        </div>
      </div>

      {error && (
        <div className="service-error">
          {error}
        </div>
      )}

      {!error && !shop && (
        <div className="my-business-card">
          <h2>No Business Found</h2>

          <p>
            You don't have a business linked
            to your account yet.
          </p>

          <button
            onClick={() =>
              navigate("/create-store")
            }
          >
            Create Your Store
          </button>
        </div>
      )}

      {shop && (
        <div className="my-business-card">

          {/* Store Header */}
          <div className="my-business-card-header">

            {shop.image_url && (
              <img
                src={shop.image_url}
                alt={shop.name}
                className="my-business-image"
              />
            )}

            <div>
              <h2>{shop.name}</h2>

              <p>
                {getStoreTypeLabel(
                  shop.store_type
                )}
              </p>
            </div>

          </div>

          {/* Store Details */}
          <div className="my-business-details">

            <div className="my-business-detail">
              <span>Store Name</span>

              <strong>
                {shop.name}
              </strong>
            </div>

            <div className="my-business-detail">
              <span>Store Type</span>

              <strong>
                {getStoreTypeLabel(
                  shop.store_type
                )}
              </strong>
            </div>

            <div className="my-business-detail">
              <span>Store Slug</span>

              <strong>
                {shop.slug}
              </strong>
            </div>

            <div className="my-business-detail">
              <span>Status</span>

              <strong
                className={`business-status ${
                  shop.tenant_status || ""
                }`}
              >
                {getStatusLabel(
                  shop.tenant_status
                )}
              </strong>
            </div>

          </div>


          {/* =========================
              DRAFT
             ========================= */}
          {shop.tenant_status === "draft" && (
            <div className="business-review-message">

              <h3>
                Complete your store
              </h3>

              <p>
                Your store is currently saved
                as a draft. Add all your products
                or services before submitting your
                store for admin approval.
              </p>

              <div className="my-business-actions">

                <button
                  onClick={handleCompleteStore}
                >
                  {shop.store_type === "service"
                    ? "Add Services"
                    : "Add Products"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                >
                  Submit Store for Approval
                </button>

              </div>

            </div>
          )}


          {/* =========================
              PENDING
             ========================= */}
          {shop.tenant_status === "pending" && (
            <div className="business-review-message">

              <h3>
                Your store is under review
              </h3>

              <p>
                Your store has been submitted
                for admin approval. Once approved,
                your JusPing store will become
                active.
              </p>

            </div>
          )}


          {/* =========================
              REJECTED
             ========================= */}
          {shop.tenant_status === "rejected" && (
            <div className="business-review-message">

              <h3>
                Store needs changes
              </h3>

              <p>
                Please update your store
                information and submit it again
                for admin approval.
              </p>

              <div className="my-business-actions">

                <button
                  onClick={handleCompleteStore}
                >
                  Update Store
                </button>

              </div>

            </div>
          )}


          {/* =========================
              ACTIVE
             ========================= */}
          {shop.tenant_status === "active" && (
            <div className="my-business-actions">

              <button
                onClick={handleManageStore}
              >
                {shop.store_type === "service"
                  ? "Manage Services"
                  : "Manage Products"}
              </button>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default MyBusiness;