import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import './OrderHistory.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const STATUS_LABELS = {
  Pending: 'Pending',
  Accepted: 'Accepted',
  'In Transit': 'Order on the way',
  Delivered: 'Delivered',
};

const MIN_ORDER_FOR_DELIVERY = 200;

// Robust image parsing for array or JSON string or single string
const parseImageList = (image) => {
  if (!image) return [];
  if (Array.isArray(image)) return image;
  try {
    const parsed = JSON.parse(image);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    try {
      const cleanImage = image.trim().replace(/^["']|["']$/g, '');
      const parsedAgain = JSON.parse(cleanImage);
      if (Array.isArray(parsedAgain)) return parsedAgain;
      return [parsedAgain];
    } catch {
      return [image];
    }
  }
};

// Resolves appropriate image URL or fallback placeholder
const resolveImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/60';
  if (image.startsWith('http') || image.startsWith('/images/')) return image;
  if (image.startsWith('/uploads/')) return `${API_BASE_URL}${image}`;
  return `${API_BASE_URL}/images/${image}`;
};

// Indian Rupee currency formatter
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

const OrderHistory = () => {
  const { user, loadingUser } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/user`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          }
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError('Failed to load order history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  if (loadingUser || loading) return <div className="loading">Loading your order history...</div>;
  if (error) return <div className="error">{error}</div>;

  if (orders.length === 0) {
    return (
      <div className="no-orders">
        You haven't placed any orders yet.
        <br />
        <button onClick={() => navigate('/')} className="home-button">
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <section className="order-history-page">
      <h2>Your Order History 📜</h2>
      {orders.map((order) => {
        const isTakeaway = Number(order.total) < MIN_ORDER_FOR_DELIVERY;
        return (
          <div key={order.id} className="order-card">
            <p>
              <strong>Order ID:</strong> {order.id}
              <br />
              <strong>Order Type:</strong> {isTakeaway ? 'Takeaway' : 'Delivery'}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span
                className={`order-status order-status-${(order.order_status || 'Pending')
                  .replace(/\s+/g, '-')
                  .toLowerCase()}`}
              >
                {STATUS_LABELS[order.order_status] || 'Pending'}
              </span>
            </p>
            <ul className="order-items">
              {order.items.map((item, index) => {
                const images = parseImageList(item.image);
                const imageSrc = resolveImageUrl(images[0] || '');

                // Prepare readable variant labels
                const variantLabels = [
                  item.size ? (typeof item.size === 'object' ? item.size.name : item.size) : null,
                  item.color ? (typeof item.color === 'object' ? item.color.name : item.color) : null,
                  item.unit ? (typeof item.unit === 'object' ? item.unit.name : item.unit) : null,
                  item.unit_type || null,
                ].filter(Boolean).join(', ');

                return (
                  <li
                    key={`${item.product_id || item.id}-${item.unit_type || ''}-${index}`}
                    className="order-item"
                  >
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="item-image"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://via.placeholder.com/60';
                      }}
                    />
                    <div className="item-details">
                      <span className="item-name">
                        {item.name}
                        {variantLabels && <span className="variant-label"> ({variantLabels})</span>}
                      </span>
                      <span className="item-qty-price">
                        {item.quantity} × {formatCurrency(item.price)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p>
              <strong>Total:</strong> {formatCurrency(order.total)}
            </p>
          </div>
        );
      })}
    </section>
  );
};

export default OrderHistory;
