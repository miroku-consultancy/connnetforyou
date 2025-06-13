// src/apiConfig.js

const apiUrl = process.env.REACT_APP_NODE_ENV === 'production' 
    ? 'https://api.mirokulanguageacademy.com/api/data' 
    : 'http://localhost:5000/api/data';

export default apiUrl;


// const apiUrl = process.env.REACT_APP_NODE_ENV === 'production' 
//     ? 'https://language-academy-server.onrender.com/api/data' 
//     : 'http://localhost:5000/api/data';

// export default apiUrl;
