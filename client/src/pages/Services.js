
import React, { useEffect, useState } from 'react';
import './Services.css';
import { secondaryApiUrl } from '../config/apiConfig';

const Services = () => {
    const [servicesData, setServicesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                setError('');

                const domain = window.location.hostname;

                // Resolve tenant
                const tenantResponse = await fetch(
                    `${secondaryApiUrl}/api/tenants/resolve?domain=${encodeURIComponent(domain)}`
                );

                if (!tenantResponse.ok) {
                    throw new Error(
                        `Tenant API failed: ${tenantResponse.status}`
                    );
                }

                const tenant = await tenantResponse.json();
                const shopId = tenant.shopId;

                if (!shopId) {
                    throw new Error('Shop ID not found');
                }

                console.log('Tenant:', tenant);
                console.log('Shop ID:', shopId);

                // Fetch published services
                const servicesResponse = await fetch(
                    `${secondaryApiUrl}/api/services?shopId=${shopId}`
                );

                if (!servicesResponse.ok) {
                    const errorText = await servicesResponse.text();

                    throw new Error(
                        `Services API failed: ${servicesResponse.status} - ${errorText}`
                    );
                }

                const data = await servicesResponse.json();

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

    if (loading) {
        return <div>Loading services...</div>;
    }

    if (error) {
        return (
            <div className="error-message">
                <h3>Unable to load services</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (servicesData.length === 0) {
        return <div>No published services available.</div>;
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
                                src={
                                    service.image_url.startsWith('http')
                                        ? service.image_url
                                        : `${secondaryApiUrl}${service.image_url}`
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