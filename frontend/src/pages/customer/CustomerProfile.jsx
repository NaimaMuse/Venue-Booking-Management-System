import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import AvatarCropModal from '../../components/AvatarCropModal';
import {
  formatDate,
  getAvatarUrl,
  getInitials,
  getUser,
  updateStoredUser,
} from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

function CustomerProfile() {
  const fileInputRef = useRef(null);
  const storedUser = getUser();
  const [form, setForm] = useState({
    fullName: storedUser?.fullName || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    password: '',
  });
  const [memberSince, setMemberSince] = useState(storedUser?.createdAt || '');
  const [avatarPreview, setAvatarPreview] = useState(
    getAvatarUrl(storedUser?.avatarUrl)
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/auth/me');
        const user = data.user;
        setForm({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          password: '',
        });
        setMemberSince(user.createdAt || '');
        setAvatarPreview(getAvatarUrl(user.avatarUrl));
        updateStoredUser({
          id: user._id || user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      } catch (err) {
        setError(getApiError(err, 'Unable to load profile'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropOpen(true);
    setSuccess('');
    setError('');
    event.target.value = '';
  };

  const handleCropCancel = () => {
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
    }
    setRawImageSrc('');
    setCropOpen(false);
  };

  const handleCropComplete = ({ file, previewUrl }) => {
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
    }
    setRawImageSrc('');
    setCropOpen(false);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }

    try {
      setSaving(true);

      const body = new FormData();
      body.append('fullName', form.fullName.trim());
      body.append('email', form.email.trim());
      body.append('phone', form.phone.trim());
      if (form.password.trim()) {
        body.append('password', form.password.trim());
      }
      if (avatarFile) {
        body.append('avatar', avatarFile);
      }

      const { data } = await api.put('/api/auth/profile', body);

      updateStoredUser(data.user);
      setAvatarPreview(getAvatarUrl(data.user.avatarUrl));
      setAvatarFile(null);
      setMemberSince(data.user.createdAt || memberSince);
      setForm((prev) => ({ ...prev, password: '' }));
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(getApiError(err, 'Unable to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(form.fullName);
  const displayName = form.fullName.trim() || 'Your name';

  return (
    <div className="customer-page customer-profile-page">
      <section className="customer-page-header customer-profile-hero">
        <div>
          <p className="customer-eyebrow">Hargeisa Hall Finder</p>
          <h1>My Profile</h1>
          <p>keep your account details and photo ready for booking visits.</p>
        </div>
        <Link to="/customer/my-bookings" className="customer-gold-btn">
          My Bookings
        </Link>
      </section>

      {loading && <p className="customer-status">Loading profile...</p>}

      {!loading && (
        <div className="customer-profile-layout">
          <section className="customer-panel customer-profile-form-panel">
            <div className="customer-panel-head">
              <h2>Account details</h2>
            </div>

            <form className="profile-form customer-profile-form" onSubmit={handleSubmit}>
              <div className="customer-profile-photo">
                <div className="customer-profile-avatar">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="customer-profile-photo-meta">
                  <p className="customer-profile-photo-kicker">Profile photo</p>
                  <h3>{displayName}</h3>
                  <div className="customer-profile-photo-actions">
                   <button type="button"
                      className="profile-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                        CHANGE PHOTO

                   </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </div>
                  <p className="profile-upload-hint">
                   DRAG & DROP OR CLICK TO UPLOAD A NEW PHOTO. JPG, PNG, WEBP UP TO 5MB.
                  </p>
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}
              {success && <p className="profile-success">{success}</p>}

              <div className="customer-profile-grid">
                <label className="customer-profile-full">
                  Full Name
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+252..."
                  />
                </label>

                <label className="customer-profile-full">
                  New Password
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
                    minLength={6}
                  />
                </label>
              </div>

              <div className="customer-profile-actions">
                <button
                  type="submit"
                  className="customer-gold-btn profile-save-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          <aside className="customer-panel customer-profile-summary">
            <div className="customer-panel-head">
              <h2>Profile Summaryy</h2>
            </div>

            <div className="customer-profile-summary-card">
              <div className="customer-profile-summary-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <p className="customer-profile-summary-kicker">Customer</p>
              <h3>{displayName}</h3>
              <p>{form.email.trim() || 'Email not set'}</p>
            </div>

            <ul className="customer-profile-summary-list">
              <li>
                <span>Phone</span>
                <strong>{form.phone.trim() || '—'}</strong>
              </li>
              <li>
                <span>Member since</span>
                <strong>{formatDate(memberSince)}</strong>
              </li>
              <li>
                <span>Role</span>
                <strong>Customer</strong>
              </li>
            </ul>
          </aside>
        </div>
      )}

      {cropOpen && rawImageSrc && (
        <AvatarCropModal
          imageSrc={rawImageSrc}
          onCancel={handleCropCancel}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

export default CustomerProfile;
