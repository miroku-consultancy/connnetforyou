import React from 'react';
import './ConsentPage.css';

const ConsentPage = () => {
  return (
    <div className="consent-message">
      <p>
        📦 By continuing, you consent to the use of your contact details for essential communication related to your orders,
        including delivery updates, support, and service notifications. Your address will only be used to facilitate accurate and timely delivery.
      </p>
      <p>
        🔒 We respect your privacy. Your data is handled securely and in compliance with applicable data protection laws.
      </p>
      <p>
        Learn more in our <strong>Privacy Policy</strong> and <strong>Terms of Service</strong>.
      </p>
    </div>
  );
};

export default ConsentPage;
