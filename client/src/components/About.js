import React, { useEffect, useState } from 'react';
import apiUrl from '../config/apiConfig';

const About = () => {
    const [aboutInfo, setAboutInfo] = useState(null);
    const [error, setError] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(apiUrl);

//const response = await fetch('/data.json');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setAboutInfo(data.about);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchData();
    }, []);

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (error) return <div>Error: {error}</div>;
    if (!aboutInfo) return <div>Loading...</div>;

    return (
        <section id="about" style={styles.aboutSection}>
            <h2>{aboutInfo.heading}</h2>

            {/* Team Section */}
            <div style={styles.content}>
                <div style={styles.imageContainer}>
                    <img src={`${process.env.PUBLIC_URL}/${aboutInfo.teamImage}`} alt="Our Team" style={styles.image} />
                </div>
                {/* <div style={styles.textContainer}>
                    <div>
                        {aboutInfo.description.slice(0, expandedSection === 'team' ? aboutInfo.description.length : 1).map((para, index) => (
                            <p key={index}>{para}</p>
                        ))}
                    </div>
                    <button onClick={() => toggleSection('team')} style={styles.toggleButton}>
                        {expandedSection === 'team' ? 'Hide Details' : 'Show Details'}
                    </button>
                </div> */}
            </div>

            {/* Office Section */}
            <div style={styles.content}>
                <div style={styles.imageContainer}>
                    <img src={`${process.env.PUBLIC_URL}/${aboutInfo.office.image}`} alt="Our Office" style={styles.officeImage} />
                </div>
                <div style={styles.textContainer}>
                    <p style={styles.officeTitle}>{aboutInfo.office.title}</p>
                    <p style={styles.officeSubtitle}>{aboutInfo.office.subtitle}</p>
                    <div>
                        {aboutInfo.office.description.split('. ').slice(0, expandedSection === 'office' ? undefined : 1).map((para, index) => (
                            <p key={index}>{para}.</p>
                        ))}
                    </div>
                    <button onClick={() => toggleSection('office')} style={styles.toggleButton}>
                        {expandedSection === 'office' ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>
            </div>
        </section>
    );
};

const styles = {
    aboutSection: {
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '40px',
    },
    textContainer: {
        marginTop: '20px',
        maxWidth: '600px',
    },
    imageContainer: {
        width: '100%',
    },
    image: {
        width: '100%',
        borderRadius: '8px',
    },
    officeImage: {
        width: '100%',
        borderRadius: '8px',
    },
    officeTitle: {
        fontSize: '1.5em',
        fontWeight: 'bold',
    },
    officeSubtitle: {
        fontSize: '1.2em',
        marginBottom: '10px',
    },
    toggleButton: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
};

export default About;
