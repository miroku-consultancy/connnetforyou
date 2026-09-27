
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../components/DashboardSummary.css";
import "./ServiceBooking.css";
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
  <main className="jp-booking-page">
    <div className="jp-booking-container">

      <button
        type="button"
        className="jp-booking-back"
        onClick={() => navigate(-1)}
      >
        ← Back to Services
      </button>

      <header className="jp-booking-header">
        <span className="jp-booking-eyebrow">
          ✦ JusPing Services
        </span>

        <h1>
          Book your service.
          <br />
          <span style={{ color: "#6366f1" }}>
            We'll handle the rest.
          </span>
        </h1>

        <p>
          Tell us what you need, choose your preferred
          schedule, and get started with your booking.
        </p>
      </header>

      <div className="jp-booking-grid">

        {/* LEFT: Service details */}
        <div>
          <article className="jp-booking-service-card">

            {image && (
              <div className="jp-booking-service-image-wrap">
                <img
                  src={image}
                  alt={serviceName}
                  className="jp-booking-service-image"
                />

                <div className="jp-booking-image-overlay" />

                <span className="jp-booking-image-label">
                  ✓ Selected Service
                </span>
              </div>
            )}

            <div className="jp-booking-service-content">
              <h2>{serviceName}</h2>

              <p className="jp-booking-service-description">
                {service.description ||
                  "Professional service tailored to your requirements."}
              </p>

              <div className="jp-booking-price-box">
                <div>
                  <div className="jp-booking-price-label">
                    {service.pricing_type === "starting_from"
                      ? "Starting from"
                      : "Service price"}
                  </div>

                  <div className="jp-booking-price">
                    {price != null
                      ? `₹${Number(price).toLocaleString("en-IN")}`
                      : "Contact for price"}
                  </div>

                  {service.pricing_type === "starting_from" && (
                    <div className="jp-booking-price-note">
                      Final price depends on requirements
                    </div>
                  )}
                </div>

                <span style={{ fontSize: 32 }}>
                  ✨
                </span>
              </div>
            </div>
          </article>

          <div className="jp-booking-trust">
            <div className="jp-booking-trust-item">
              <div className="jp-booking-trust-icon">
                📅
              </div>
              <div>
                <strong>Flexible scheduling</strong>
                <span>Choose your preferred time</span>
              </div>
            </div>

            <div className="jp-booking-trust-item">
              <div className="jp-booking-trust-icon">
                🛡️
              </div>
              <div>
                <strong>Booking details</strong>
                <span>Your requirements in one place</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Booking form */}
        <form
          className="jp-booking-form-card"
          onSubmit={handleContinue}
        >
          <div className="jp-booking-form-header">
            <h2>Let's get you booked</h2>
            <p>
              Fill in the details below to continue.
            </p>
          </div>

          <div className="jp-booking-field">
            <label htmlFor="booking-date">
              Preferred date
            </label>

            <input
              id="booking-date"
              className="jp-booking-input"
              type="date"
              name="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={booking.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="jp-booking-field">
            <label htmlFor="booking-time">
              Preferred time
            </label>

            <input
              id="booking-time"
              className="jp-booking-input"
              type="time"
              name="time"
              value={booking.time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="jp-booking-field">
            <label htmlFor="booking-address">
              Service address
            </label>

            <textarea
              id="booking-address"
              className="jp-booking-textarea"
              name="address"
              placeholder="House no., street, area, city..."
              value={booking.address}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div className="jp-booking-field">
            <label htmlFor="booking-requirements">
              What do you need?
              <span style={{ color: "#94a3b8" }}>
                {" "}(Optional)
              </span>
            </label>

            <textarea
              id="booking-requirements"
              className="jp-booking-textarea"
              name="requirements"
              placeholder="Tell us more about your requirements..."
              value={booking.requirements}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="jp-booking-submit"
          >
            Continue
            <span>→</span>
          </button>

          <p className="jp-booking-form-footnote">
            Booking confirmation and payment will be
            available once the booking API is connected.
          </p>
        </form>

      </div>
    </div>
  </main>
);
};

export default ServiceBooking;