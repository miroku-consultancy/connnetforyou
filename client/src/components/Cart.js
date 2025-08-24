import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import './Cart.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com'; // or use env

const Cart = () => {
  const { cart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { shopSlug } = useParams();

  const getSafeShopSlug = (slug) =>
    !slug || slug === 'undefined' || slug === 'null' ? null : slug;

  const safeShopSlug =
    getSafeShopSlug(shopSlug) ||
    (() => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0] : null;
    })();

  const items = Object.values(cart);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1350);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  if (!visible || items.length === 0) return null;

  const parseImages = (imageField) => {
    if (!imageField) return [];
    if (Array.isArray(imageField)) return imageField;

    try {
      const parsed = JSON.parse(imageField);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      try {
        const cleaned = imageField.trim().replace(/^["']|["']$/g, '');
        const parsedAgain = JSON.parse(cleaned);
        if (Array.isArray(parsedAgain)) return parsedAgain;
        return [parsedAgain];
      } catch {
        return [imageField];
      }
    }
  };

  const resolveImageUrl = (image) => {
    if (!image) return '';
    if (!image.startsWith('/') && !image.startsWith('http')) {
      image = `/uploads/${image}`;
    }
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads/')) {
      return `${API_BASE_URL}${image}`;
    }
    if (image.startsWith('/images/')) {
      return image;
    }
    return image;
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-popup" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        className="close-btn"
        aria-label="Close cart popup"
        onClick={() => setVisible(false)}
      >
        &times;
      </button>
      <h2>Your Cart</h2>
      <ul className="cart-list">
        {items.map((item) => {
          const images = parseImages(item.image);
          const displayImage = images[0] || '';
          const imageSrc = resolveImageUrl(displayImage);

          return (
            <li key={item.id} className="cart-item">
              <img
                src={imageSrc}
                alt={item.name}
                className="cart-item-image"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'cover',
                  marginRight: '10px',
                }}
              />
              <div style={{ flex: 1 }}>
                <div className="item-name-with-unit">
                  <strong>{item.name}</strong>
                  {(item.unit || item.size || item.color) && (
                    <span className="unit-tag">
                      {' '}
                      ({[item.size, item.color, item.unit].filter(Boolean).join(', ')})
                    </span>
                  )}
                </div>
                ₹{item.price} × {item.quantity}
              </div>

              <div className="cart-controls">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  −
                </button>
                <span aria-live="polite" aria-atomic="true">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <h3>Total: ₹{total.toFixed(2)}</h3>

      <button
        className="proceed-btn"
        onClick={() => {
          if (safeShopSlug) {
            navigate(`/${safeShopSlug}/order`);
          } else {
           // alert('Invalid shop URL');
          }
        }}
      >
        Proceed to Order
      </button>
    </div>
  );
};

export default Cart;
