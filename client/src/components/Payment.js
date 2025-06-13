import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RXgiVRLVKTMiCsFKTmHxNGQgNr0gP18cXk20y29PMbB3s3kLm4KCmC2EFTDnmjkyJZ4wTLW8NTkbpXktlSVrrNt00dMcayt2a'); // Use Stripe public test key

const Payment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToStripe = async () => {
      const stripe = await stripePromise;

      const response = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});


      const session = await response.json();

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        alert('Payment failed: ' + result.error.message);
        navigate('/payment'); // Optional fallback
      }
    };

    redirectToStripe();
  }, [navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Redirecting to Payment Gateway...</h2>
      <p>Please wait while we process your payment.</p>
    </div>
  );
};

export default Payment;
