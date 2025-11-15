import React, { useEffect } from "react";
import "./banner.css";

export default function Banner() {
  useEffect(() => {
    let scale = 1;
    let startDistance = 0;
    let startScale = 1;

    const getDistance = (touches) => {
      const [a, b] = touches;
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    const touchStartHandler = (e) => {
      if (e.touches.length === 2) {
        startDistance = getDistance(e.touches);
        startScale = scale;
      }
    };

    const touchMoveHandler = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const currentDistance = getDistance(e.touches);
        let pinchRatio = currentDistance / startDistance;

        scale = startScale * pinchRatio;
        if (scale < 0.3) scale = 0.3;
        if (scale > 3) scale = 3;

        document.body.style.transform = `scale(${scale})`;
      }
    };

    document.addEventListener("touchstart", touchStartHandler, { passive: false });
    document.addEventListener("touchmove", touchMoveHandler, { passive: false });

    return () => {
      document.removeEventListener("touchstart", touchStartHandler);
      document.removeEventListener("touchmove", touchMoveHandler);
    };
  }, []);

  return (
    <div className="banner">

      {/* FIXED IMAGE PATHS */}
      <img src="/images/ic_launcher_round.png" className="qr-logo" alt="Logo" />

      <h1>Digital Connect4U Solutions</h1>
      <h2>आपकी एक स्टॉप डिजिटल सेवा, प्रिंटिंग एवं ऑनलाइन सुविधा केंद्र</h2>

      <div className="left">
        <ul>
          <li>टिकट एवं प्रिंटिंग सेवाएँ</li>
          <li>ऑनलाइन फॉर्म एवं प्रमाण पत्र</li>
          <li>ड्राइविंग लाइसेंस संबंधित सेवाएँ</li>
          <li>पैन / आधार / केवाईसी अपडेट</li>
          <li>भूमि, नक्शा एवं सरकारी दस्तावेज</li>
          <li>जीएसटी, ऋण एवं बीमा सहायता</li>
          <li>फोटो कॉपी, फोटो एवं स्कैनिंग</li>
          <li>ऑनलाइन खरीद-फरोख्त एवं डिजिटल सहायता</li>
        </ul>
      </div>

      <div className="qr-section">
        <div className="qr-box">

          {/* FIXED IMAGE PATH */}
          <img src="/images/connectfree4u.JPG" className="qr-img" alt="QR Code" />

          <div className="highlight-bottom">
            अपने बिज़नेस के लिए वेबसाइट और मोबाइल ऐप बनवाएं
          </div>
          <p className="website">
            हमारी डिजिटल सेवाओं का लाभ उठाएं: <strong>ConnectFree4U</strong>
          </p>
        </div>
      </div>

      <div className="footer-box">
        <p>स्थानीय दुकानदारों, छोटे व्यापारियों और रेहड़ी-पटरी वालों को डिजिटल रूप से सशक्त बनाना</p>
        <p>तेज़, विश्वसनीय और मित्रवत सेवा प्रदान करना</p>
        <p className="footer-contact">
          संपर्क करें: <strong>9643883821, 9430475264</strong>
        </p>
      </div>
    </div>
  );
}
