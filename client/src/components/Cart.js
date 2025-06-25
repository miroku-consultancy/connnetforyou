import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { shopSlug } = useParams(); // ✅ Grab current shopSlug

  const items = Object.values(cart);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  if (!visible || items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-popup">
      <button className="close-btn" onClick={() => setVisible(false)}>
        &times;
      </button>
      <h2>Your Cart</h2>
      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.id} className="cart-item">
            <img
              src={process.env.PUBLIC_URL + item.image}
              alt={item.name}
              className="cart-item-image"
              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
            />
            <div style={{ flex: 1 }}>
              <strong>{item.name}</strong> - ₹{item.price} × {item.quantity}
            </div>
            <div className="cart-controls">
              <button onClick={() => updateQuantity(item.id, -1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)}>+</button>
            </div>
          </li>
        ))}
      </ul>
      <h3>Total: ₹{total.toFixed(2)}</h3>

      <button
        className="proceed-btn"
        onClick={() => navigate(`/${shopSlug}/order`)} // ✅ navigate using shopSlug
      >
        Proceed to Order
      </button>
    </div>
  );
};

export default Cart;
