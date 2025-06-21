import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './EmailTokenLogin.css'; // your CSS file

const EmailTokenLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          navigate('/products');
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
        }
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
      }
    }
  }, [navigate]);

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://connnet4you-server.onrender.com/api/auth/send-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ OTP sent to your email!');
        setStep(2);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://connnet4you-server.onrender.com/api/auth/login-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        toast.success('🎉 Login successful!');
        navigate('/products');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="email-login-container">
      <div className="email-login-box">
        <h2>{step === 1 ? '🔐 Secure Login' : '📩 Verify OTP'}</h2>

        {step === 1 ? (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="login-input"
            />
            <button onClick={sendOtp} disabled={loading || !email} className="login-btn">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
              className="login-input"
            />
            <button onClick={verifyOtp} disabled={loading || !otp} className="login-btn">
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <p className="resend-text">
              Didn't get OTP?{' '}
              <button
                className="resend-link"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Resend
              </button>
            </p>
          </>
        )}
      </div>

      {/* Toast container to show toasts */}
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default EmailTokenLogin;
