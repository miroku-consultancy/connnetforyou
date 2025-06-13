import React, { useEffect, useState } from 'react';
import apiUrl from '../config/apiConfig';

const Contact = () => {
    const [contactInfo, setContactInfo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(apiUrl);

//const response = await fetch('/data.json');
            const data = await response.json();
            setContactInfo(data.contact);
        };

        fetchData();
    }, []);

    if (!contactInfo) return <div>Loading...</div>; // Handle loading state

    return (
        <section 
            id="contact" 
            style={{ ...styles.contactSection, backgroundImage: `url(${process.env.PUBLIC_URL}/${contactInfo.backgroundImage})` }}
        >
            <h2>{contactInfo.heading}</h2>
            <p>{contactInfo.description}</p>
            <div style={styles.contactInfo}>
                {/* <img src={`${process.env.PUBLIC_URL}/${contactInfo.email.icon}`} alt="phone Icon" style={styles.icon} /> */}
                <p>Phone: <a href={`mailto:${contactInfo.email.address}`} style={styles.emailLink}>{contactInfo.email.phone}</a></p>
            </div>
            <div style={styles.addressInfo}>
                <p>{contactInfo.office.delhititle}</p>
                <p style={styles.address}>{contactInfo.office.delhiaddress}</p>
            </div>
            <div style={styles.addressInfo}>
                <p>{contactInfo.office.title}</p>
                <p style={styles.address}>{contactInfo.office.address}</p>
            </div>
            <div style={styles.contactInfo}>
                <img src={`${process.env.PUBLIC_URL}/${contactInfo.email.icon}`} alt="Email Icon" style={styles.icon} />
                <p>Email: <a href={`mailto:${contactInfo.email.address}`} style={styles.emailLink}>{contactInfo.email.address}</a></p>
            </div>
            <div style={styles.contactInfo}>
                {/* <img src={`${process.env.PUBLIC_URL}/${contactInfo.email.icon}`} alt="phone Icon" style={styles.icon} /> */}
                <p>Schedule: <a href={`mailto:${contactInfo.email.address}`} style={styles.emailLink}>{contactInfo.email.schedule}</a></p>
            </div>
            {/* Google Map Embed */}
            <div style={styles.mapContainer}>
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28013.976806652114!2d77.44156199999998!3d28.6373408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cf1de56c6362d%3A0xcfd96615a8f6bf0a!2s428%2C%20Bhatia%20Rd%2C%20Kamla%20Quarter%2C%20Nehru%20Nagar%20III%2C%20Nehru%20Nagar%2C%20Ghaziabad%2C%20Uttar%20Pradesh%20201001!5e0!3m2!1sen!2sin!4v1728531440818!5m2!1sen!2sin" 
                    style={styles.map}
                    allowFullScreen 
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </section>
    );
};

const styles = {
    contactSection: {
        padding: '40px 20px',
        textAlign: 'center',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
    },
    contactInfo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '20px',
    },
    icon: {
        width: '30px',
        height: '30px',
        marginRight: '10px',
    },
    emailLink: {
        color: '#fff',
        textDecoration: 'underline',
    },
    addressInfo: {
        marginTop: '20px',
    },
    address: {
        fontSize: '1.2em',
    },
    mapContainer: {
        marginTop: '20px',
        width: '100%',
        maxWidth: '600px', // Set a maximum width for the map
        height: '300px', // Adjust height as necessary
        margin: 'auto', // Center the map
    },
    map: {
        width: '100%',
        height: '100%',
        border: '0',
    },
};

export default Contact;
