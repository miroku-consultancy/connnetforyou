import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext'; // your user context hook

const API_BASE = 'https://connnet4you-server.onrender.com';

const ShopNotifications = () => {
  const { user, loadingUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (loadingUser) return; // wait for user info

    if (!user || !user.shop_id) {
      // No user or shop_id, redirect to home or login page
      navigate('/');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return;
    }

    // Fetch past notifications
    const fetchInitialNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          }
          throw new Error(`Failed to fetch notifications: ${res.statusText}`);
        }

        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialNotifications();

    // Open SSE connection, pass token and shop_id as query params
    const eventSource = new EventSource(`${API_BASE}/api/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications((prev) => [data, ...prev]);
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setError('Lost connection to live notifications');
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
