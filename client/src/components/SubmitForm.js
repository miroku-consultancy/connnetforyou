import React, { useState, useEffect } from 'react';
import { init, send } from 'emailjs-com';
import './SubmitForm.css';
import apiUrl from '../config/apiConfig';

const SubmitForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        description: ''
    });
    
    const [formContent, setFormContent] = useState(null);

    // Initialize EmailJS with the user ID from the environment variable
    init(process.env.REACT_APP_EMAILJS_USER_ID);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(apiUrl);

//const response = await fetch('/data.json'); // Adjust path if needed
            const data = await response.json();
            setFormContent(data.submitForm);
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        send(
            process.env.REACT_APP_EMAILJS_SERVICE_ID, 
            process.env.REACT_APP_EMAILJS_TEMPLATE_ID, 
            formData
        )
            .then((response) => {
                console.log('SUCCESS!', response.status, response.text);
                alert('Message sent successfully!');
                setFormData({ name: '', mobile: '', email: '', description: '' }); // Reset form
            })
            .catch((err) => {
                console.error('Failed to send message. Error: ', err);
                alert('Failed to send message. Please try again later.');
            });
    };

    if (!formContent) return <div>Loading...</div>; // Handle loading state

    return (
        <div className="submit-form-container">
            <h1>{formContent.heading}</h1>
            <p>{formContent.description}</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Mobile:</label>
                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default SubmitForm;
