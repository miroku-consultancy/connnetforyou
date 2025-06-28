import React, { useEffect, useState } from 'react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found. User may not be logged in.');
        return;
      }

      try {
        const response = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('Fetch failed:', text);
          throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('data',data)
        setNotifications(data);
      } catch (err) {
        console.error('Notification fetch error:', err.message);
        setError('Failed to load notifications');
      }
    };

    fetchNotifications();
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Notifications</h2>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>{n.message} - {new Date(n.created_at).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
