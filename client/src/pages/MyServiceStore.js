
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";
import "./MyServiceStore.css";

const MyServiceStore = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingServiceId, setSubmittingServiceId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${secondaryApiUrl}/api/services/my-services`,
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
            "Failed to load services"
        );
      }

      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load my services error:", err);
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Submit a draft or rejected service for admin review
  const handleSubmitForReview = async (service) => {
    if (submittingServiceId) return;

    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    const confirmed = window.confirm(
      `Submit "${service.title}" for admin review?`
    );

    if (!confirmed) return;

    try {
      setSubmittingServiceId(service.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${secondaryApiUrl}/api/services/${service.id}/submit-for-review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to submit service for review"
        );
      }

      setSuccessMessage(
        data.message || "Service submitted successfully for review."
      );

      await loadServices();
    } catch (err) {
      console.error("Submit service for review error:", err);
      setError(
        err.message || "Unable to submit service for review"
      );
    } finally {
      setSubmittingServiceId(null);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_review":
        return "Pending Review";

      case "published":
        return "Published";

      case "rejected":
        return "Rejected";

      case "inactive":
        return "Inactive";

      case "draft":
        return "Draft";

      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "published":
        return "published";

      case "pending_review":
        return "pending";

      case "rejected":
        return "rejected";

      case "inactive":
        return "inactive";

      case "draft":
        return "draft";

      default:
        return "draft";
    }
  };

  const getPriceText = (service) => {
    if (service.pricing_type === "quote") {
      return "Contact for price";
    }

    if (
      service.price === null ||
      service.price === undefined
    ) {
      return "Price not set";
    }

    const price = Number(service.price);

    const formattedPrice = `₹${price.toLocaleString(
      "en-IN"
    )}`;

    if (service.pricing_type === "starting_from") {
      return `From ${formattedPrice}`;
    }

    return formattedPrice;
  };

  const handleAddService = () => {
    navigate("/add-service");
  };

  const handleEditService = (service) => {
    navigate(`/edit-service/${service.id}`, {
      state: {
        service,
      },
    });
  };

  if (loading) {
    return (
      <div className="my-service-store-page">
        <div className="service-loading-card">
          <div className="service-loading-spinner"></div>

          <h3>Loading your services</h3>

          <p>
            Please wait while we load your service store.
          </p>
        </div>
      </div>
    );
  }

  const publishedCount = services.filter(
    (service) => service.status === "published"
  ).length;

  const pendingCount = services.filter(
    (service) => service.status === "pending_review"
  ).length;

  const draftCount = services.filter(
    (service) => service.status === "draft"
  ).length;

  return (
    <div className="my-service-store-page">

      {/* HEADER */}

      <div className="my-service-store-header">

        <div className="my-service-store-heading">

          <button
            type="button"
            className="service-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div>
            <span className="service-page-eyebrow">
              JUSPING BUSINESS
            </span>

            <h1>My Service Store</h1>

            <p>
              Manage your services and keep your
              digital store up to date.
            </p>
          </div>

        </div>

        <button
          className="add-service-main-btn"
          onClick={handleAddService}
        >
          <span>+</span>
          Add Service
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="service-error modern-service-error">
          <span>!</span>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button onClick={loadServices}>
            Retry
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <div className="service-success-message">
          <span>✓</span>
          {successMessage}
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {!error && (
        <>

          {/* SUMMARY */}

          <div className="service-summary-grid">

            <div className="service-summary-card">
              <div className="summary-icon">
                ✦
              </div>

              <div>
                <span>Total Services</span>
                <strong>{services.length}</strong>
              </div>
            </div>

            <div className="service-summary-card">
              <div className="summary-icon published-icon">
                ✓
              </div>

              <div>
                <span>Published</span>
                <strong>{publishedCount}</strong>
              </div>
            </div>

            <div className="service-summary-card">
              <div className="summary-icon pending-icon">
                ◷
              </div>

              <div>
                <span>Pending Review</span>
                <strong>{pendingCount}</strong>
              </div>
            </div>

            <div className="service-summary-card">
              <div className="summary-icon draft-icon">
                ◌
              </div>

              <div>
                <span>Drafts</span>
                <strong>{draftCount}</strong>
              </div>
            </div>

          </div>

          {/* EMPTY STATE */}

          {services.length === 0 && (
            <div className="empty-services-card">

              <div className="empty-service-icon">
                ✦
              </div>

              <h2>Start building your service store</h2>

              <p>
                Add your first service and let customers
                discover what your business offers on JusPing.
              </p>

              <button
                onClick={handleAddService}
                className="empty-add-service-btn"
              >
                + Add Your First Service
              </button>

            </div>
          )}

          {/* SERVICES */}

          {services.length > 0 && (
            <section className="services-section">

              <div className="services-section-header">

                <div>
                  <h2>Your Services</h2>

                  <p>
                    {services.length} service
                    {services.length !== 1 ? "s" : ""} in
                    your store
                  </p>
                </div>

                <button
                  className="section-add-btn"
                  onClick={handleAddService}
                >
                  + Add Service
                </button>

              </div>

              <div className="service-list">

                {services.map((service) => (

                  <article
                    key={service.id}
                    className="service-card"
                  >

                    {/* IMAGE */}

                    <div className="service-card-image">

                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.title}
                        />
                      ) : (
                        <div className="service-no-image">
                          <span>✦</span>
                          <small>JusPing Service</small>
                        </div>
                      )}

                      <span
                        className={`service-status-badge ${getStatusClass(
                          service.status
                        )}`}
                      >
                        <i></i>
                        {getStatusLabel(service.status)}
                      </span>

                    </div>

                    {/* CONTENT */}

                    <div className="service-card-content">

                      <div className="service-card-top">

                        {service.category && (
                          <span className="service-category">
                            {service.category}
                          </span>
                        )}

                        <h3>{service.title}</h3>

                        <p className="service-description">
                          {service.description ||
                            "Professional service available through JusPing."}
                        </p>

                      </div>

                      <div className="service-card-bottom">

                        <div className="service-price">

                          <span>
                            {service.pricing_type === "starting_from"
                              ? "Starting from"
                              : service.pricing_type === "quote"
                              ? "Pricing"
                              : "Service price"}
                          </span>

                          <strong>
                            {getPriceText(service)}
                          </strong>

                        </div>

                        <div className="service-card-actions">

                          {/* SUBMIT FOR REVIEW */}

                          {(service.status === "draft" ||
                            service.status === "rejected") && (
                            <button
                              type="button"
                              className="service-manage-btn"
                              disabled={
                                submittingServiceId === service.id
                              }
                              onClick={() =>
                                handleSubmitForReview(service)
                              }
                            >
                              {submittingServiceId === service.id
                                ? "Submitting..."
                                : "Submit for Review"}
                            </button>
                          )}

                          {/* MANAGE */}

                          <button
                            type="button"
                            className="service-manage-btn"
                            onClick={() =>
                              handleEditService(service)
                            }
                          >
                            Manage
                            <span>→</span>
                          </button>

                        </div>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            </section>
          )}

        </>
      )}

    </div>
  );
};

export default MyServiceStore;
