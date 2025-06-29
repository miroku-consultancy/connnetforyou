import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from './UserContext';

const API_BASE = 'https://connnet4you-server.onrender.com';

const ShopNotifications = () => {
  const { user, loadingUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { shopSlug } = useParams();

  useEffect(() => {
    if (loadingUser) return;

    const token = localStorage.getItem('authToken');
    if (!token || !user || !user.shop_id) {
      console.warn('⛔ No valid user or token. Redirecting...');
      navigate('/');
      return;
    }

    const fetchInitialNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await response.text();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          }
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        try {
          const data = JSON.parse(text);
          setNotifications(data);
        } catch (parseError) {
          throw new Error('Invalid JSON received from server');
        }
      } catch (err) {
        console.error('⚠️ Notification fetch error:', err.message);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialNotifications();

    // Ask for browser notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const sseUrl = `${API_BASE}/api/notifications/stream?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev]);

        const userName = data.user_name || 'A user';
        const address = data.address ? ` at ${data.address}` : '';
        const message = `${userName} has placed an order${address}.`;

        if (Notification.permission === 'granted') {
          const notification = new Notification('🛒 New Order Received', {
            body: message,
            icon: '/favicon.ico',
          });

          notification.onclick = () => {
            window.focus();
            const targetSlug = shopSlug || user.shop_slug || 'your-shop';
            window.location.href = `/#/${targetSlug}/shop-orders`;
          };
        }
      } catch (err) {
        console.error('❌ Error parsing SSE message:', err.message);
      }
    };

    eventSource.onerror = (err) => {
      console.error('📡 SSE connection error:', err);
      eventSource.close();
      setError('Live connection lost. Please refresh.');
    };

    return () => {
      eventSource.close();
    };
  }, [loadingUser, user, navigate, shopSlug]);

  if (loadingUser || loading) return <div>Loading notifications...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <section className="shop-notifications">
      <h2>📢 Shop Notifications (Live)</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.map((note, idx) => (
            <li key={note.id || idx}>
              <p>{note.message}</p>
              <small>
                {note.created_at
                  ? new Date(note.created_at).toLocaleString()
                  : new Date().toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ShopNotifications;
