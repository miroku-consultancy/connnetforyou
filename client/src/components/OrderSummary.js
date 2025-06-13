import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './OrderSummary.css';

const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Show alerts based on Stripe redirect
    if (searchParams.get('success')) {
      alert('✅ Payment successful! Thank you for your order.');
    } else if (searchParams.get('canceled')) {
      alert('❌ Payment was canceled. You can try again.');
    }

    // Load order data from localStorage
    const savedOrder = localStorage.getItem('orderSummary');
    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
      localStorage.removeItem('orderSummary'); // optional cleanup
    }
  }, [searchParams]);

  if (!order) return <div style={{ padding: '2rem' }}>Loading summary...</div>;

  return (
    <div className="order-summary">
      <h1>Order Summary</h1>

      <h3>Ordered On: <span>{order.orderDate}</span></h3>

      <ul className="order-items">
        {order.items.map(item => (
          <li key={item.id} className="order-summary-item">
            <img
              src={process.env.PUBLIC_URL + item.image}
              alt={item.name}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                marginRight: '15px',
              }}
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
    </div>
  );
};

export default OrderSummary;
