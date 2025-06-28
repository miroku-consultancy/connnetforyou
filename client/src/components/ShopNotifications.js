import React, { useEffect, useState } from 'react';

const ShopNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
const API_BASE = 'https://connnet4you-server.onrender.com'; // Or use an environment variable
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found. User may not be logged in.');
        return;
      }

      try {
          const response = await fetch(`${API_BASE}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('Fetch failed:', text);
          throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error('Notification fetch error:', err.message);
        setError('Failed to load notifications');
      }
    };

    fetchNotifications();
  }, []);

  if (error) return <div className="error">{error}</div>;

  return (
    <section className="shop-notifications">
      <h2>📢 Shop Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.map((note) => (
            <li key={note.id}>
              <p>{note.message}</p>
              <small>{new Date(note.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ShopNotifications;
