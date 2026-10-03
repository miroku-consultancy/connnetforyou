import { secondaryApiUrl } from '../config/apiConfig';

export const switchShop = async (shopId) => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(
    `${secondaryApiUrl}/api/shops/switch-shop`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shop_id: shopId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to switch shop');
  }

  localStorage.setItem('authToken', data.token);

  return data;
};