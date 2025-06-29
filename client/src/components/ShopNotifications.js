// ShopNotifications.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const API_BASE = 'https://connnet4you-server.onrender.com';

const ShopNotifications = () => {
  const { user, loadingUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        console.log('🔍 Notification response:', text);

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
          console.error('❌ JSON parse error:', parseError.message);
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

    // Request permission for browser notifications if not already granted or denied
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Browser notifications permission granted');
        }
      });
    }

    // SSE connection
    const sseUrl = `${API_BASE}/api/notifications/stream?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: data.message,
            icon: '/favicon.ico', // optional icon path
          });
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
  }, [loadingUser, user, navigate]);

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
