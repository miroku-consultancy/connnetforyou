// pages/TermsOfServicePage.js
import React from 'react';
import './TermsOfServicePage.css';

const TermsOfServicePage = () => {
  return (
    <div className="terms-page">
      <header className="terms-hero">
        <div className="terms-overlay">
          <h1>Terms of Service</h1>
          <p>Understand the rules before using our platform.</p>
        </div>
      </header>

      <section className="terms-content">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using our services, you agree to be bound by these Terms of Service
          and all applicable laws and regulations. If you do not agree, you are prohibited from
          using or accessing the platform.
        </p>

        <h2>2. Use of the Service</h2>
        <p>
          You agree to use the service only for lawful purposes. You are responsible for
          maintaining the confidentiality of your account and password and for all activities
          under your account.
        </p>

        <h2>3. User Conduct</h2>
        <ul>
          <li>No abuse, harassment, or harmful behavior toward others.</li>
          <li>No uploading or sharing of illegal, harmful, or inappropriate content.</li>
          <li>No attempts to reverse engineer or disrupt the platform.</li>
        </ul>

        <h2>4. Payments and Subscriptions</h2>
        <p>
          If you purchase any paid features or subscriptions, you agree to our pricing and
          billing terms. All fees are non-refundable unless required by law.
        </p>

        <h2>5. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to the service at any time
          if you violate these terms or engage in suspicious activity.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content, trademarks, software, and services are the property of our platform or
          its licensors. You may not copy, modify, or distribute any part without written
          consent.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          We are not liable for any indirect, incidental, or consequential damages arising out
          of your use or inability to use the platform.
        </p>

        <h2>8. Modifications to Terms</h2>
        <p>
          We may revise these terms at any time. Continued use of the platform after updates
          constitutes your acceptance of the new terms.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These terms are governed by and construed under the laws of [Your Country/State]. Any
          disputes shall be handled in the courts of that jurisdiction.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, reach out at:{' '}
          <a href="mailto:support@yourapp.com">support@yourapp.com</a>
        </p>
      </section>
    </div>
  );
};

export default TermsOfServicePage;
