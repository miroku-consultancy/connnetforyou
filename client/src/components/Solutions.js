import React, { useEffect, useState } from 'react';
import './Solutions.css';
import apiUrl from '../config/apiConfig';

const Solutions = () => {
    const [solutionsData, setSolutionsData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(apiUrl);

//const response = await fetch('/data.json');
            const data = await response.json();
            setSolutionsData(data.solutions);
        };

        fetchData();
    }, []);

    if (!solutionsData.length) return <div>Loading...</div>; // Handle loading state

    return (
        <section id="solutions" className="solutions-section">
            <h1>Our Solutions</h1>
            <div className="solutions-list">
                {solutionsData.map((solution, index) => (
                    <div key={index} className="solution-item">
                        <img src={`${process.env.PUBLIC_URL}/${solution.image}`} alt={solution.title} className="solution-image" />
                        <h2>{solution.title}</h2>
                        <p>{solution.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Solutions;
