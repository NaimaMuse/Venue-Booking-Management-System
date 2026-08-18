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

      const { data } = await api.get('/api/halls/mine');
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

  
  return (
    <div className="customer-page">
      <section className="customer-page-header">
        <div>
          <p className="customer-eyebrow">Inventory</p>
          <h1>Manage Halls</h1>
          <p>Add, edit, and control availability for your banquet halls.</p>
        </div>
        <Link to="/owner/halls/new" className="customer-gold-btn">
          + Add New Hall
        </Link>
      </section>

      {loading && <p className="customer-status">Loading halls...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && halls.length === 0 && (
        <p className="customer-empty">
          No halls yet.{' '}
          <Link to="/owner/halls/new">Add your first hall</Link> to start
          receiving bookings.
        </p>
      )}

      {!loading && halls.length > 0 && (
        <div className="owner-hall-grid">
          {halls.map((hall) => (
            <article key={hall._id} className="owner-hall-card">
              <div className="owner-hall-image-wrap">
                <img
                  src={resolveImage(hall.images?.[0])}
                  alt={hall.hallName}
                  onError={(event) => {
                    event.currentTarget.src = '/banner01.png';
                  }}
                />
              </div>

              <div className="owner-hall-body">
                <h3>{hall.hallName}</h3>
                <p>
                  {hall.capacity} guests · $
                  {Number(hall.pricePerDay).toLocaleString()}/day
                </p>

                <label className="owner-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(hall.isAvailable)}
                    disabled={busyId === hall._id}
                    onChange={() => toggleAvailability(hall)}
                  />
                  <span>{hall.isAvailable ? 'Available' : 'Unavailable'}</span>
                </label>

                <div className="owner-hall-actions">
                  <Link
                    to={`/owner/halls/${hall._id}/edit`}
                    className="owner-edit-btn"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="owner-delete-btn"
                    disabled={busyId === hall._id}
                    onClick={() => handleDelete(hall._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageHalls;

