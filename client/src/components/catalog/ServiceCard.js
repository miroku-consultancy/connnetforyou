
import React from "react";
import { useNavigate } from "react-router-dom";

const ServiceCard = ({ service, image, icon, index ,onBook}) => {
    
const navigate = useNavigate();
  const serviceName =
    service.title || service.name || "Service";

  const servicePrice =
    service.price ?? service.base_price;

  return (
    <article className="jp-service-card">
      <div className="jp-service-image">
        <img
          src={image}
          alt={serviceName}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = image;
          }}
        />

        <span
          className={`jp-service-badge badge-${index % 6}`}
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
          {service.pricing_type === "starting_from"
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

        {service.pricing_type === "starting_from" && (
          <span className="jp-service-price-note">
            Price may vary based on requirements
          </span>
        )}

        <button
  type="button"
  onClick={() => {
    if (typeof onBook === "function") {
      onBook(service, image);
    } else {
      console.error("onBook callback missing");
    }
  }}
>
  Book Now
</button>
      </div>
    </article>
  );
};

export default ServiceCard;