import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useCart } from './CartContext';
import { useUser } from './UserContext';
import './OrderSummary.css';

const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { shopSlug } = useParams();
  const { clearCart } = useCart();
  const navigationHandled = useRef(false);
  const { user } = useUser(); // Get current user

  useEffect(() => {
    if (searchParams.get('success')) {
      alert('✅ Payment successful! Thank you for your order.');
    } else if (searchParams.get('canceled')) {
      alert('❌ Payment was canceled. You can try again.');
    }

    const saved = localStorage.getItem('orderSummary');
    if (saved) {
      try {
        const parsedOrder = JSON.parse(saved);
        console.log('Loaded order from localStorage:', parsedOrder);
        setOrder(parsedOrder);
      } catch (err) {
        console.error('Error parsing orderSummary from localStorage:', err);
      }
    }

    window.history.replaceState({ fromSummary: true }, '');

    const onPopState = (e) => {
      if (e.state?.fromSummary && !navigationHandled.current) {
        navigationHandled.current = true;
        clearCart();
        navigate(`/${shopSlug}/products`, { replace: true });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [searchParams, clearCart, navigate, shopSlug]);

  const handleGoToProducts = () => {
    clearCart();
    navigate(`/${shopSlug}/products`);
  };

  if (!order) {
    return <div style={{ padding: '2rem' }}>Loading summary...</div>;
  }

  // Defensive helper for orderId display
  const getOrderIdDisplay = () => {
    if (!order.orderId) return null;

    // order.orderId might be object or primitive
    if (typeof order.orderId === 'object' && order.orderId !== null) {
      // Example: { orderId: 5, orderNumber: 1 }
      return order.orderId.orderId ?? JSON.stringify(order.orderId);
    }
    // If primitive (string or number)
    return order.orderId;
  };

  // Defensive helper for item price and quantity (ensure numbers)
  const getItemPrice = (item) => {
    // if item.price is string, parseFloat to number; else use as is
    if (typeof item.price === 'string') {
      const p = parseFloat(item.price);
      return isNaN(p) ? 0 : p;
    }
    if (typeof item.price === 'number') return item.price;
    return 0;
  };

  const getItemQuantity = (item) => {
    if (typeof item.quantity === 'string') {
      const q = parseInt(item.quantity, 10);
      return isNaN(q) ? 0 : q;
    }
    if (typeof item.quantity === 'number') return item.quantity;
    return 0;
  };

  return (
    <div className="order-summary">
      <h1>Order Summary</h1>
      
      {order.shop_name && (
        <h3>
          Shop: <span>{order.shop_name}</span>
        </h3>
      )}
      {order.orderId && (
        <h4>
          Order ID: <span>{getOrderIdDisplay()}</span>
        </h4>
      )}

      <h3>
        Ordered On:{' '}
        <span>{new Date(order.orderDate).toLocaleString()}</span>
      </h3>

      <ul className="order-items">
        {order.items.map((item) => {
          const price = getItemPrice(item);
          const quantity = getItemQuantity(item);
          return (
            <li
              key={item.product_id || item.id}
              className="order-summary-item"
            >
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
                <strong>{item.name}</strong>
                <br />
                Qty: {quantity} × ₹{price.toFixed(2)}
                <br />
                Total: ₹{(quantity * price).toFixed(2)}
              </div>
            </li>
          );
        })}
      </ul>

      <h3>Total Amount: ₹{Number(order.total).toFixed(2)}</h3>
      <h4>
        Payment Method:{' '}
        <span>
          {order.paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : 'Online Payment'}
        </span>
      </h4>

      <div className="summary-address">
        <h4>Delivering To:</h4>
        <p>
          {order.address.name}
          <br />
          {order.address.street}
          <br />
          {order.address.city} – {order.address.zip}
          <br />
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
