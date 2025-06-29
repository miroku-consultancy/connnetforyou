import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const shops = [
  "Kanji-Sweets",
  "SanjayVegStore",
  "Ganga-Medical-hall",
  "ALNazeerMuradabadiChickenBIryani",
  "Janta7DaysChineseFastFood"
];

const baseUrl = "https://www.connectfree4u.com/#/";

// Function to remove hyphens and maybe add spaces for display
// Replace hyphens with spaces AND split camelCase words with spaces
const displayName = (shop) => 
  shop
    .replace(/-/g, ' ')                            // replace hyphens with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2');         // insert space before uppercase letter preceded by lowercase


const ShopQRCodes = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',  // vertical layout
        alignItems: 'center',
        gap: '30px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        minHeight: '100vh',
      }}
    >
      {shops.map(shop => {
        const url = `${baseUrl}${shop}/login`;
        return (
          <div
            key={shop}
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              width: '220px',
              textAlign: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <h3 style={{ marginBottom: '15px', color: '#333', fontFamily: 'Arial, sans-serif' }}>
              {displayName(shop)}
            </h3>
            <QRCodeCanvas value={url} size={180} bgColor="#ffffff" fgColor="#2d3436" />
            <p
              style={{
                marginTop: '15px',
                fontSize: '12px',
                color: '#555',
                wordWrap: 'break-word',
                fontFamily: 'monospace',
                userSelect: 'text',
              }}
              title={url}
            >
              {url}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ShopQRCodes;
