import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const shops = [
  "ConnectFREE4U",
  "Kanji-Sweets",
  "SanjayVegStore",
  "Ganga-Medical-hall",
  "ALNazeerMuradabadiChickenBiryani",
  "Janta7DaysChineseFastFood",
  "QureshiKababCenter",
  "Vow-vista",
  "Desi-swaad",
  "Home-chef",
  "TheVegKingFastFood",
  "ZeroCollection",
  "DivineCafe&FastFood",
  "YadavTransport",
];

const baseUrl = "https://www.connectfree4u.com/#/";

const displayName = (shop) =>
  shop
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/&/g, ' & ');

const ShopQRCodes = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        padding: '30px 20px',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h1
        style={{
          fontWeight: 'bold',
          fontSize: '2.5rem',
          background: 'linear-gradient(90deg, #ff3b3b, #34d058, #3578e5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          userSelect: 'none',
          marginBottom: '20px',
        }}
      >
        ConnectFREE4U Shops
      </h1>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '25px',
        }}
      >
        {shops.map((shop) => {
          const url = shop === "ConnectFREE4U"
            ? "https://www.connectfree4u.com"
            : `${baseUrl}${shop}/products`;

          return (
            <div
              key={shop}
              style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: '220px',
                textAlign: 'center',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
            >
              <h3 style={{ marginBottom: '15px', color: '#2d3436', fontWeight: 600, textAlign: 'center' }}>
                {displayName(shop)}
              </h3>

              {/* QR Code container with improved background and padding */}
              <div
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '180px',
                  borderRadius: '25px',
                  padding: '12px',
                  background:
                    'radial-gradient(circle at center, #ffffff 60%, #d1e7ff 100%)',
                  boxShadow:
                    '0 4px 12px rgba(53, 120, 229, 0.2), inset 0 0 15px #34d058',
                  marginBottom: '25px', // More bottom margin here
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <QRCodeSVG
                  value={url}
                  size={180}
                  fgColor="url(#rgbGradient)"
                  bgColor="transparent"
                />
                {/* Gradient definition */}
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="rgbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff3b3b" />     {/* Red */}
                      <stop offset="50%" stopColor="#34d058" />    {/* Green */}
                      <stop offset="100%" stopColor="#3578e5" />   {/* Blue */}
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: '25px', // Added margin bottom for spacing
                  fontSize: '16px',
                  fontWeight: 700,
                  background:
                    'linear-gradient(90deg, #ff3b3b, #34d058, #3578e5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  userSelect: 'text',
                  letterSpacing: '0.06em',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  boxShadow:
                    '0 0 8px rgba(255, 59, 59, 0.4), 0 0 15px rgba(52, 208, 88, 0.4), 0 0 20px rgba(53, 120, 229, 0.5)',
                  transition: 'box-shadow 0.3s ease',
                  alignSelf: 'center',
                }}
                title="ConnectFREE4U"
              >
                ConnectFREE4U
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopQRCodes;
