import React, { useEffect, useState } from 'react';
import './Services.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Services = () => {
    const [servicesData, setServicesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                setError('');

                // 1. Get current shop domain
                const domain = window.location.hostname;

                // 2. Resolve tenant using domain
                const tenantResponse = await fetch(
                    `${API_BASE_URL}/api/tenants/resolve?domain=${encodeURIComponent(domain)}`
                );

                if (!tenantResponse.ok) {
                    const errorText = await tenantResponse.text();

                    throw new Error(
                        `Tenant API failed: ${tenantResponse.status} - ${errorText}`
                    );
                }

                const tenant = await tenantResponse.json();
                const shopId = tenant.shopId;

                if (!shopId) {
                    throw new Error('Shop ID not found');
                }

                console.log('Resolved tenant:', tenant);
                console.log('Shop ID:', shopId);

                // 3. Fetch published services
                const servicesResponse = await fetch(
                    `${API_BASE_URL}/api/services?shopId=${shopId}`
                );

                if (!servicesResponse.ok) {
                    const errorText = await servicesResponse.text();

                    throw new Error(
                        `Services API failed: ${servicesResponse.status} - ${errorText}`
                    );
                }

                // 4. Parse response
                const data = await servicesResponse.json();

                // Supports either an array or { services: [...] }
                const services = Array.isArray(data)
                    ? data
                    : data.services || [];

                setServicesData(services);

            } catch (err) {
                console.error('Services loading error:', err);
                setError(err.message || 'Failed to load services');

            } finally {
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