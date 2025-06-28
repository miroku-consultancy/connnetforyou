import React, { useEffect, useState } from 'react';

const ShopNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('/api/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error(err);
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
