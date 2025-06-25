import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useCart } from './CartContext';
import './OrderSummary.css';

const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { shopSlug } = useParams(); // ✅ Get shop slug from URL
  const { clearCart } = useCart();
  const navigationHandled = useRef(false);

  useEffect(() => {
    if (searchParams.get('success')) {
      alert('✅ Payment successful! Thank you for your order.');
    } else if (searchParams.get('canceled')) {
      alert('❌ Payment was canceled. You can try again.');
    }

    const saved = localStorage.getItem('orderSummary');
    if (saved) {
      setOrder(JSON.parse(saved));
    }

    window.history.replaceState({ fromSummary: true }, '');

    const onPopState = (e) => {
      if (e.state?.fromSummary && !navigationHandled.current) {
        navigationHandled.current = true;
        clearCart();
        navigate(`${shopSlug}/products`, { replace: true }); // ✅ Use shopSlug
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [searchParams, clearCart, navigate, shopSlug]);

  const handleGoToProducts = () => {
    clearCart();
    navigate(`${shopSlug}/products`); // ✅ Use shopSlug
  };

  if (!order) {
    return <div style={{ padding: '2rem' }}>Loading summary...</div>;
  }

  return (
    <div className="order-summary">
      <h1>Order Summary</h1>

      {order.orderId && (
        <h4>Order ID: <span>{order.orderId}</span></h4>
      )}

      <h3>Ordered On: <span>{new Date(order.orderDate).toLocaleString()}</span></h3>

      <ul className="order-items">
        {order.items.map(item => (
          <li key={item.product_id || item.id} className="order-summary-item">
            <img
              src={
                item.image.startsWith('http')
                  ? item.image
                  : process.env.PUBLIC_URL + item.image
              }
              alt={item.name}
              className="summary-image"
            />
            <div>
              <strong>{item.name}</strong><br />
              Qty: {item.quantity} × ₹{item.price}<br />
              Total: ₹{(item.quantity * item.price).toFixed(2)}
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
          {order.address.city} – {order.address.zip}<br />
          Phone: {order.address.phone}
        </p>
      </div>

      <button className="go-to-products-btn" onClick={handleGoToProducts}>
        🛒 Go to Products
      </button>
    </div>
  );
};

export default OrderSummary;
