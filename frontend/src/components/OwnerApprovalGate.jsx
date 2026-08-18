import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import api, { getApiError } from '../utils/api';
import { clearAuth, getUser } from '../utils/auth';

function OwnerApprovalGate({ children }) {
  const location = useLocation();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotel, setHotel] = useState(null);
  const [checking, setChecking] = useState(false);
  const [missingHotel, setMissingHotel] = useState(false);

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setChecking(true);
      }
      setError('');

      let data;
      try {
        ({ data } = await api.get('/api/hotels/my-hotel'));
      } catch (firstErr) {
        if (firstErr.response?.status === 404) {
          ({ data } = await api.get('/api/hotels/mine'));
        } else {
          throw firstErr;
        }
      }

      const nextHotel = data?.hotel || null;
      if (nextHotel?.verificationStatus) {
        nextHotel.verificationStatus = String(nextHotel.verificationStatus)
          .trim()
          .toLowerCase();
      }

      setHotel(nextHotel);
      setMissingHotel(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setHotel(null);
        setMissingHotel(true);
        setError('');
      } else {
        setError(getApiError(err, 'Unable to check approval status'));
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const status = String(hotel?.verificationStatus || '').toLowerCase();
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isPending = Boolean(hotel) && status === 'pending';

  // Auto-refresh while waiting so approval unlocks without re-login
  useEffect(() => {
    if (isApproved || missingHotel) {
      return undefined;
    }

    const timer = setInterval(() => {
      loadStatus({ silent: true });
    }, 10000);

    return () => clearInterval(timer);
  }, [isApproved, missingHotel, loadStatus]);

  // Allow hotel profile when this account has not created a hotel yet
  const onHotelProfile = location.pathname.startsWith('/owner/hotel-profile');
  if (!loading && missingHotel && onHotelProfile) {
    return children;
  }

  if (loading) {
    return (
      <div className="owner-waiting-screen">
        <div className="owner-waiting-card">
          <p className="customer-status">Checking approval status...</p>
        </div>
      </div>
    );
  }

  if (isApproved) {
    return children;
  }

  return (
    <div className="owner-waiting-screen" role="dialog" aria-modal="true">
      <div className="owner-waiting-backdrop" />
      <div className="owner-waiting-card">
        <div className="owner-waiting-icon" aria-hidden="true">
          {isRejected ? '!' : '…'}
        </div>

        <p className="owner-waiting-kicker">
          {missingHotel
            ? 'Hotel profile required'
            : isRejected
              ? 'Application rejected'
              : 'Waiting for approval'}
        </p>

        <h1>
          {missingHotel
            ? 'No hotel linked to this account'
            : isRejected
              ? 'Your hotel was not approved'
              : 'Waiting until you are approved'}
        </h1>

        <p className="owner-waiting-copy">
          {missingHotel
            ? `Signed in as ${user?.email || 'owner'}. Create your hotel profile first, or log in with the same owner account that submitted the hotel the admin approved.`
            : isRejected
              ? hotel?.rejectionReason ||
                'Please contact support or update your hotel details after talking to the admin.'
              : `Your hotel “${hotel?.hotelName || 'Hotel'}” is under admin review (status: ${status || 'pending'}). You cannot open the owner dashboard until it is approved.`}
        </p>

        {error && <p className="auth-error">{error}</p>}

        <div className="owner-waiting-actions">
          {missingHotel && (
            <Link to="/owner/hotel-profile" className="customer-gold-btn">
              Create hotel profile
            </Link>
          )}
          {(isPending || (!missingHotel && !isRejected)) && (
            <button
              type="button"
              className="customer-gold-btn"
              disabled={checking}
              onClick={() => loadStatus({ silent: true })}
            >
              {checking ? 'Checking...' : 'Refresh — am I approved yet?'}
            </button>
          )}
          <Link to="/" className="venue-back-link">
            Back to website
          </Link>
          <button
            type="button"
            className="owner-reject-btn"
            onClick={() => {
              clearAuth();
              window.location.href = '/';
            }}
          >
            Logout
          </button>
        </div>

        {isPending && (
          <p className="owner-waiting-hint">
            Stay on this page. When the admin approves your hotel, the owner
            dashboard will open automatically.
          </p>
        )}
      </div>
    </div>
  );
}

export default OwnerApprovalGate;
