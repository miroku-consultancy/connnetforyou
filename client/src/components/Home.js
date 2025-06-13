import React, { useEffect, useState } from 'react';
import apiUrl from '../config/apiConfig';

const Home = () => {
    const [homeInfo, setHomeInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(apiUrl);

//const response = await fetch('/data.json');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setHomeInfo(data.home);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>; // Handle loading state
    if (error) return <div>Error: {error}</div>; // Handle error state
    if (!homeInfo) return <div>No home information available.</div>; // Fallback if no data

    return (
        <section id="home" style={styles.homeSection}>
            <div style={styles.contentContainer}>
                <div style={styles.textContainer}>
                    <h1>{homeInfo.heading}</h1>
                    <p>{homeInfo.description}</p>
                </div>
                <div style={styles.imageContainer}>
                    <img 
                        src={`${process.env.PUBLIC_URL}/${homeInfo.backgroundImage}`} 
                        alt="Home Background" 
                        style={styles.image} 
                    />
                </div>
            </div>
        </section>
    );
};

const styles = {
    homeSection: {
        padding: '40px 20px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'row',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
    },
    textContainer: {
        flex: '1',
        paddingRight: '20px', 
        color: 'black',
    },
    imageContainer: {
        flex: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px', // Optional for rounded corners
    },
    ctaContainer: {
        marginTop: '20px',
    },
    ctaButton: {
        padding: '10px 20px',
        fontSize: '16px',
        color: '#fff',
        backgroundColor: '#007BFF',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
};

export default Home;
