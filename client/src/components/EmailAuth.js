import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmailAuth = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage('OTP sent to your email!');
        setOtpSent(true);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setMessage('Error sending OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        setMessage('✅ Verified successfully!');
        // Redirect to products page after a short delay so user can see the message
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setMessage('Error verifying OTP');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '1rem' }}>
      <h2>Email OTP Authentication</h2>

      {!otpSent ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <button onClick={sendOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <p>OTP sent to {email}</p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}

      {message && <p style={{ marginTop: '10px', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};

export default EmailAuth;
