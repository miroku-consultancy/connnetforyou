import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

// Helper to decode JWT token payload
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const ShopOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopOrders = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token. Please log in.');
        setLoading(false);
        return;
      }

      const decoded = parseJwt(token);
      const shopId = decoded?.shop_id;

      if (!shopId) {
        setError('Shop ID missing in your account.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please log in again.');
        } else if (res.status === 404) {
          setError('No orders found for this shop.');
        } else if (!res.ok) {
          setError('Error fetching shop orders.');
        } else {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        setError('Network error, please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShopOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (orders.length === 0) return <p>No orders yet for your shop.</p>;

  return (
    <div>
      <h2>Shop Order History</h2>
      {orders.map((order) => (
        <div key={order.id} style={{ border: '1px solid #ccc', marginBottom: 20, padding: 10 }}>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
          <p><strong>Payment:</strong> {order.payment_method}</p>
          <p><strong>Total:</strong> ₹{order.total}</p>
          <ul>
            {order.items.map(item => (
              <li key={item.product_id}>
                {item.quantity} × {item.name} @ ₹{item.price} each
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ShopOrderHistory;
