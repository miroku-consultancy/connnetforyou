import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { useUser } from './UserContext';
import ConsentPage from './ConsentPage';
import './EmailTokenLogin.css';

const EmailTokenLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const navigate = useNavigate();
  const { shopSlug } = useParams();
  const { refreshUser } = useUser();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Inside your EmailTokenLogin.js after login success:
          const params = new URLSearchParams(window.location.search);
          const redirectPath = params.get('redirect') || `/${shopSlug}${shopSlug === 'ConnectFREE4U' ? '/dashboard' : '/products'}`;
          navigate(redirectPath);

        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
        }
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
      }
    }
  }, [navigate, shopSlug]);

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://connnet4you-server.onrender.com/api/auth/send-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, shop_slug: shopSlug }),
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
        body: JSON.stringify({ email, token: otp, shop_slug: shopSlug }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('authToken', data.token);          // access token
        localStorage.setItem('refreshToken', data.refreshToken); // refresh token ✅
        localStorage.setItem('userId', data.user.id);
        refreshUser();
        toast.success('🎉 Login successful!');
        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get('redirect') || (shopSlug === 'ConnectFREE4U' ? '/dashboard' : '/order');
        navigate(`/${shopSlug}${redirectPath}`);

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
              <button className="resend-link" onClick={() => setStep(1)} disabled={loading}>
                Resend
              </button>
            </p>

            {!showConsent && (
              <div style={{ marginTop: '20px' }}>
                <button
                  className="terms-link"
                  onClick={() => setShowConsent(true)}
                >
                  📄 View Terms and Conditions
                </button>
              </div>
            )}

            {showConsent && <ConsentPage />}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailTokenLogin;
