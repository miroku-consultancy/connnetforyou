
import React, { useEffect, useState } from 'react';
import './Services.css';
import apiUrl from '../config/apiConfig';

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

                // 2. Resolve the shop using its domain
                const tenantResponse = await fetch(
                    `${apiUrl}/api/tenants/resolve?domain=${encodeURIComponent(domain)}`
                );

                if (!tenantResponse.ok) {
                    throw new Error('Failed to resolve shop');
                }

                const tenant = await tenantResponse.json();

                const shopId = tenant.shopId;

                if (!shopId) {
                    throw new Error('Shop ID not found');
                }

                console.log('Resolved shop:', tenant);
                console.log('Shop ID:', shopId);

                // 3. Fetch services for this shop
                const servicesResponse = await fetch(
                    `${apiUrl}/api/services?shop_id=${shopId}`
                );

                if (!servicesResponse.ok) {
                    throw new Error(
                        `Services API failed: ${servicesResponse.status}`
                    );
                }

                const data = await servicesResponse.json();

                // Supports either an array or { services: [...] }
                const services = Array.isArray(data)
                    ? data
                    : data.services || [];

                setServicesData(services);

            } catch (err) {
                console.error('Error loading services:', err);
                setError(err.message || 'Unable to load services');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    if (loading) {
        return <div>Loading services...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!servicesData.length) {
        return <div>No services available for this shop.</div>;
    }

    return (
        <section id="services">
            <h2>Our Services</h2>
            <p>Explore the services offered by this shop.</p>

            <div className="services-list">
                {servicesData.map((service) => (
                    <div key={service.id} className="service-card">
                        {service.image_url && (
                            <img
                                src={service.image_url}
                                alt={service.title}
                            />
                        )}

                        <h3>{service.title}</h3>
                        <p>{service.description}</p>

                        {service.price != null && (
                            <p>₹{service.price}</p>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services;