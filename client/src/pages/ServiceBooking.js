import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../components/DashboardSummary.css";
import "./ServiceBooking.css";

import { useCart } from "../components/CartContext";


/* =========================================================
   NEXT 7 DAYS
   ========================================================= */

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


/* =========================================================
   DEFAULT TIME SLOTS
   ========================================================= */

const DEFAULT_TIME_SLOTS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
  "8:00 PM - 10:00 PM",
];


/* =========================================================
   SERVICE BOOKING
   ========================================================= */

const ServiceBooking = ({ service, image, onBack }) => {
  const { addToCart, cart } = useCart();

  const navigate = useNavigate();

  const [showCartPopup, setShowCartPopup] = useState(false);

  const days = getNextSevenDays();


  /* =========================================================
     SERVICE DATA
     ========================================================= */

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
    service?.price ??
    service?.base_price;

  const serviceCartId = `service_${serviceId}`;


  /* =========================================================
     CART DATA
     ========================================================= */

  const existingCartItem = cart?.[serviceCartId];

  const cartItems = Object.values(cart || {});

  const cartItemCount = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );


  /* =========================================================
     BOOKING STATE
     ========================================================= */

  const [booking, setBooking] = useState({
    date: days[0]?.value || "",
    time: "",
    requirements: "",
  });


  /* =========================================================
     FORM CHANGE
     ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  /* =========================================================
     ADD SERVICE TO CART
     ========================================================= */

  const handleContinue = (event) => {
    event.preventDefault();

    if (!booking.date || !booking.time) {
      alert("Please select a date and time slot.");
      return;
    }

    const serviceItem = {
      id: serviceCartId,

      name: serviceName,

      price: Number(price || 0),

      image: image || "",

      quantity: 1,

      /* Service-specific information */
      cartType: "service",

      serviceId,

      serviceName,

      appointmentDate: booking.date,

      appointmentTime: booking.time,

      requirements:
        booking.requirements.trim(),

      pricingType:
        service?.pricing_type || "fixed",

      shopId:
        service?.shop_id ??
        service?.shopId ??
        null,
    };


    /* Add service to existing CartContext */
    addToCart(serviceItem, 1);

    alert("Service added to cart!");
  };


  /* =========================================================
     SAFETY
     ========================================================= */

  if (!service) {
    return null;
  }


  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="jp-booking-page">

      <div className="jp-booking-container">


        {/* =====================================================
            BACK BUTTON
            ===================================================== */}

        <button
          type="button"
          className="jp-booking-back"
          onClick={onBack}
        >
          ← Back to Services
        </button>


        {/* =====================================================
            HEADER
            ===================================================== */}

        <header className="jp-booking-header">

          <h1>
            Book {serviceName}
          </h1>

          <p>
            Choose your preferred date and time,
            and tell us what you need.
          </p>

        </header>


        {/* =====================================================
            MAIN GRID
            ===================================================== */}

        <div className="jp-booking-grid">


          {/* ===================================================
              LEFT: SELECTED SERVICE
              =================================================== */}

          <div>

            <article className="jp-booking-service-card">


              {/* SERVICE IMAGE */}

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


              {/* SERVICE CONTENT */}

              <div className="jp-booking-service-content">

                <h2>
                  {serviceName}
                </h2>

                <p className="jp-booking-service-description">
                  {service.description ||
                    "Professional service tailored to your requirements."}
                </p>


                {/* PRICE */}

                <div className="jp-booking-price-box">

                  <div>

                    <div className="jp-booking-price-label">

                      {service.pricing_type ===
                      "starting_from"
                        ? "Starting from"
                        : "Service price"}

                    </div>

                    <div className="jp-booking-price">

                      {price != null
                        ? `₹${Number(
                            price
                          ).toLocaleString("en-IN")}`
                        : "Contact for price"}

                    </div>


                    {service.pricing_type ===
                      "starting_from" && (
                      <div className="jp-booking-price-note">
                        Final price depends on requirements
                      </div>
                    )}

                  </div>


                  <span
                    style={{
                      fontSize: 32,
                    }}
                  >
                    ✨
                  </span>

                </div>


                {/* ALREADY IN CART */}

                {existingCartItem && (
                  <div className="jp-service-cart-status">
                    ✓ This service is already in your cart
                  </div>
                )}

              </div>

            </article>

          </div>


          {/* ===================================================
              RIGHT: BOOKING FORM
              =================================================== */}

          <form
            className="jp-booking-form-card"
            onSubmit={handleContinue}
          >


            {/* FORM HEADER */}

            <div className="jp-booking-form-header">

              <h2>
                Choose your schedule
              </h2>

              <p>
                Select a day within the next 7 days.
              </p>

            </div>


            {/* =================================================
                DATE SELECTION
                ================================================= */}

            <div className="jp-booking-field">

              <label>
                Preferred date
              </label>


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
                      {index === 0
                        ? "Today"
                        : day.day}
                    </span>

                    <strong>
                      {day.date}
                    </strong>

                    <small>
                      {day.month}
                    </small>

                  </button>

                ))}

              </div>

            </div>


            {/* =================================================
                TIME SLOT SELECTION
                ================================================= */}

            <div className="jp-booking-field">

              <label>
                Available time slots
              </label>


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


            {/* =================================================
                REQUIREMENTS
                ================================================= */}

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


            {/* =================================================
                ADD TO CART
                ================================================= */}

            <button
              type="submit"
              className="jp-booking-submit"
            >

              Add to Cart

              <span>
                →
              </span>

            </button>


            <p className="jp-booking-form-footnote">
              Your selected service and appointment
              details will be saved in your cart.
            </p>

          </form>

        </div>

      </div>


      {/* =======================================================
          FLOATING CART
          ======================================================= */}

      {cartItemCount > 0 && (
        <div
          className="floating-cart"
          onClick={() =>
            setShowCartPopup(true)
          }
        >

          🛒 {cartItemCount} item(s) | ₹
          {cartTotal.toFixed(2)}
          {" "}→ View Cart

        </div>
      )}


      {/* =======================================================
          CART POPUP
          ======================================================= */}

      {showCartPopup && (
        <div
          className="jp-cart-popup"
          onClick={() =>
            setShowCartPopup(false)
          }
        >

          <div
            className="jp-cart-popup-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* CLOSE */}

            <button
              type="button"
              className="jp-cart-close-btn"
              onClick={() =>
                setShowCartPopup(false)
              }
              aria-label="Close cart"
            >
              &times;
            </button>


            {/* TITLE */}

            <h2>
              Your Cart
            </h2>


            {/* CART ITEMS */}

            <ul>

              {cartItems.map((item) => (

                <li
                  key={item.id}
                  className="jp-cart-item-list"
                >


                  {/* ITEM IMAGE */}

                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="jp-cart-item-image"
                    />
                  )}


                  {/* ITEM DETAILS */}

                  <div className="jp-cart-item-details">

                    <span className="jp-cart-item-name">
                      {item.name}
                    </span>


                    {/* SERVICE DATE */}

                    {item.cartType === "service" && (
                      <>
                        <span className="jp-unit-label">
                          📅 {item.appointmentDate}
                        </span>

                        <span className="jp-unit-label">
                          ⏰ {item.appointmentTime}
                        </span>
                      </>
                    )}


                    {/* QUANTITY */}

                    <span className="jp-cart-item-quantity">
                      × {item.quantity}
                    </span>

                  </div>


                  {/* PRICE */}

                  <span className="jp-cart-item-price">

                    ₹
                    {(
                      Number(item.price || 0) *
                      Number(item.quantity || 0)
                    ).toFixed(2)}

                  </span>

                </li>

              ))}

            </ul>


            {/* PROCEED */}

            <button
              type="button"
              onClick={() =>
                navigate("/order")
              }
              className="jp-cart-proceed-btn"
            >
              Proceed to Order
            </button>

          </div>

        </div>
      )}

    </main>
  );
};


export default ServiceBooking;