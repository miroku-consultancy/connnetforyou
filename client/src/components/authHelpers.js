export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch('https://connnet4you-server.onrender.com/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.json();
    localStorage.setItem('authToken', data.token); // 🔁 Replace expired token
    return data.token;
  } catch (err) {
    console.error('Failed to refresh token:', err);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
};
