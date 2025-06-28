import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const ShopOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to decode JWT token payload
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const fetchShopOrders = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No auth token, please login');
        setLoading(false);
        return;
      }

      const decoded = parseJwt(token);
      const shopId = decoded?.shop_id;

      if (!shopId) {
        setError('No shop selected');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch shop orders');

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShopOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div>
      <h2>Shop Order History</h2>
      {orders.map((order) => (
        <div key={order.id} style={{ border: '1px solid #ccc', marginBottom: 20, padding: 10 }}>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.customer_name}</p>
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
