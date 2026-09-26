import React, { useEffect, useState } from 'react';
import './Services.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Services = () => {
    const [servicesData, setServicesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

   useEffect(() => {
    const fetchServices = async () => {
        console.log("========== SERVICES DEBUG START ==========");

        try {
            setLoading(true);
            setError('');

            // 1. Get current shop domain
            const domain = window.location.hostname;

            console.log("[1] Current domain:", domain);
            console.log("[2] API Base URL:", API_BASE_URL);

            // 2. Resolve tenant
            const tenantUrl =
                `${API_BASE_URL}/api/tenants/resolve?domain=${encodeURIComponent(domain)}`;

            console.log("[3] Tenant request URL:", tenantUrl);

            const tenantResponse = await fetch(tenantUrl);

            console.log("[4] Tenant status:", tenantResponse.status);
            console.log("[5] Tenant response OK:", tenantResponse.ok);

            if (!tenantResponse.ok) {
                const errorText = await tenantResponse.text();

                console.error("[TENANT ERROR]", errorText);

                throw new Error(
                    `Tenant API failed: ${tenantResponse.status} - ${errorText}`
                );
            }

            const tenant = await tenantResponse.json();

            console.log("[6] Resolved tenant:", tenant);

            const shopId = tenant.shopId;

            console.log("[7] Resolved shopId:", shopId);

            if (!shopId) {
                throw new Error("Shop ID not found in tenant response");
            }

            // 3. Fetch services
            const servicesUrl =
                `${API_BASE_URL}/api/services?shopId=${shopId}`;

            console.log("[8] Services request URL:", servicesUrl);
            console.log("[9] Sending services GET request...");

            const servicesResponse = await fetch(servicesUrl);

            console.log(
                "[10] Services response status:",
                servicesResponse.status
            );

            console.log(
                "[11] Services response OK:",
                servicesResponse.ok
            );

            console.log(
                "[12] Services response headers:",
                Object.fromEntries(servicesResponse.headers.entries())
            );

            // Read body once, so we can log it even for errors
            const responseText = await servicesResponse.text();

            console.log(
                "[13] Services raw response:",
                responseText
            );

            if (!servicesResponse.ok) {
                throw new Error(
                    `Services API failed: ${servicesResponse.status} - ${responseText}`
                );
            }

            // 4. Parse response
            const data = JSON.parse(responseText);

            console.log("[14] Parsed services data:", data);

            const services = Array.isArray(data)
                ? data
                : data.services || [];

            console.log("[15] Services count:", services.length);

            setServicesData(services);

        } catch (err) {
            console.error("========== SERVICES DEBUG ERROR ==========");
            console.error("[ERROR MESSAGE]:", err.message);
            console.error("[ERROR OBJECT]:", err);

            setError(err.message || 'Failed to load services');

        } finally {
            console.log("========== SERVICES DEBUG END ==========");
            setLoading(false);
        }
    };

    fetchServices();
}, []);

    // 5. Loading state
    if (loading) {
        return <div>Loading services...</div>;
    }

    // 6. Error state
    if (error) {
        return (
            <div className="error-message">
                <h3>Unable to load services</h3>
                <p>{error}</p>
            </div>
        );
    }

    // 7. Empty state
    if (servicesData.length === 0) {
        return <div>No published services available.</div>;
    }

    // 8. Render services
    return (
        <section id="services">
            <h2>Our Services</h2>
            <p>Explore the services offered by this shop.</p>

            <div className="services-list">
                {servicesData.map((service) => (
                    <div key={service.id} className="service-card">

                        {service.image_url && (
                            <img
                                src={
                                    service.image_url.startsWith('http')
                                        ? service.image_url
                                        : `${API_BASE_URL}${service.image_url}`
                                }
                                alt={service.title}
                            />
                        )}

                        <h3>{service.title}</h3>

                        <p>{service.description}</p>

                        {service.price != null && (
                            <p>
                                ₹{service.price}
                                {service.pricing_type === 'starting_from'
                                    ? ' onwards'
                                    : ''}
                            </p>
                        )}

                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services;