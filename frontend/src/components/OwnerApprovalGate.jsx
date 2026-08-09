import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getApiError } from '../utils/api';
import { clearAuth } from '../utils/auth';

function OwnerApprovalGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotel, setHotel] = useState(null);
  const [checking, setChecking] = useState(false);

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setChecking(true);
      }
      setError('');

      const { data } = await api.get('/api/hotels/my-hotel');
      setHotel(data.hotel || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setHotel(null);
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

  // Auto-refresh while waiting so approval unlocks the portal without re-login
  useEffect(() => {
    if (hotel?.verificationStatus === 'approved') {
      return undefined;
    }

    const timer = setInterval(() => {
      loadStatus({ silent: true });
    }, 15000);

    return () => clearInterval(timer);
  }, [hotel?.verificationStatus, loadStatus]);

  if (loading) {
    return (
      <div className="owner-waiting-screen">
        <div className="owner-waiting-card">
          <p className="customer-status">Checking approval status...</p>
        </div>
      </div>
    );
  }

  if (hotel?.verificationStatus === 'approved') {
    return children;
  }

  const isRejected = hotel?.verificationStatus === 'rejected';
  const isPending = !hotel || hotel.verificationStatus === 'pending';

  return (
    <div className="owner-waiting-screen" role="dialog" aria-modal="true">
      <div className="owner-waiting-backdrop" />
      <div className="owner-waiting-card">
        <div className="owner-waiting-icon" aria-hidden="true">
          {isRejected ? '!' : '…'}
        </div>

        <p className="owner-waiting-kicker">
          {isRejected ? 'Application rejected' : 'Waiting for approval'}
        </p>

        <h1>
          {isRejected
            ? 'Your hotel was not approved'
            : 'Waiting until you are approved'}
        </h1>

        <p className="owner-waiting-copy">
          {isRejected
            ? hotel?.rejectionReason ||
              'Please contact support or update your hotel details after talking to the admin.'
            : hotel
              ? `Your hotel “${hotel.hotelName}” is under admin review. You cannot open the owner dashboard until it is approved.`
              : 'Your owner account is waiting for hotel approval. You cannot open the owner system until an admin approves you.'}
        </p>

        {error && <p className="auth-error">{error}</p>}

        <div className="owner-waiting-actions">
          {isPending && (
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
              window.location.href = '/login';
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
