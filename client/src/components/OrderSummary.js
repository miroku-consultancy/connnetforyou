import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext'; // import cart context
import './OrderSummary.css';

const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart(); // using clearCart from context

  useEffect(() => {
    // Stripe redirect status alerts
    if (searchParams.get('success')) {
      alert('✅ Payment successful! Thank you for your order.');
    } else if (searchParams.get('canceled')) {
      alert('❌ Payment was canceled. You can try again.');
    }

    // Load and set order from localStorage
    const savedOrder = localStorage.getItem('orderSummary');
    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
      localStorage.removeItem('orderSummary');
    }

    // Handle browser back/forward navigation
    const handlePopState = () => {
      clearCart(); // Clear cart if user navigates away manually
      navigate('/products', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchParams, clearCart, navigate]);

  if (!order) return <div style={{ padding: '2rem' }}>Loading summary...</div>;

  return (
    <div className="order-summary">
      <h1>Order Summary</h1>

      <h3>Ordered On: <span>{new Date(order.orderDate).toLocaleString()}</span></h3>

      <ul className="order-items">
        {order.items.map(item => (
          <li key={item.id} className="order-summary-item">
            <img
              src={process.env.PUBLIC_URL + item.image}
              alt={item.name}
              className="summary-image"
            />
            <div>
              <strong>{item.name}</strong><br />
              Qty: {item.quantity} × ₹{item.price}<br />
              Total: ₹{(item.price * item.quantity).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>

      <h3>Total Amount: ₹{order.total.toFixed(2)}</h3>

      <h4>
        Payment Method: <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
      </h4>

      <div className="summary-address">
        <h4>Delivering To:</h4>
        <p>
          {order.address.name}<br />
          {order.address.street}<br />
          {order.address.city} - {order.address.zip}
        </p>
      </div>

      <button
        className="go-to-products-btn"
        onClick={() => {
          clearCart();
          navigate('/products');
        }}
      >
        🛒 Go to Products
      </button>
    </div>
  );
};

export default OrderSummary;
