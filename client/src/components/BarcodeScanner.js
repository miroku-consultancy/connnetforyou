// BarcodeScanner.js
import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear();
      },
      (error) => {
        console.warn('Scan error:', error);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error('Clear error:', err));
    };
  }, [onScanSuccess]);

  return <div id="reader" style={{ width: '100%' }} />;
};

export default BarcodeScanner;
