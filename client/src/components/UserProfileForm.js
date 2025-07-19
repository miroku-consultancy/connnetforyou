import React, { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { useNavigate, useParams } from 'react-router-dom'; // import useParams
import './UserProfileForm.css';

const UserProfileForm = () => {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  const { shopSlug } = useParams(); // get shopSlug from URL params
  const navigationHandled = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    image: null,
    preview: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        image: null,
        preview: user.profileImage
          ? `https://connnet4you-server.onrender.com${user.profileImage}`
          : '',
      });
    }
  }, [user]);

  useEffect(() => {
    window.history.replaceState({ fromProfileForm: true }, '');

    const onPopState = (e) => {
      if (e.state?.fromProfileForm && !navigationHandled.current) {
        navigationHandled.current = true;
        navigate(`/${shopSlug}/products`, { replace: true }); // Redirect to products page with shopSlug
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigate, shopSlug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('mobile', formData.mobile);
    if (formData.image) {
      data.append('profileImage', formData.image);
    }

    try {
      const res = await fetch('https://connnet4you-server.onrender.com/api/users/update-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: data,
      });

      if (res.ok) {
        alert('✅ Profile updated successfully');
        await refreshUser();
        navigate(`/${shopSlug}/products`); // Redirect after success with shopSlug
      } else {
        const error = await res.json();
        alert('❌ ' + (error.message || 'Failed to update profile'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Network error');
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h2>👤 Update Profile</h2>

      <div className="form-group">
        <label>Name</label>
        <input name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Mobile</label>
        <input name="mobile" type="tel" value={formData.mobile} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Profile Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {formData.preview && (
          <div className="image-preview">
            <img src={formData.preview} alt="Profile preview" />
          </div>
        )}
      </div>

      <button type="submit">💾 Save Changes</button>
    </form>
  );
};

export default UserProfileForm;
