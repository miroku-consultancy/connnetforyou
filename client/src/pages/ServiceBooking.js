
import React, { useState } from "react";
import "../components/DashboardSummary.css";
import "./ServiceBooking.css";
import { useCart } from "../context/CartContext";

const getNextSevenDays = () => {
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    days.push({
      value: `${year}-${month}-${day}`,
      day: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      date: date.getDate(),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
    });
  }

  return days;
};

const DEFAULT_TIME_SLOTS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
  "8:00 PM - 10:00 PM",
];

const ServiceBooking = ({ service, image, onBack }) => {
  const { addToCart, cart } = useCart();

  const days = getNextSevenDays();

  const timeSlots =
    service?.available_time_slots ||
    service?.time_slots ||
    DEFAULT_TIME_SLOTS;

  const serviceName =
    service?.title ||
    service?.name ||
    "Service";

  const serviceId =
    service?.id ??
    service?.service_id ??
    service?.serviceId ??
    serviceName;

  const price =
    service?.price ?? service?.base_price;

  const serviceCartId = `service_${serviceId}`;

  const existingCartItem = cart?.[serviceCartId];

  const [booking, setBooking] = useState({
    date: days[0]?.value || "",
    time: "",
    address: "",
    requirements: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = (event) => {
    event.preventDefault();

    if (!booking.date || !booking.time) {
      alert("Please select a date and time slot.");
      return;
    }

    if (!booking.address.trim()) {
      alert("Please enter your service address.");
      return;
    }

    const serviceItem = {
      id: serviceCartId,
      name: serviceName,
      price: Number(price || 0),
      image: image || "",
      quantity: 1,

      // Service-specific information
      cartType: "service",
      serviceId,
      serviceName,

      appointmentDate: booking.date,
      appointmentTime: booking.time,

      serviceAddress: booking.address.trim(),
      requirements: booking.requirements.trim(),

      pricingType:
        service?.pricing_type || "fixed",

      shopId:
        service?.shop_id ??
        service?.shopId ??
        null,
    };

    // Add service to the existing CartContext
    addToCart(serviceItem, 1);

    alert("Service added to cart!");
  };

  if (!service) return null;

  return (
    <main className="jp-booking-page">
      <div className="jp-booking-container">

        {/* Back button */}

        <button
          type="button"
          className="jp-booking-back"
          onClick={onBack}
        >
          ← Back to Services
        </button>

        {/* Booking heading */}

        <header className="jp-booking-header">
          <h1>Book {serviceName}</h1>

          <p>
            Choose your preferred date and time,
            and tell us what you need.
          </p>
        </header>

        <div className="jp-booking-grid">

          {/* LEFT: Selected service */}

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
                    Selected Service
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

                {existingCartItem && (
                  <div className="jp-service-cart-status">
                    ✓ This service is already in your cart
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* RIGHT: Booking form */}

          <form
            className="jp-booking-form-card"
            onSubmit={handleContinue}
          >
            <div className="jp-booking-form-header">
              <h2>Choose your schedule</h2>

              <p>
                Select a day within the next 7 days.
              </p>
            </div>

            {/* DATE SELECTION */}

            <div className="jp-booking-field">
              <label>Preferred date</label>

              <div className="jp-date-options">
                {days.map((day, index) => (
                  <button
                    key={day.value}
                    type="button"
                    className={`jp-date-option ${
                      booking.date === day.value
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setBooking((prev) => ({
                        ...prev,
                        date: day.value,
                      }))
                    }
                  >
                    <span>
                      {index === 0 ? "Today" : day.day}
                    </span>

                    <strong>{day.date}</strong>

                    <small>{day.month}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* TIME SLOT SELECTION */}

            <div className="jp-booking-field">
              <label>Available time slots</label>

              <div className="jp-time-options">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`jp-time-option ${
                      booking.time === slot
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setBooking((prev) => ({
                        ...prev,
                        time: slot,
                      }))
                    }
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* SERVICE ADDRESS */}

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

            {/* REQUIREMENTS */}

            <div className="jp-booking-field">
              <label htmlFor="booking-requirements">
                What do you need? (Optional)
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

            {/* ADD TO CART */}

            <button
              type="submit"
              className="jp-booking-submit"
            >
              Add to Cart
              <span> →</span>
            </button>

            <p className="jp-booking-form-footnote">
              Your selected service and appointment
              details will be saved in your cart.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ServiceBooking;