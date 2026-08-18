import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { formatDate } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const statusLabel = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function AdminHotels() {
  const location = useLocation();
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [hotels, setHotels] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejectHotel, setRejectHotel] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [highlightId, setHighlightId] = useState(
    location.state?.focusHotelId || ''
  );

  const loadHotels = async () => {
    try {
      setLoading(true);
      setError('');

      const [listRes, statsRes] = await Promise.all([
        api.get('/api/admin/hotels'),
        api.get('/api/admin/stats').catch(() => ({ data: {} })),
      ]);

      const nextHotels = listRes.data.hotels || [];
      setHotels(nextHotels);

      const stats = statsRes.data?.stats || {};
      setCounts({
        all: nextHotels.length,
        pending:
          stats.pendingApprovals ??
          nextHotels.filter((h) => h.verificationStatus === 'pending').length,
        approved:
          stats.approvedHotels ??
          nextHotels.filter((h) => h.verificationStatus === 'approved').length,
        rejected:
          stats.rejectedHotels ??
          nextHotels.filter((h) => h.verificationStatus === 'rejected').length,
      });
    } catch (err) {
      setError(getApiError(err, 'Unable to load hotels'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    if (location.state?.focusHotelId) {
      setFilter('pending');
      setHighlightId(location.state.focusHotelId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const visibleHotels = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = hotels;

    if (filter !== 'all') {
      list = list.filter((hotel) => hotel.verificationStatus === filter);
    }

    if (query) {
      list = list.filter((hotel) => {
        const haystack = [
          hotel.hotelName,
          hotel.city,
          hotel.address,
          hotel.contactPhone,
          hotel.ownerId?.fullName,
          hotel.ownerId?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    if (!highlightId) {
      return list;
    }

    return [...list].sort((a, b) => {
      if (a._id === highlightId) return -1;
      if (b._id === highlightId) return 1;
      return 0;
    });
  }, [hotels, filter, search, highlightId]);

  const updateStatus = async (hotelId, status, reason = '') => {
    try {
      setBusyId(hotelId);
      setError('');
      setRejectError('');

      // Backend expects verificationStatus: approved | rejected | pending
      const { data } = await api.patch(
        `/api/admin/hotels/${hotelId}/status`,
        {
          verificationStatus: status,
          rejectionReason: reason,
        }
      );

      const updated = data?.hotel;
      if (!updated) {
        throw new Error(data?.message || 'Hotel update response was empty');
      }

      setHotels((prev) => {
        const nextHotels = prev.map((item) =>
          item._id === hotelId ? updated : item
        );
        setCounts({
          all: nextHotels.length,
          pending: nextHotels.filter((h) => h.verificationStatus === 'pending')
            .length,
          approved: nextHotels.filter(
            (h) => h.verificationStatus === 'approved'
          ).length,
          rejected: nextHotels.filter(
            (h) => h.verificationStatus === 'rejected'
          ).length,
        });
        return nextHotels;
      });
      setRejectHotel(null);
      setRejectionReason('');
      setHighlightId('');
    } catch (err) {
      const message = getApiError(err, 'Unable to update hotel status');
      setError(message);
      setRejectError(message);
    } finally {
      setBusyId('');
    }
  };

  const handleRejectSubmit = async (event) => {
    event.preventDefault();
    if (!rejectHotel) {
      return;
    }
    if (!rejectionReason.trim()) {
      setRejectError('Please provide a rejection reason.');
      return;
    }
    await updateStatus(rejectHotel._id, 'rejected', rejectionReason.trim());
  };

  const openReject = (hotel) => {
    setRejectHotel(hotel);
    setRejectionReason(hotel.rejectionReason || '');
    setRejectError('');
  };

  return (
    <div className="customer-page admin-hotels-page">
      <section className="customer-page-header admin-hotels-hero">
        <div>
          <p className="customer-eyebrow">Verification</p>
          <h1>Hotel Approvals</h1>
          <p>
            Approve, reject, or reopen hotel applications. Hall browsing lives
            under All Venues.
          </p>
        </div>
      </section>

      <section className="admin-hotels-kpis">
        <article>
          <span>All hotels</span>
          <strong>{counts.all}</strong>
        </article>
        <article className="is-pending">
          <span>Pending</span>
          <strong>{counts.pending}</strong>
        </article>
        <article className="is-approved">
          <span>Approved</span>
          <strong>{counts.approved}</strong>
        </article>
        <article className="is-rejected">
          <span>Rejected</span>
          <strong>{counts.rejected}</strong>
        </article>
      </section>

      <div className="admin-hotels-toolbar">
        <div className="admin-hotels-filters" role="tablist">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`admin-hotels-filter${
                filter === item.id ? ' is-active' : ''
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <em>{counts[item.id] ?? 0}</em>
            </button>
          ))}
        </div>

        <label className="admin-hotels-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hotel, owner, city, email..."
          />
        </label>
      </div>

      {loading && <p className="customer-status">Loading hotels...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && visibleHotels.length === 0 && (
        <p className="customer-empty">No hotels match this view.</p>
      )}

      {!loading && visibleHotels.length > 0 && (
        <div className="admin-hotels-grid">
          {visibleHotels.map((hotel) => {
            const status = hotel.verificationStatus || 'pending';
            const busy = busyId === hotel._id;

            return (
              <article
                key={hotel._id}
                className={`admin-hotel-card is-${status}${
                  highlightId === hotel._id ? ' is-highlighted' : ''
                }`}
              >
                <div className="admin-hotel-card-top">
                  <div>
                    <p className="admin-hotel-kicker">{hotel.city || 'Hargeisa'}</p>
                    <h3>{hotel.hotelName}</h3>
                  </div>
                  <span className={`admin-hotel-badge is-${status}`}>
                    {statusLabel[status] || status}
                  </span>
                </div>

                <ul className="admin-hotel-meta">
                  <li>
                    <span>Owner</span>
                    <strong>{hotel.ownerId?.fullName || '—'}</strong>
                  </li>
                  <li>
                    <span>Email</span>
                    <strong>{hotel.ownerId?.email || '—'}</strong>
                  </li>
                  <li>
                    <span>Phone</span>
                    <strong>
                      {hotel.contactPhone || hotel.ownerId?.phone || '—'}
                    </strong>
                  </li>
                  <li>
                    <span>Submitted</span>
                    <strong>{formatDate(hotel.createdAt)}</strong>
                  </li>
                </ul>

                {hotel.address ? (
                  <p className="admin-hotel-address">{hotel.address}</p>
                ) : null}

                {hotel.description ? (
                  <p className="admin-hotel-desc">{hotel.description}</p>
                ) : null}

                {status === 'rejected' && hotel.rejectionReason ? (
                  <div className="admin-hotel-reason">
                    <span>Rejection reason</span>
                    <p>{hotel.rejectionReason}</p>
                  </div>
                ) : null}

                <div className="admin-hotel-actions">
                  {status !== 'approved' && (
                    <button
                      type="button"
                      className="admin-hotel-btn is-approve"
                      disabled={busy}
                      onClick={() => updateStatus(hotel._id, 'approved')}
                    >
                      {busy ? 'Saving...' : 'Approve'}
                    </button>
                  )}

                  {status !== 'rejected' && (
                    <button
                      type="button"
                      className="admin-hotel-btn is-reject"
                      disabled={busy}
                      onClick={() => openReject(hotel)}
                    >
                      Reject
                    </button>
                  )}

                  {status !== 'pending' && (
                    <button
                      type="button"
                      className="admin-hotel-btn is-pending"
                      disabled={busy}
                      onClick={() => updateStatus(hotel._id, 'pending')}
                    >
                      Set pending
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rejectHotel && (
        <div className="booking-modal-overlay" role="presentation">
          <div
            className="booking-modal admin-reject-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <div className="booking-modal-head">
              <h2 id="reject-modal-title">Reject hotel</h2>
              <button
                type="button"
                className="booking-modal-close"
                onClick={() => setRejectHotel(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="booking-modal-sub">
              Provide a reason for rejecting{' '}
              <strong>{rejectHotel.hotelName}</strong>. The owner will see this
              note.
            </p>

            {rejectError && <p className="auth-error">{rejectError}</p>}

            <form className="booking-form" onSubmit={handleRejectSubmit}>
              <label>
                Rejection reason
                <textarea
                  rows="4"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Incomplete details, unclear address, etc."
                  required
                />
              </label>

              <button
                type="submit"
                className="admin-hotel-btn is-reject booking-submit-btn"
                disabled={busyId === rejectHotel._id}
              >
                {busyId === rejectHotel._id
                  ? 'Rejecting...'
                  : 'Confirm rejection'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHotels;
