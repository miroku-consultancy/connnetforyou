// pages/About.js
import React from 'react';
import './About.css'; // Import custom styles

const About = () => {
  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="about-overlay">
          <h1>Empowering Businesses, Enabling Growth</h1>
          <p>Your trusted SaaS partner for digital transformation.</p>
        </div>
      </header>

      <section className="about-section">
        <h2>Who We Are</h2>
        <div className="about-content">
          <img
            src="https://source.unsplash.com/600x400/?team,technology"
            alt="Our Team"
            className="about-image"
          />
          <p>
            We are a team of passionate innovators, developers, and entrepreneurs dedicated
            to solving real-world problems for businesses. Our platform was built with
            simplicity, performance, and user experience at its core. Since launch, we've
            helped hundreds of vendors and customers thrive in the digital space.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>What We Offer</h2>
        <div className="about-grid">
          <div className="about-feature">
            <img src="https://source.unsplash.com/300x200/?dashboard" alt="Dashboard" />
            <h3>Smart Dashboard</h3>
            <p>Intuitive analytics and management tools to stay in control.</p>
          </div>
          <div className="about-feature">
            <img src="https://source.unsplash.com/300x200/?ecommerce" alt="E-commerce" />
            <h3>Vendor Tools</h3>
            <p>Seamless tools for vendors to manage orders, inventory, and product listings.</p>
          </div>
          <div className="about-feature">
            <img src="https://source.unsplash.com/300x200/?support,customer" alt="Support" />
            <h3>Customer Support</h3>
            <p>Dedicated support and streamlined communication with your customers.</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Our mission is to democratize digital commerce. We want to empower businesses of
          all sizes with the technology and infrastructure they need to succeed in today’s
          fast-paced digital economy. Whether you’re a small vendor or a large retailer,
          we’re here to help you scale.
        </p>
      </section>

      <section className="about-cta">
        <h2>Join Us on the Journey</h2>
        <p>
          We're constantly evolving, and we're excited to have you with us. Join thousands of
          users who trust our platform every day.
        </p>
        <button className="about-button">Get Started</button>
      </section>
    </div>
  );
};

export default About;
