// src/components/ProfileRedirect.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const ProfileRedirect = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.shopSlug) {
      navigate(`/${user.shopSlug}/profile`, { replace: true });
    } else {
      // Fallback if shopSlug is missing
      alert('⚠️ Unable to find your shop. Please try again later.');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return null; // no UI needed
};

export default ProfileRedirect;
