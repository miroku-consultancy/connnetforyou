
import React, { useEffect, useState } from "react";
//import "./Services.css";
import "../components/DashboardSummary.css";
import { secondaryApiUrl } from "../config/apiConfig";

const API_BASE_URL = "https://connnet4you-server.onrender.com";

// Same static service images as DashboardSummary.js
const staticServices = [
  {
    name: "Home Cleaning",
    category: "Home Services",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80",
    icon: "🏠",
  },
  {
    name: "AC Repair & Service",
    category: "AC Repair",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80",
    icon: "❄️",
  },
  {
    name: "Plumber",
    category: "Plumbing",
    image:
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=500&q=80",
    icon: "🔧",
  },
  {
    name: "Electrician",
    category: "Electrical",
    image:
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=500&q=80",
    icon: "⚡",
  },
  {
    name: "Beauty & Wellness",
    category: "Beauty",
    image:
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=500&q=80",
    icon: "💗",
  },
  {
    name: "Car/Bike Service",
    category: "Vehicle Service",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80",
    icon: "🚘",
  },
];

const getStaticServiceAsset = (service) => {
  const title = (
    service?.title ||
    service?.name ||
    ""
  ).toLowerCase();

  const category = (
    service?.category || ""
  ).toLowerCase();

  if (
    title.includes("ac") ||
    title.includes("air condition") ||
    category.includes("ac")
  ) {
    return staticServices[1];
  }

  if (
    title.includes("plumb") ||
    category.includes("plumb")
  ) {
    return staticServices[2];
  }

  if (
    title.includes("electric") ||
    category.includes("electric")
  ) {
    return staticServices[3];
  }

  if (
    title.includes("clean") ||
    category.includes("clean")
  ) {
    return staticServices[0];
  }

  if (
    title.includes("beauty") ||
    title.includes("salon") ||
    title.includes("hair") ||
    category.includes("beauty")
  ) {
    return staticServices[4];
  }

  if (
    title.includes("car") ||
    title.includes("bike") ||
    title.includes("vehicle") ||
    category.includes("vehicle")
  ) {
    return staticServices[5];
  }

  return staticServices[0];
};

const getServiceImage = (service) => {
  // Dashboard uses static category images first.
  const staticAsset = getStaticServiceAsset(service);

  return staticAsset?.image || staticServices[0].image;
};

const getServiceIcon = (service) => {
  return getStaticServiceAsset(service)?.icon || "🔧";
};

const Services = () => {
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const domain =
          window.location.hostname.toLowerCase();

        // Resolve current tenant.
        const tenantResponse = await fetch(
          `${secondaryApiUrl}/api/tenants/resolve?domain=${encodeURIComponent(
            domain
          )}`
        );

        if (!tenantResponse.ok) {
          throw new Error("Unable to resolve shop.");
        }

        const tenant = await tenantResponse.json();
        const shopId = tenant.shopId;

        if (!shopId) {
          throw new Error("Shop ID not found.");
        }

        // Fetch services for the resolved tenant.
        const response = await fetch(
          `${API_BASE_URL}/api/services?shopId=${shopId}`
        );

        if (!response.ok) {
          throw new Error("Unable to load services.");
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.services)
          ? data.services
          : [];

        // Same published-services behavior as dashboard.
        const publishedServices = list.filter(
          (service) =>
            service.status === "published" ||
            service.isPublished === true ||
            service.is_published === true
        );

        if (!cancelled) {
          setServicesData(publishedServices);
        }
      } catch (err) {
        console.error("Services API error:", err);

        if (!cancelled) {
          setError(err.message || "Failed to load services.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  // Loading UI
  if (loading) {
    return (
      <main className="jp-services-page">
        <section className="jp-section">
          <div className="jp-section-heading">
            <h2>Popular Services</h2>
          </div>

          <div className="jp-card-grid">
            {[1, 2, 3].map((item) => (
              <article
                className="jp-service-card"
                key={item}
              >
                <div className="jp-service-image">
                  <img
                    src={staticServices[0].image}
                    alt="Loading service"
                  />
                </div>

                <div className="jp-service-info">
                  <h3>Loading service...</h3>
                  <p>Please wait...</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // Error UI
  if (error) {
    return (
      <main className="jp-services-page">
        <section className="jp-section">
          <div className="jp-section-heading">
            <h2>Popular Services</h2>
          </div>

          <div className="jp-empty">
            <h3>Unable to load services</h3>
            <p>{error}</p>

            <button
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  // Empty UI
  if (servicesData.length === 0) {
    return (
      <main className="jp-services-page">
        <section className="jp-section">
          <div className="jp-section-heading">
            <h2>Popular Services</h2>
          </div>

          <div className="jp-empty jp-services-empty">
            <div className="jp-empty-icon">🔧</div>
            <h3>No services available</h3>
            <p>
              Please check back later for available services.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="jp-services-page">
      <section className="jp-section">

        {/* Dashboard-style heading */}
        <div className="jp-section-heading">
          <div>
            <h2>Popular Services</h2>
            <p className="jp-services-subtitle">
              Explore services available at this shop.
            </p>
          </div>

          <span className="jp-services-count">
            {servicesData.length}{" "}
            {servicesData.length === 1
              ? "Service"
              : "Services"}
          </span>
        </div>

        {/* Same grid and cards as DashboardSummary */}
        <div className="jp-card-grid">
          {servicesData.map((service, index) => {
            const serviceName =
              service.title ||
              service.name ||
              "Service";

            const servicePrice =
              service.price ?? service.base_price;

            const serviceId =
              service.id ??
              service.service_id ??
              `${serviceName}-${index}`;

            const image = getServiceImage(service);
            const icon = getServiceIcon(service);

            return (
              <article
                className="jp-service-card"
                key={serviceId}
              >
                <div className="jp-service-image">
                  <img
                    src={image}
                    alt={serviceName}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        staticServices[0].image;
                    }}
                  />

                  <span
                    className={`jp-service-badge badge-${
                      index % 6
                    }`}
                  >
                    {icon}
                  </span>
                </div>

                <div className="jp-service-info">
                  <h3>{serviceName}</h3>

                  {service.description && (
                    <p className="jp-service-description">
                      {service.description}
                    </p>
                  )}

                  <p className="jp-service-price">
                    {service.pricing_type ===
                    "starting_from"
                      ? "From "
                      : ""}

                    <strong>
                      {servicePrice != null
                        ? `₹${Number(
                            servicePrice
                          ).toLocaleString("en-IN")}`
                        : "Contact for price"}
                    </strong>
                  </p>

                  {service.pricing_type ===
                    "starting_from" && (
                    <span className="jp-service-price-note">
                      Price may vary based on requirements
                    </span>
                  )}

                  <button
                    className="jp-book-button"
                    onClick={() => {
                      window.location.href =
                        "tel:" +
                        (service.phone ||
                          service.shop_phone ||
                          "");
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Services;