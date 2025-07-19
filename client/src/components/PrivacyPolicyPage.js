// pages/PrivacyPolicyPage.js
import React from 'react';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-page">
      <header className="privacy-hero">
        <div className="privacy-overlay">
          <h1>Privacy Policy</h1>
          <p>Your data. Your trust. Our responsibility.</p>
        </div>
      </header>

      <section className="privacy-content">
        <h2>Introduction</h2>
        <p>
          We are committed to protecting your privacy. This policy outlines how we collect,
          use, store, and safeguard your personal information on our platform.
        </p>

        <h2>What Information We Collect</h2>
        <ul>
          <li>Personal Information: Name, email, phone number, address.</li>
          <li>Usage Data: Pages visited, time spent, clicks, and session logs.</li>
          <li>Device Info: IP address, browser, OS, device type.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To deliver and improve our services.</li>
          <li>To provide customer support.</li>
          <li>To process transactions securely.</li>
          <li>To send updates, offers, or system messages (only with your consent).</li>
        </ul>

        <h2>Cookies & Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your experience. You
          can manage cookie preferences through your browser settings.
        </p>

        <h2>Your Consent</h2>
        <p>
          By using our services, you consent to our collection and use of your information as
          described in this Privacy Policy. You may withdraw consent at any time by
          contacting us.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We may use third-party services (e.g., payment processors, analytics tools) that
          collect data according to their own privacy policies. We ensure all providers are
          GDPR/CCPA-compliant.
        </p>

        <h2>Your Rights</h2>
        <p>
          You have the right to access, update, delete, or restrict the use of your personal
          data. Contact us at <a href="mailto:privacy@yourapp.com">privacy@yourapp.com</a> to request changes.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy occasionally. We’ll notify users of significant changes
          via email or a banner on our website.
        </p>

        <h2>Contact Us</h2>
        <p>
          For any questions or concerns about our privacy practices, please reach out to us at <a href="mailto:support@yourapp.com">support@yourapp.com</a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
