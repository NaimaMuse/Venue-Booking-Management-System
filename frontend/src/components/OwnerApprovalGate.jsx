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

  return null;
}

export default OwnerApprovalGate;