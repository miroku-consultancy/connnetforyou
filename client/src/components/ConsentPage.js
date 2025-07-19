// pages/ConsentPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ConsentPage.css';

const ConsentPage = () => {
  return (
    <div className="consent-page">
      <header className="consent-hero">
        <div className="consent-overlay">
          <h1>Consent & Communication</h1>
          <p>We value transparency and your privacy.</p>
        </div>
      </header>

      <section className="consent-message">
        <p>
          📦 By continuing, you consent to the use of your contact details for essential
          communications related to your orders, such as delivery updates, service notifications,
          and customer support.
        </p>
        <p>
          🏠 Your address and contact information will only be used to facilitate accurate and
          timely delivery. We do not sell or misuse your data.
        </p>
        <p>
          🔒 We respect your privacy and handle your data securely in compliance with GDPR and
          other applicable data protection regulations.
        </p>
        <p>
          Learn more in our{' '}
          <Link to="/privacy-policy" className="consent-link">Privacy Policy</Link> and{' '}
          <Link to="/terms-of-service" className="consent-link">Terms of Service</Link>.
        </p>

        <div className="consent-actions">
          <button className="consent-button" onClick={() => alert('Consent given!')}>
            ✅ I Agree & Continue
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConsentPage;
