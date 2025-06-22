import React, { useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import './OrderHistory.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const OrderHistory = () => {
  const { user, loadingUser } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found');
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
          throw new Error(`Failed to fetch order history: ${response.statusText}`);
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching order history:', err);
        setError('Failed to load order history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  if (loadingUser || loading) {
    return <div className="loading">Loading your order history...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

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

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Date:</strong> {new Date(order.order_date).toLocaleString()}</p>

          <ul className="order-items">
            {order.items.map((item) => {
              const imageSrc = item.image_url
                ? item.image_url.startsWith('/')
                  ? `${API_BASE_URL}${item.image_url}`
                  : item.image_url
                : 'https://via.placeholder.com/60';

              return (
                <li key={item.product_id} className="order-item">
                  <img
                    src={imageSrc}
                    alt={item.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/60';
                    }}
                  />
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty-price">
                      {item.quantity} × {formatCurrency(item.price)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p><strong>Total:</strong> {formatCurrency(order.total)}</p>
        </div>
      ))}
    </section>
  );
};

export default OrderHistory;
