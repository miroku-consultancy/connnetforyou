import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const shops = [
  "Kanji-Sweets",
  "SanjayVegStore",
  "Ganga-Medical-hall"
];

const baseUrl = "https://www.connectfree4u.com/#/";

const ShopQRCodes = () => {
  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      {shops.map(shop => {
        const url = `${baseUrl}${shop}/login`;
        return (
          <div key={shop} style={{ textAlign: 'center' }}>
            <h3>{shop}</h3>
            <QRCodeCanvas value={url} size={150} />
            {/* <p style={{ maxWidth: 150, wordWrap: 'break-word' }}>{url}</p> */}
          </div>
        );
      })}
    </div>
  );
};

export default ShopQRCodes;
