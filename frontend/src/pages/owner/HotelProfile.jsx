import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getApiError } from '../../utils/api';

const statusLabel = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function HotelProfile() {
  const [form, setForm] = useState({
    hotelName: '',
    address: '',
    city: '',
    contactPhone: '',
    description: '',
  });
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/hotels/my-hotel');
        const nextHotel = data.hotel;
        setHotel(nextHotel);
        setForm({
          hotelName: nextHotel.hotelName || '',
          address: nextHotel.address || '',
          city: nextHotel.city || '',
          contactPhone: nextHotel.contactPhone || '',
          description: nextHotel.description || '',
        });

        if (
          nextHotel?.verificationStatus === 'approved' &&
          nextHotel.hasSeenApprovalAlert === false
        ) {
          setShowApprovalAlert(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setHotel(null);
        } else {
          setError(getApiError(err, 'Unable to load hotel profile'));
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!showApprovalAlert || !hotel?._id) {
      return undefined;
    }

    const markSeen = async () => {
      try {
        await api.patch('/api/hotels/my-hotel/approval-alert-seen');
        setHotel((prev) =>
          prev ? { ...prev, hasSeenApprovalAlert: true } : prev
        );
      } catch (err) {
        console.error(getApiError(err, 'Failed to mark approval alert seen'));
      }
    };

    const timer = setTimeout(() => {
      setShowApprovalAlert(false);
      markSeen();
    }, 5000);

    return () => clearTimeout(timer);
  }, [showApprovalAlert, hotel?._id]);

  const dismissApprovalAlert = async () => {
    setShowApprovalAlert(false);
    try {
      await api.patch('/api/hotels/my-hotel/approval-alert-seen');
      setHotel((prev) =>
        prev ? { ...prev, hasSeenApprovalAlert: true } : prev
      );
    } catch (err) {
      console.error(getApiError(err, 'Failed to mark approval alert seen'));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (
      !form.hotelName.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.contactPhone.trim()
    ) {
      setError('Hotel name, address, city, and contact phone are required.');
      return;
    }

    try {
      setSaving(true);

      const isUpdate = Boolean(hotel);
      const payload = {
        hotelName: form.hotelName.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        contactPhone: form.contactPhone.trim(),
        description: form.description.trim(),
      };

      const { data } = isUpdate
        ? await api.put('/api/hotels/my-hotel', payload)
        : await api.post('/api/hotels', payload);

      setHotel(data.hotel);
      setSuccess(
        isUpdate
          ? 'Hotel profile updated successfully.'
          : 'Hotel registered successfully and is pending approval.'
      );
    } catch (err) {
      setError(getApiError(err, 'Unable to save hotel profile'));
    } finally {
      setSaving(false);
    }
  };
  const verification = hotel?.verificationStatus;

  return (
    <div className="customer-page hotel-profile-page">
      {showApprovalAlert && (
        <div className="owner-approval-flash" role="status">
          <span>
            Congratulations! Your hotel has been approved. You can keep your
            profile details up to date anytime.
          </span>
          <button
            type="button"
            className="owner-alert-dismiss"
            onClick={dismissApprovalAlert}
            aria-label="Dismiss approval alert"
          >
            ×
          </button>
        </div>
      )}

      <section className="customer-page-header hotel-profile-hero">
        <div>
          <p className="customer-eyebrow">Hotel Profile</p>
          <h1>{form.hotelName.trim() || 'My Hotel Profile'}</h1>
          <p>
            Keep your venue details clear and current so customers can reach you
            and book with confidence.
          </p>
        </div>
        {verification && (
          <span className={`hotel-profile-status is-${verification}`}>
            {statusLabel[verification] || verification}
          </span>
        )}
      </section>

      {verification === 'pending' && (
        <div className="owner-status-banner owner-status-pending">
          Your hotel registration is under admin review. Halls stay hidden from
          the public website until approval.
        </div>
      )}

      {verification === 'rejected' && (
        <div className="owner-status-banner owner-status-rejected">
          Registration was rejected
          {hotel.rejectionReason ? `: ${hotel.rejectionReason}` : '.'} Update
          your details and contact support if needed.
        </div>
      )}

      {loading && <p className="customer-status">Loading hotel profile...</p>}

      {!loading && (
        <div className="hotel-profile-layout">
          <section className="customer-panel hotel-profile-form-panel">
            <div className="customer-panel-head">
              <h2>{hotel ? 'Edit hotel details' : 'Register your hotel'}</h2>
            </div>

            <form className="profile-form hotel-profile-form" onSubmit={handleSubmit}>
              {error && <p className="auth-error">{error}</p>}
              {success && <p className="profile-success">{success}</p>}

              <label className="hotel-profile-full">
                Hotel Name
                <input
                  type="text"
                  name="hotelName"
                  value={form.hotelName}
                  onChange={handleChange}
                  placeholder="e.g. Moole Hotel Hargeisa"
                  required
                />
              </label>

              <div className="hotel-profile-grid">
                <label>
                  City
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Hargeisa"
                    required
                  />
                </label>
                <label>
                  Contact Phone
                  <input
                    type="tel"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="+252 63 ..."
                    required
                  />
                </label>
              </div>

              <label className="hotel-profile-full">
                Address
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, district, landmark"
                  required
                />
              </label>

              <label className="hotel-profile-full">
                Description
                <textarea
                  name="description"
                  rows="5"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell customers about your venue, capacity style, and services..."
                />
              </label>

              <button
                type="submit"
                className="customer-gold-btn profile-save-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : hotel
                    ? 'Update Hotel Profile'
                    : 'Register Hotel'}
              </button>
            </form>
          </section>

          <aside className="customer-panel hotel-profile-summary">
            <div className="customer-panel-head">
              <h2>Profile summary</h2>
            </div>

            <div className="hotel-profile-summary-card">
              <p className="hotel-profile-summary-kicker">Venue</p>
              <h3>{form.hotelName.trim() || 'Your hotel name'}</h3>
              <p>{form.city.trim() || 'City not set yet'}</p>
            </div>

            <ul className="hotel-profile-summary-list">
              <li>
                <span>Address</span>
                <strong>{form.address.trim() || '—'}</strong>
              </li>
              <li>
                <span>Phone</span>
                <strong>{form.contactPhone.trim() || '—'}</strong>
              </li>
              <li>
                <span>Status</span>
                <strong>
                  {verification
                    ? statusLabel[verification] || verification
                    : 'Not registered'}
                </strong>
              </li>
            </ul>

            {hotel?._id && verification === 'approved' && (
              <Link
                to={`/hotels/${hotel._id}`}
                className="owner-schedule-btn hotel-profile-public-link"
                target="_blank"
                rel="noreferrer"
              >
                View public hotel page
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default HotelProfile;

