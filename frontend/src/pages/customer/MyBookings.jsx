import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { API_BASE, formatDate } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';
import {
  downloadBookingInvoice,
  printBookingInvoice,
} from '../../utils/bookingInvoice';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

const statusClass = {
  pending: 'status-badge-pending',
  accepted: 'status-badge-accepted',
  confirmed: 'status-badge-confirmed',
  cancelled: 'status-badge-cancelled',
  rejected: 'status-badge-rejected',
};

const statusDisplay = {
  pending: 'Pending',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const IconTotal = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const IconPending = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconAccepted = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M8.5 12.2L11 14.7L15.5 9.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconConfirmed = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 4.5H17C18.1 4.5 19 5.4 19 6.5V19L12 15.8L5 19V6.5C5 5.4 5.9 4.5 7 4.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

function MyBookings() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(location.state?.toast || '');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    if (location.state?.toast) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(''), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/bookings/my-bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load bookings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = useMemo(() => {
    const today = startOfToday();

    return bookings.filter((booking) => {
      const eventDate = new Date(booking.eventDate);
      const isPast = !Number.isNaN(eventDate.getTime()) && eventDate < today;

      if (filter === 'pending') {
        return booking.status === 'pending';
      }

      if (filter === 'upcoming') {
        return (
          (booking.status === 'accepted' || booking.status === 'confirmed') &&
          !isPast
        );
      }

      if (filter === 'past') {
        return (
          isPast ||
          booking.status === 'rejected' ||
          booking.status === 'cancelled'
        );
      }

      return booking.status !== 'cancelled' && booking.status !== 'rejected';
    });
  }, [bookings, filter]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const accepted = bookings.filter((b) => b.status === 'accepted').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    return {
      total: bookings.length,
      pending,
      accepted,
      confirmed,
    };
  }, [bookings]);

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      'Cancel this pending booking request? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await api.delete(`/api/bookings/${bookingId}`);

      setBookings((prev) => prev.filter((item) => item._id !== bookingId));
      setToast('Booking request cancelled.');
    } catch (err) {
      setError(getApiError(err, 'Unable to cancel request'));
    } finally {
      setCancellingId('');
    }
  };

  const handleDownloadInvoice = (booking) => {
    try {
      downloadBookingInvoice(booking);
      setToast('Invoice downloaded. Open the file to view or save as PDF.');
    } catch (err) {
      setError(err.message || 'Unable to download invoice');
    }
  };

  const handlePrintInvoice = (booking) => {
    try {
      printBookingInvoice(booking);
    } catch (err) {
      setError(err.message || 'Unable to print invoice');
    }
  };

  return (
    <div className="customer-page my-bookings-page">
      {toast && <div className="customer-toast">{toast}</div>}

      <section className="customer-page-header my-bookings-hero">
        <div>
          <p className="customer-eyebrow">HallHub</p>
          <h1>My Bookings</h1>
          <p>Review requests, visit schedules, and confirmed deposits.</p>
        </div>
        <Link to="/hotels" className="customer-gold-btn">
          Browse Halls
        </Link>
      </section>

      {!loading && !error && (
        <section className="my-bookings-stats">
          <article className="my-bookings-stat is-total">
            <div>
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
            <span className="my-bookings-stat-icon" aria-hidden="true">
              <IconTotal />
            </span>
          </article>
          <article className="my-bookings-stat is-pending">
            <div>
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>
            <span className="my-bookings-stat-icon" aria-hidden="true">
              <IconPending />
            </span>
          </article>
          <article className="my-bookings-stat is-accepted">
            <div>
              <span>Accepted</span>
              <strong>{stats.accepted}</strong>
            </div>
            <span className="my-bookings-stat-icon" aria-hidden="true">
              <IconAccepted />
            </span>
          </article>
          <article className="my-bookings-stat is-confirmed">
            <div>
              <span>CONFIRMED</span>
              <strong>{stats.confirmed}</strong>
            </div>
            <span className="my-bookings-stat-icon" aria-hidden="true">
              <IconConfirmed />
            </span>
          </article>
        </section>
      )}

      <div className="mb-toolbar">
        <div
          className="booking-filter-tabs mb-filter-tabs"
          role="tablist"
          aria-label="Filter bookings"
        >
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`booking-filter-tab${filter === item.id ? ' is-active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {!loading && !error && (
          <p className="mb-result-count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
          </p>
        )}
      </div>

      {loading && <p className="customer-status">Loading bookings...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="customer-empty-panel mb-empty">
          <p className="customer-empty-title">No bookings in this view</p>
          <p className="customer-empty">
            EXPLORE HALLS AND HOTELS TO FIND THE PERFECT VENUE FOR YOUR EVENT.
          </p>
          <Link to="/hotels" className="customer-gold-btn">
            Explore Hotels &amp; Halls
          </Link>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mb-list">
          {filtered.map((booking, index) => {
            const dayRate = Number(booking.hallId?.pricePerDay) || 0;
            const depositAmount = Number(booking.depositAmount) || 0;
            const hasVisit =
              booking.status === 'accepted' &&
              (booking.appointment?.scheduledDate ||
                booking.appointment?.locationNotes);
            const isConfirmed = booking.status === 'confirmed';
            const isPending = booking.status === 'pending';
            const hasSecondary =
              Boolean(booking.specialNotes) || hasVisit || isConfirmed;

            return (
              <article
                key={booking._id}
                className="mb-card"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="mb-card-layout">
                  <div className="mb-card-media">
                    <img
                      src={resolveImage(booking.hallId?.images?.[0])}
                      alt={booking.hallId?.hallName || 'Hall'}
                    />
                  </div>

                  <div className="mb-card-content">
                    <div className="mb-card-main">
                      <div className="mb-card-identity">
                        <p className="mb-card-kicker">Booking request</p>
                        <h3>{booking.hallId?.hallName || 'Hall'}</h3>
                        <p className="mb-card-hotel">
                          {booking.hotelId?.hotelName || 'Hotel'}
                          {booking.hotelId?.city
                            ? ` · ${booking.hotelId.city}`
                            : ''}
                        </p>
                      </div>

                      <span
                        className={`status-badge ${statusClass[booking.status] || ''}`}
                      >
                        {statusDisplay[booking.status] || booking.status}
                      </span>
                    </div>

                    <dl className="mb-card-facts">
                      <div>
                        <dt>Event date</dt>
                        <dd>{formatDate(booking.eventDate)}</dd>
                      </div>
                      <div>
                        <dt>Guests</dt>
                        <dd>{booking.guestCount}</dd>
                      </div>
                      {isConfirmed && booking.depositPaid ? (
                        <div>
                          <dt>Deposit</dt>
                          <dd>{formatMoney(depositAmount)}</dd>
                        </div>
                      ) : dayRate > 0 ? (
                        <div>
                          <dt>DAY RATE</dt>
                          <dd>{formatMoney(dayRate)}</dd>
                        </div>
                      ) : null}
                      <div className="mb-fact-quiet">
                        <dt>Submitted</dt>
                        <dd>{formatDate(booking.createdAt)}</dd>
                      </div>
                    </dl>

                    {hasSecondary && (
                      <div className="mb-card-secondary">
                        {booking.specialNotes && (
                          <p className="mb-notes">
                            <span>Notes</span>
                            {booking.specialNotes}
                          </p>
                        )}

                        {hasVisit && (
                          <div className="mb-detail mb-detail-visit">
                            <p className="mb-detail-label">Inspection visit</p>
                            <p>
                              {booking.appointment?.scheduledDate
                                ? formatDate(booking.appointment.scheduledDate)
                                : 'Date to be confirmed'}
                              {booking.appointment?.locationNotes
                                ? ` — ${booking.appointment.locationNotes}`
                                : ''}
                            </p>
                          </div>
                        )}

                        {isConfirmed && (
                          <div className="mb-detail">
                            <p className="mb-detail-label">Agreement</p>
                            <p>
                              {booking.agreementNotes?.trim() ||
                                'No special arrangements noted.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {(isPending || isConfirmed) && (
                      <div className="mb-card-actions">
                        {isConfirmed && (
                          <>
                            <button
                              type="button"
                              className="mb-btn mb-btn-primary"
                              onClick={() => handleDownloadInvoice(booking)}
                            >
                              Download Invoice
                            </button>
                            <button
                              type="button"
                              className="mb-btn mb-btn-secondary"
                              onClick={() => handlePrintInvoice(booking)}
                            >
                              Print
                            </button>
                          </>
                        )}
                        {isPending && (
                          <button
                            type="button"
                            className="mb-btn mb-btn-danger"
                            disabled={cancellingId === booking._id}
                            onClick={() => handleCancel(booking._id)}
                          >
                            {cancellingId === booking._id
                              ? 'Cancelling...'
                              : 'Cancel Request'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
