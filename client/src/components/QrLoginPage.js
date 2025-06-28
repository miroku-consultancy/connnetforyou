// src/QrLoginPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from './QrScanner'; // ✅



const QrLoginPage = () => {
  const navigate = useNavigate();

  const handleScan = (value) => {
    console.log('Scanned slug:', value);
    navigate(`/${value}/login`);
  };

  const handleError = (err) => {
    console.error('QR scan failed', err);
    alert('QR scan error. Check camera access.');
  };

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>📷 Scan Shop QR Code to Login</h2>
      <QrScanner onScan={handleScan} onError={handleError} />
    </div>
  );
};

export default QrLoginPage;
