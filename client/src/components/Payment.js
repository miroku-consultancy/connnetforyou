import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RXgiVRLVKTMiCsFKTmHxNGQgNr0gP18cXk20y29PMbB3s3kLm4KCmC2EFTDnmjkyJZ4wTLW8NTkbpXktlSVrrNt00dMcayt2a');

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;
  const provider = location.state?.provider || 'stripe'; // 👈 default to stripe if not passed

  useEffect(() => {
    if (!order) {
      alert('No order details found. Please try again.');
      navigate('/order');
      return;
    }

    localStorage.setItem('orderSummary', JSON.stringify(order));

    if (provider === 'razorpay') {
      startRazorpayPayment();
    } else {
      startStripePayment();
    }
  }, [navigate, order, provider]);

  const startStripePayment = async () => {
    const stripe = await stripePromise;
    const baseUrl = 'https://connnet4you-server.onrender.com';
    const frontendUrl = window.location.origin;

    try {
      const response = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.items,
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
      console.error('Stripe payment error:', err);
      alert('An error occurred during Stripe payment. Please try again.');
      navigate('/order-summary?canceled=true');
    }
  };

  const startRazorpayPayment = async () => {
    const token = localStorage.getItem('authToken');
    const baseUrl = 'https://connnet4you-server.onrender.com';

    try {
      const res = await fetch(`${baseUrl}/api/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: order.total }),
      });

      const data = await res.json();

      const options = {
        key: 'rzp_test_V4nnUsy6IaZrw2', // 🔁 Replace with your actual Razorpay key
        amount: data.amount,
        currency: 'INR',
        name: 'ConnectFREE4U',
        description: 'Order Payment',
        order_id: data.id,
        handler: async function (response) {
          const verifyRes = await fetch(`${baseUrl}/api/razorpay/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...order,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          if (!verifyRes.ok) throw new Error('Payment verification failed');
          const result = await verifyRes.json();

          localStorage.setItem('orderSummary', JSON.stringify(result));
          navigate('/order-summary?success=true');
        },
        prefill: {
          name: order.address?.name || '',
          email: order.email || '',
          contact: order.address?.phone || '',
        },
        theme: {
          color: '#528FF0',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay payment error:', err);
      alert('An error occurred during Razorpay payment. Please try again.');
      navigate('/order-summary?canceled=true');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Redirecting to {provider === 'razorpay' ? 'Razorpay' : 'Stripe'}...</h2>
      <p>Please wait while we process your payment.</p>
    </div>
  );
};

export default Payment;
