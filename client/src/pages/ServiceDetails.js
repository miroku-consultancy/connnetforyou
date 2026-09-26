
// import React, { useEffect, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import "./Services.css";

// const API_BASE_URL = "https://connnet4you-server.onrender.com";

// const ServiceDetails = () => {
//   const { id } = useParams();

//   const [service, setService] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchService = async () => {
//       try {
//         setLoading(true);

//         const response = await fetch(
//           `${API_BASE_URL}/api/services/${id}`
//         );

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data.message || "Service not found."
//           );
//         }

//         setService(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchService();
//   }, [id]);

//   const getImageUrl = (imageUrl) => {
//     if (!imageUrl) return "";

//     return imageUrl.startsWith("http")
//       ? imageUrl
//       : `${API_BASE_URL}${imageUrl}`;
//   };

//   if (loading) {
//     return (
//       <div className="services-message">
//         Loading service...
//       </div>
//     );
//   }

//   if (error || !service) {
//     return (
//       <div className="services-message">
//         {error || "Service not found."}
//         <p>
//           <Link to="/services">
//             Back to services
//           </Link>
//         </p>
//       </div>
//     );
//   }

//   const phone = service.phone || "";
//   const whatsappNumber = phone.replace(/\D/g, "");

//   const price =
//     service.pricing_type === "quote"
//       ? "Contact for quote"
//       : service.pricing_type === "starting_from"
//       ? `Starting from ₹${Number(service.price).toLocaleString("en-IN")}`
//       : `₹${Number(service.price).toLocaleString("en-IN")}`;

//   return (
//     <div className="service-details-page">
//       <Link
//         to={
//           service.shop_slug
//             ? `/${service.shop_slug}/services`
//             : "/services"
//         }
//         className="service-back-link"
//       >
//         ← Back to services
//       </Link>

//       <div className="service-details-card">
//         <div className="service-details-image">
//           {service.image_url ? (
//             <img
//               src={getImageUrl(service.image_url)}
//               alt={service.title}
//             />
//           ) : (
//             <div className="service-image-placeholder">
//               Service Image
//             </div>
//           )}
//         </div>

//         <div className="service-details-content">
//           {service.category && (
//             <span className="service-category">
//               {service.category}
//             </span>
//           )}

//           <h1>{service.title}</h1>

//           <div className="service-details-price">
//             {price}
//           </div>

//           <h3>About this service</h3>

//           <p className="service-details-description">
//             {service.description ||
//               "Please contact the provider for service details."}
//           </p>

//           <div className="service-provider-info">
//             <h3>Service Provider</h3>

//             <p>
//               <strong>{service.business_name}</strong>
//             </p>

//             {service.address && (
//               <p>{service.address}</p>
//             )}

//             {phone && (
//               <p>
//                 Contact: {phone}
//               </p>
//             )}
//           </div>

//           <div className="service-details-actions">
//             {phone && (
//               <a
//                 href={`tel:${phone}`}
//                 className="service-btn-primary"
//               >
//                 Call Provider
//               </a>
//             )}

//             {whatsappNumber && (
//               <a
//                 href={`https://wa.me/${whatsappNumber}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="service-btn-secondary"
//               >
//                 WhatsApp
//               </a>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceDetails;