import React, { useEffect, useState } from 'react';
import './Industries.css';
import apiUrl from '../config/apiConfig';

const Industry = () => {
    const [industries, setIndustries] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(apiUrl);

//const response = await fetch('/data.json');
            const data = await response.json();
            setIndustries(data.industries);
        };

        fetchData();
    }, []);

    const toggleDetails = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="industry-container">
            <h1>Industries We Serve</h1>
            <ul className="industry-list">
                {industries.map((industry, index) => (
                    <li key={index} className="industry-item">
                        <img src={process.env.PUBLIC_URL + '/' + industry.image} alt={industry.name} className="industry-image" />
                        <h2>{industry.name}</h2>
                        <p>{industry.description}</p>
                        <div>
                            {expandedIndex === index && <p className="industry-details">{industry.details}</p>}
                            <button onClick={() => toggleDetails(index)} style={styles.toggleButton}>
                                {expandedIndex === index ? 'Hide Details' : 'Show Details'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const styles = {
    toggleButton: {
        marginTop: '10px',
        padding: '10px 20px',
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
};

export default Industry;
