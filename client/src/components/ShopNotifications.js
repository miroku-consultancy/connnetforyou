import React, { useEffect, useState } from 'react';

const ShopNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const API_BASE = 'https://connnet4you-server.onrender.com'; // consider using env vars

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const shopId = localStorage.getItem('shopId'); // must be stored during login

    if (!token || !shopId) {
      console.warn('Missing auth token or shop ID');
      return;
    }

    // 1. Initial fetch of past notifications
    const fetchInitial = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/notifications/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Initial fetch failed: ${response.status}`);
        }

        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error('Initial fetch error:', err.message);
        setError('Failed to load notifications');
      }
    };

    fetchInitial();

    // 2. Open SSE connection for real-time updates
    const eventSource = new EventSource(
      `${API_BASE}/api/notifications/subscribe?shopId=${shopId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications((prev) => [data, ...prev]);
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE error:', err);
      eventSource.close();
      setError('Connection to live updates lost');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (error) return <div className="error">{error}</div>;

  return (
    <section className="shop-notifications">
      <h2>📢 Shop Notifications (Live)</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.map((note, index) => (
            <li key={note.id || index}>
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
