// pages/HelpPage.js
import React from 'react';
import './HelpPage.css';

const HelpPage = () => {
  return (
    <div className="help-page">
      <header className="help-hero">
        <div className="help-overlay">
          <h1>Need Help? We're Here for You</h1>
          <p>Explore common questions, get guidance, and reach out anytime.</p>
        </div>
      </header>

      <section className="help-section">
        <h2>Frequently Asked Questions (FAQs)</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3>📦 How do I track my order?</h3>
            <p>
              You can track your order by visiting the "Order History" section in your
              dashboard. Real-time updates will show order status and estimated delivery time.
            </p>
          </div>
          <div className="faq-item">
            <h3>🛠️ I'm a vendor. How do I add a new product?</h3>
            <p>
              Navigate to your Vendor Dashboard, click on "Add Product," and fill in the
              necessary product details. Products will be reviewed and listed instantly.
            </p>
          </div>
          <div className="faq-item">
            <h3>🔐 I forgot my password. What should I do?</h3>
            <p>
              Click on “Forgot Password” at the login page. You’ll receive a reset link to your
              registered email address within a few minutes.
            </p>
          </div>
          <div className="faq-item">
            <h3>💳 What payment methods are supported?</h3>
            <p>
              We support major credit cards, debit cards, UPI, and wallet payments for seamless
              checkout experiences.
            </p>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2>Contact Support</h2>
        <div className="contact-support">
          <img
            src="https://source.unsplash.com/600x400/?customer,service"
            alt="Support Team"
          />
          <div>
            <p>
              Can't find what you're looking for? Our dedicated support team is available 24/7
              to assist you with any questions, technical issues, or feedback.
            </p>
            <p>Email us at: <a href="mailto:support@yourapp.com">support@yourapp.com</a></p>
            <p>Live chat available Monday–Friday, 9 AM to 6 PM IST.</p>
            <button className="help-button">Chat with Us</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpPage;
