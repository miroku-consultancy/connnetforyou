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

  // ✅ Format INR currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('authToken');
      console.log('token', token);
      if (!token) {
  console.error('No token found');
  navigate('/');
  return;
}

      try {
        const response = await fetch('https://connnet4you-server.onrender.com/api/orders/user', {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` }
});


 console.log('response', response);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          }
          throw new Error(`Failed to fetch order history: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Order history data:', data);
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
    return <div className="no-orders">You haven't placed any orders yet.</div>;
  }

  return (
    <section className="order-history-page">
      <h2>Your Order History 📜</h2>
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
          <ul>
            {order.items.map((item) => (
              <li key={item.product_id}>
                {item.name} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
              </li>
            ))}
          </ul>
          <p><strong>Total:</strong> {formatCurrency(order.total)}</p>
        </div>
      ))}
    </section>
  );
};

export default OrderHistory;
