import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScannerComponent = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scannerRef.current) return;

    const html5Qr = new Html5Qrcode(scannerRef.current.id);
    html5Qr
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          onScan(decodedText);
          setLoading(false);
          html5Qr.stop().catch(console.error);
        },
        (error) => {
          onError && onError(error);
        }
      )
      .catch((err) => {
        onError && onError(err);
      });

    return () => {
      html5Qr.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <div id="qr-scanner" ref={scannerRef} style={{ width: '100%' }} />
      {loading && <p>🔍 Initializing scanner... please allow camera.</p>}
    </div>
  );
};

export default QrScannerComponent;
