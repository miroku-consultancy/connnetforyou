import React, { useEffect, useState } from 'react';
import './Services.css'; // Import your styles
import apiUrl from '../config/apiConfig';

const Services = () => {
    const [servicesData, setServicesData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(apiUrl);

//const response = await fetch('/data.json');
            const data = await response.json();
            setServicesData(data.services);
        };

        fetchData();
    }, []);

    if (!servicesData.length) return <div>Loading...</div>; // Handle loading state

    return (
        <section id="services">
            <h2>Our Services</h2>
            <p>We offer a range of software consultancy services including:</p>
            <div className="services-list">
                {servicesData.map((service, index) => (
                    <div key={index} className="service-card">
                        <img src={`${process.env.PUBLIC_URL}/${service.image}`} alt={service.title} />
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services;
