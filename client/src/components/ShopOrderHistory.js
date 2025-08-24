import React, { useEffect, useState } from 'react';
import './ShopOrderHistory.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const MIN_ORDER_FOR_DELIVERY = 200;

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const STATUS_STEPS = ['Pending', 'Accepted', 'In Transit', 'Delivered'];

const STATUS_LABELS = {
  Pending: 'Pending',
  Accepted: 'Accepted',
  'In Transit': 'Order on the way',
  Delivered: 'Delivered',
};

const ShopOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

        if (!res.ok) {
          const msg = await res.text();
          setError(`Error: ${res.status} ${msg}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error('[ERROR] fetchShopOrders failed:', err);
        setError('Network error, please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShopOrders();
  }, []);

  const updateOrderStatus = async (orderId, currentStatus) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to update order status.');
      return;
    }

    const currentIndex = STATUS_STEPS.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUS_STEPS.length - 1) {
      alert('Order is already at final status.');
      return;
    }
    const nextStatus = STATUS_STEPS[currentIndex + 1];

    setUpdatingOrderId(orderId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Failed to update status: ${msg}`);
        return;
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, order_status: nextStatus } : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Network error, please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader" />
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (orders.length === 0) {
    return <p className="no-orders-message">No orders yet for your shop.</p>;
  }

  return (
    <div className="shop-order-history-container">
      <h2>Shop Order History</h2>
      {orders.map((order) => {
        const isTakeaway = Number(order.total) < MIN_ORDER_FOR_DELIVERY;

        return (
          <div
            key={order.id}
            className="order-card"
            onMouseEnter={(e) => e.currentTarget.classList.add('order-card-hover')}
            onMouseLeave={(e) => e.currentTarget.classList.remove('order-card-hover')}
          >
            <div>
              <strong>Order Number:</strong> #{order.orderNumber ?? order.id}
            </div>
            <div>
              <strong>Date:</strong> {new Date(order.order_date).toLocaleString()}
            </div>
            <div>
              <strong>Payment:</strong> {order.payment_method}
            </div>
            <div>
              <strong>Customer:</strong> {order.customer_name} ({order.customer_phone})
            </div>

            {!isTakeaway && order.address && (
              <div>
                <strong>Address:</strong> {order.address.street}, {order.address.city} - {order.address.zip}
              </div>
            )}

            <div>
              <strong>Status:</strong>{' '}
              <span
                className={`order-status order-status-${(order.order_status || 'Pending')
                  .replace(/\s+/g, '-')
                  .toLowerCase()}`}
              >
                {STATUS_LABELS[order.order_status] || 'Pending'}
              </span>
            </div>

            {order.order_status !== 'Delivered' && (
              <button
                disabled={updatingOrderId === order.id}
                onClick={() => updateOrderStatus(order.id, order.order_status || 'Pending')}
                className="update-status-btn"
                aria-label={`Update order ${order.id} status to next step`}
                title={`Mark as ${STATUS_LABELS[STATUS_STEPS[STATUS_STEPS.indexOf(order.order_status || 'Pending') + 1]]}`}
              >
                {updatingOrderId === order.id
                  ? 'Updating...'
                  : `Mark as ${STATUS_LABELS[STATUS_STEPS[STATUS_STEPS.indexOf(order.order_status || 'Pending') + 1]]}`}
              </button>
            )}

            <ul className="order-items-list">
              {order.items.map((item, index) => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 0;
                const totalPrice = price * quantity;

                const variantLabels = [
                  item.size ? (typeof item.size === 'object' ? item.size.name : item.size) : null,
                  item.color ? (typeof item.color === 'object' ? item.color.name : item.color) : null,
                  item.unit ? (typeof item.unit === 'object' ? item.unit.name : item.unit) : null,
                  item.unit_type || null,
                ].filter(Boolean).join(', ');

                return (
                  <li key={`${order.id}-${item.product_id}-${index}`} className="order-item">
                    <div>
                      {quantity} × {item.name}
                      {variantLabels && <span className="variant-label"> ({variantLabels})</span>}
                    </div>
                    <div>
                      ₹{totalPrice.toFixed(2)}{' '}
                      <span className="unit-price">(@ ₹{price.toFixed(2)} each)</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="order-total">Total: ₹{Number(order.total).toFixed(2)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ShopOrderHistory;
