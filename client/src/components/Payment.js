import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

// ✅ Use your actual Stripe public test key
const stripePromise = loadStripe('pk_test_51RXgiVRLVKTMiCsFKTmHxNGQgNr0gP18cXk20y29PMbB3s3kLm4KCmC2EFTDnmjkyJZ4wTLW8NTkbpXktlSVrrNt00dMcayt2a');

const Payment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToStripe = async () => {
      const stripe = await stripePromise;

      // ✅ Use dynamic API base URL
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

      try {
        const response = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to create Stripe session');
        }

        const session = await response.json();

        const result = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (result.error) {
          alert('Payment failed: ' + result.error.message);
          navigate('/payment');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('An error occurred during payment. Please try again.');
        navigate('/payment');
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
