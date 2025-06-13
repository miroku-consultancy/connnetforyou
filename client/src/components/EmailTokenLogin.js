import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmailTokenLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('OTP sent to your email!');
        setStep(2);
      } else {
        alert(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      alert('Network error');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login-with-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        alert('Login successful!');
        navigate('/products');
      } else {
        alert(data.error || 'Invalid OTP');
      }
    } catch (err) {
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      {step === 1 ? (
        <>
          <h2>Enter your Email</h2>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button onClick={sendOtp} disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <h2>Enter OTP</h2>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            placeholder="OTP"
            required
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button onClick={verifyOtp} disabled={loading || !otp}>
            {loading ? 'Verifying...' : 'Login'}
          </button>
          <p>
            Didn't get OTP? <button onClick={() => setStep(1)}>Resend</button>
          </p>
        </>
      )}
    </div>
  );
};

export default EmailTokenLogin;
