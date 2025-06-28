// QRGenerator.js
import React from 'react';
import QRCode from 'react-qr-code';

export default function QRGenerator({ url }) {
  return (
    <div style={{ background: 'white', padding: 8 }}>
      <QRCode value={url} size={128} />
    </div>
  );
}
