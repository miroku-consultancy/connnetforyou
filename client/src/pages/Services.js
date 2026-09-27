
import React, { useEffect, useState } from "react";
import "../components/DashboardSummary.css";
import { secondaryApiUrl } from "../config/apiConfig";
import ServiceCard from "../components/catalog/ServiceCard";
import ServiceBooking from "./ServiceBooking";

const API_BASE_URL = "https://connnet4you-server.onrender.com";

// Static service images
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

// Get static image based on service category
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
  const staticAsset = getStaticServiceAsset(service);

  return staticAsset?.image || staticServices[0].image;
};

const getServiceIcon = (service) => {
  return getStaticServiceAsset(service)?.icon || "🔧";
};

// Resolve service ID consistently
const getServiceId = (service, index = 0) => {
  return (
    service?.id ??
    service?.service_id ??
    service?.serviceId ??
    `${service?.title || service?.name || "service"}-${index}`
  );
};

const Services = () => {
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [error, setError] = useState("");

  // Fetch services for the current tenant
  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const domain =
          window.location.hostname.toLowerCase();

        // Resolve current tenant
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

        // Fetch services for the resolved tenant
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

        // Only show published services
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
          setError(
            err.message || "Failed to load services."
          );
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

  // Select service and show booking panel at the top
  const handleSelectService = (service, index) => {
    const image = getServiceImage(service);

    setSelectedService({
      service,
      image,
      serviceId: getServiceId(service, index),
    });

    // Scroll to the booking panel
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Close selected service booking panel
  const handleBackToServices = () => {
    setSelectedService(null);
  };

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
              type="button"
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

  // Main Services UI
  return (
    <main className="jp-services-page">

      {/* =========================================
          TOP: Selected service booking panel
          Hidden until user selects a service
      ========================================= */}

      {selectedService && (
        <section className="jp-services-booking-top">
          <ServiceBooking
            key={selectedService.serviceId}
            service={selectedService.service}
            image={selectedService.image}
            onBack={handleBackToServices}
          />
        </section>
      )}

      {/* =========================================
          BELOW: All available services
          Always visible, including after selection
      ========================================= */}

      <section className="jp-services-list-panel">

        <div className="jp-section-heading">
          <div>
            <h2>Available Services</h2>

            <p className="jp-services-subtitle">
              Select a service to book.
            </p>
          </div>

          <span className="jp-services-count">
            {servicesData.length} Services
          </span>
        </div>

        <div className="jp-services-list-grid">
          {servicesData.map((service, index) => {
            const serviceName =
              service.title ||
              service.name ||
              "Service";

            const serviceId = getServiceId(
              service,
              index
            );

            const image = getServiceImage(service);

            const isSelected =
              selectedService?.serviceId === serviceId;

            return (
              <div
                key={serviceId}
                className={`jp-service-select-card ${
                  isSelected ? "selected" : ""
                }`}
              >
                <ServiceCard
                  service={service}
                  image={image}
                  icon={getServiceIcon(service)}
                  index={index}
                  onBook={() =>
                    handleSelectService(service, index)
                  }
                />

                {isSelected && (
                  <div className="jp-service-selected-label">
                    ✓ Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>
    </main>
  );
};

export default Services;