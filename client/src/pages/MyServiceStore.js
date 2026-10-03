import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secondaryApiUrl } from "../config/apiConfig";

const MyServiceStore = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        throw new Error(data.error || data.message || "Failed to load services");
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

  if (loading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="my-service-store">

      <div className="my-service-store-header">
        <div>
          <h1>My Service Store</h1>
          <p>Manage your services</p>
        </div>

        <button
          onClick={() => navigate("/add-service")}
        >
          + Add Service
        </button>
      </div>

      {error && (
        <div className="service-error">
          {error}
        </div>
      )}

      {!error && services.length === 0 && (
        <div className="empty-services">
          <h3>No services yet</h3>
          <p>Add your first service to submit it for review.</p>

          <button
            onClick={() => navigate("/add-service")}
          >
            + Add Service
          </button>
        </div>
      )}

      {services.length > 0 && (
        <div className="service-list">

          {services.map((service) => (
            <div
              key={service.id}
              className="service-card"
            >

              {service.image_url && (
                <img
                  src={service.image_url}
                  alt={service.title}
                />
              )}

              <div className="service-card-content">

                <h3>{service.title}</h3>

                {service.category && (
                  <p>{service.category}</p>
                )}

                {service.price !== null && (
                  <strong>
                    ₹{service.price}
                  </strong>
                )}

                <div className="service-status">
                  {getStatusLabel(service.status)}
                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
};

export default MyServiceStore;