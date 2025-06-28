// import React, { useEffect, useRef } from 'react';
// import { Html5Qrcode } from 'html5-qrcode';

// const QrScannerComponent = ({ onScan, onError }) => {
//   const scannerRef = useRef(null);

//   useEffect(() => {
//     const html5Qr = new Html5Qrcode(scannerRef.current.id);
//     html5Qr.start(
//       { facingMode: "environment" },
//       { fps: 10 },
//       (decodedText) => {
//         onScan(decodedText);
//         html5Qr.stop().catch(console.error);
//       },
//       (err) => onError(err)
//     ).catch(onError);

//     return () => html5Qr.stop().catch(() => {});
//   }, [onScan, onError]);

//   return <div id="qr-scanner" ref={scannerRef} style={{ width: '100%', maxWidth: '400px' }} />;
// };

// export default QrScannerComponent;
