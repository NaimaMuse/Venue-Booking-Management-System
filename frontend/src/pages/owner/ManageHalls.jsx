import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

function ManageHalls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadHalls = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/halls/my-halls');
      setHalls(data.halls || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load halls'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHalls();
  }, []);

  const toggleAvailability = async (hall) => {
    try {
      setBusyId(hall._id);
      setError('');

      const body = new FormData();
      body.append('isAvailable', String(!hall.isAvailable));

      const { data } = await api.put(`/api/halls/${hall._id}`, body);

      setHalls((prev) =>
        prev.map((item) => (item._id === hall._id ? data.hall : item))
      );
    } catch (err) {
      setError(getApiError(err, 'Unable to update availability'));
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (hallId) => {
    const confirmed = window.confirm(
      'Delete this hall? This action cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    try {
      setBusyId(hallId);
      setError('');

      await api.delete(`/api/halls/${hallId}`);

      setHalls((prev) => prev.filter((item) => item._id !== hallId));
    } catch (err) {
      setError(getApiError(err, 'Unable to delete hall'));
    } finally {
      setBusyId('');
    }
  };
