import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RXgiVRLVKTMiCsFKTmHxNGQgNr0gP18cXk20y29PMbB3s3kLm4KCmC2EFTDnmjkyJZ4wTLW8NTkbpXktlSVrrNt00dMcayt2a');

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    const redirectToStripe = async () => {
      if (!order) {
        alert('No order details found. Please try again.');
        navigate('/order');
        return;
      }

      localStorage.setItem('orderSummary', JSON.stringify(order));
      const stripe = await stripePromise;
      const baseUrl = 'https://connnet4you-server.onrender.com';
      const frontendUrl = window.location.origin;

      try {
        const response = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: order.items,  // <-- send only items, not the full order
            success_url: `${frontendUrl}/order-summary?success=true`,
            cancel_url: `${frontendUrl}/order-summary?canceled=true`,
          }),
        });

        if (!response.ok) throw new Error('Failed to create Stripe session');
        const session = await response.json();

        const result = await stripe.redirectToCheckout({ sessionId: session.id });
        if (result.error) {
          alert('Stripe error: ' + result.error.message);
          navigate('/order-summary?canceled=true');
        }
      } catch (err) {
        console.error('Payment error:', err);
        alert('An error occurred during payment. Please try again.');
        navigate('/order-summary?canceled=true');
      }
    };

    redirectToStripe();
  }, [navigate, order]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Redirecting to Payment Gateway...</h2>
      <p>Please wait while we process your payment.</p>
    </div>
  );
};

export default Payment;
