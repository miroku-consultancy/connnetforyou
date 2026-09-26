const apiUrl = process.env.REACT_APP_NODE_ENV === 'production'
    ? 'https://api.mirokulanguageacademy.com/api/data'
    : 'http://localhost:5000/api/data';

// New generic API URL
export const secondaryApiUrl =
    'https://connnet4you-server.onrender.com';

export default apiUrl;