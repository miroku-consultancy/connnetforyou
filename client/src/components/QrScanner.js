// src/components/QrScanner.js
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [html5QrCode, setHtml5QrCode] = useState(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const config = { fps: 10, qrbox: 250 };

    const qrCodeScanner = new Html5Qrcode(scannerRef.current.id);
    setHtml5QrCode(qrCodeScanner);

    qrCodeScanner.start(
      { facingMode: "environment" },
      config,
      (decodedText, decodedResult) => {
        onScan(decodedText);
        setLoading(false);
        qrCodeScanner.stop(); // stop scanning after first scan
      },
      (errorMessage) => {
        // optionally handle scan errors here
        if(onError) onError(errorMessage);
      }
    ).catch((err) => {
      if(onError) onError(err);
    });

    return () => {
      qrCodeScanner.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: 'auto' }}>
      <div id="qr-scanner" ref={scannerRef} style={{ width: '100%' }} />
      {loading && <p>Initializing scanner... please allow camera access</p>}
    </div>
  );
};

export default QrScanner;
