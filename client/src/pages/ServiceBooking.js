
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../components/DashboardSummary.css";

const ServiceBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const service = location.state?.service;
  const image = location.state?.image;

  const [booking, setBooking] = useState({
    date: "",
    time: "",
    address: "",
    requirements: "",
  });

  // Handle direct URL access without selected service
  if (!service) {
    return (
      <main className="jp-services-page">
        <section className="jp-section">
          <h2>Service not selected</h2>
          <p>Please select a service before booking.</p>

          <button onClick={() => navigate(-1)}>
            Go Back
          </button>
        </section>
      </main>
    );
  }

  const serviceName =
    service.title || service.name || "Service";

  const price = service.price ?? service.base_price;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = (event) => {
    event.preventDefault();

    // Booking API integration will be added
    // after verifying the backend booking endpoint.
    alert(
      "Booking form is ready. Booking confirmation will be enabled after API integration."
    );
  };

  return (
    <main className="jp-services-page">
      <section className="jp-section">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="jp-back-button"
        >
          ← Back to Services
        </button>

        <div className="jp-section-heading">
          <div>
            <h2>Book a Service</h2>
            <p className="jp-services-subtitle">
              Choose your preferred date and provide
              your service requirements.
            </p>
          </div>
        </div>

        <div className="jp-booking-layout">
          {/* Selected service */}
          <div className="jp-booking-service">
            {image && (
              <img
                src={image}
                alt={serviceName}
                className="jp-booking-image"
              />
            )}

            <div className="jp-service-info">
              <h3>{serviceName}</h3>

              {service.description && (
                <p>{service.description}</p>
              )}

              <p className="jp-service-price">
                Price:{" "}
                <strong>
                  {price != null
                    ? `₹${Number(price).toLocaleString("en-IN")}`
                    : "Contact for price"}
                </strong>
              </p>

              {service.pricing_type === "starting_from" && (
                <small>
                  Final price may vary based on requirements.
                </small>
              )}
            </div>
          </div>

          {/* Booking form */}
          <form
            className="jp-booking-form"
            onSubmit={handleContinue}
          >
            <h3>Booking Details</h3>

            <label htmlFor="booking-date">
              Preferred Date
            </label>

            <input
              id="booking-date"
              type="date"
              name="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={booking.date}
              onChange={handleChange}
              required
            />

            <label htmlFor="booking-time">
              Preferred Time
            </label>

            <input
              id="booking-time"
              type="time"
              name="time"
              value={booking.time}
              onChange={handleChange}
              required
            />

            <label htmlFor="booking-address">
              Service Address
            </label>

            <textarea
              id="booking-address"
              name="address"
              placeholder="Enter your complete address"
              value={booking.address}
              onChange={handleChange}
              rows={3}
              required
            />

            <label htmlFor="booking-requirements">
              Additional Requirements
            </label>

            <textarea
              id="booking-requirements"
              name="requirements"
              placeholder="Describe what service you need"
              value={booking.requirements}
              onChange={handleChange}
              rows={4}
            />

            <button
              type="submit"
              className="jp-book-button"
            >
              Continue
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default ServiceBooking;