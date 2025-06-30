import React, { useEffect, useState } from 'react';
import './ShopOrderHistory.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

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
                    setError('You are not a shop owner.');
                } else if (res.status === 404) {
                    setError('No orders found for this shop.');
                } else if (!res.ok) {
                    setError('Error fetching shop orders.');
                } else {
                    const data = await res.json();

                    // ✅ Group by order ID and fix product_name binding
                    const grouped = data.reduce((acc, row) => {
                        const orderId = row.id;

                        if (!acc[orderId]) {
                            acc[orderId] = {
                                id: orderId,
                                order_date: row.order_date,
                                payment_method: row.payment_method,
                                total: row.total,
                                customer_name: row.customer_name,
                                customer_phone: row.customer_phone,
                                items: [],
                            };
                        }

                        acc[orderId].items.push({
                            product_id: row.product_id,
                            name: row.product_name, // ✅ FIXED
                            price: row.price,
                            quantity: row.quantity,
                            unit_type: row.unit_type,
                        });

                        return acc;
                    }, {});

                    setOrders(Object.values(grouped));
                }
            } catch (err) {
                setError('Network error, please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchShopOrders();
    }, []);

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
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="order-card"
                    onMouseEnter={(e) => e.currentTarget.classList.add('order-card-hover')}
                    onMouseLeave={(e) => e.currentTarget.classList.remove('order-card-hover')}
                >
                    <div className="order-info">
                        <div><strong>Order ID:</strong> #{order.id}</div>
                        <div><strong>Date:</strong> {new Date(order.order_date).toLocaleString()}</div>
                        <div><strong>Payment:</strong> {order.payment_method}</div>
                        <div><strong>Customer:</strong> {order.customer_name} ({order.customer_phone})</div>
                    </div>

                    <ul className="order-items-list">
                        {order.items.map((item) => {
                            const price = Number(item.price) || 0;
                            const totalPrice = price * item.quantity;

                            return (
                                <li key={item.product_id} className="order-item">
                                    <div>
                                        {item.quantity} × {item.name}
                                        {item.unit_type ? ` (${item.unit_type})` : ''}
                                    </div>
                                    <div>
                                        ₹{totalPrice.toFixed(2)}{' '}
                                        <span className="unit-price">
                                            (@ ₹{price.toFixed(2)} each)
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="order-total">
                        Total: ₹{Number(order.total).toFixed(2)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ShopOrderHistory;
