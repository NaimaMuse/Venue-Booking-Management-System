import React, { useEffect, useMemo, useState } from 'react';

import { formatDate, getAvatarUrl, getFirstName } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const getNameLetter = (fullName = '') => {
  const first = getFirstName(fullName);
  return first.charAt(0).toUpperCase() || 'C';
};

const statusClass = {
  pending: 'status-badge-pending',
  accepted: 'status-badge-accepted',
  confirmed: 'status-badge-confirmed',
  cancelled: 'status-badge-cancelled',
  rejected: 'status-badge-rejected',
};

const statusLabel = {
  pending: 'Pending',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
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

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [scheduleBooking, setScheduleBooking] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    locationNotes: '',
  });
  const [scheduleError, setScheduleError] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState(null);
  const [confirmForm, setConfirmForm] = useState({
    depositAmount: '',
    depositPaid: true,
    agreementNotes: '',
  });
  const [confirmError, setConfirmError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/bookings/owner-requests');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load booking requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      setBusyId(bookingId);
      setError('');

      const { data } = await api.patch(`/api/bookings/${bookingId}/status`, {
        status,
      });

      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? data.booking : item))
      );

      if (status === 'accepted') {
        const booking = data.booking;
        setScheduleBooking(booking);
        setScheduleForm({
          scheduledDate: booking.appointment?.scheduledDate
            ? new Date(booking.appointment.scheduledDate)
                .toISOString()
                .slice(0, 16)
            : '',
          locationNotes: booking.appointment?.locationNotes || '',
        });
        setScheduleError('');
      }
    } catch (err) {
      setError(getApiError(err, 'Unable to update booking status'));
    } finally {
      setBusyId('');
    }
  };

  const openScheduleModal = (booking) => {
    setScheduleBooking(booking);
    setScheduleForm({
      scheduledDate: booking.appointment?.scheduledDate
        ? new Date(booking.appointment.scheduledDate).toISOString().slice(0, 16)
        : '',
      locationNotes: booking.appointment?.locationNotes || '',
    });
    setScheduleError('');
  };

  const openConfirmModal = (booking) => {
    setConfirmBooking(booking);
    setConfirmForm({
      depositAmount: booking.depositAmount ? String(booking.depositAmount) : '',
      depositPaid: true,
      agreementNotes: booking.agreementNotes || '',
    });
    setConfirmError('');
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!scheduleBooking) {
      return;
    }

    if (!scheduleForm.scheduledDate) {
      setScheduleError('Inspection date and time are required.');
      return;
    }

    try {
      setScheduling(true);
      setScheduleError('');

      const { data } = await api.patch(
        `/api/bookings/${scheduleBooking._id}/appointment`,
        {
          scheduledDate: scheduleForm.scheduledDate,
          locationNotes: scheduleForm.locationNotes.trim(),
        }
      );

      setBookings((prev) =>
        prev.map((item) =>
          item._id === scheduleBooking._id ? data.booking : item
        )
      );
      setScheduleBooking(null);
    } catch (err) {
      setScheduleError(getApiError(err, 'Unable to schedule visit'));
    } finally {
      setScheduling(false);
    }
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();
    if (!confirmBooking) {
      return;
    }

    if (!confirmForm.depositPaid) {
      setConfirmError('Toggle deposit paid to confirm the booking.');
      return;
    }

    if (
      confirmForm.depositAmount === '' ||
      Number(confirmForm.depositAmount) <= 0
    ) {
      setConfirmError('Enter the deposit amount collected.');
      return;
    }
 try {
      setConfirming(true);
      setConfirmError('');

      const { data } = await api.patch(
        `/api/bookings/${confirmBooking._id}/confirm`,
        {
          depositAmount: Number(confirmForm.depositAmount),
          depositPaid: true,
          agreementNotes: confirmForm.agreementNotes.trim(),
        }
      );

      setBookings((prev) =>
        prev.map((item) =>
          item._id === confirmBooking._id ? data.booking : item
        )
      );
      setConfirmBooking(null);
    } catch (err) {
      setConfirmError(getApiError(err, 'Unable to confirm booking'));
    } finally {
      setConfirming(false);
    }
  };

  const handlePostVisitCancel = async (bookingId) => {
    const confirmed = window.confirm(
      'Cancel this booking after the inspection? The deal will be marked as cancelled.'
    );
    if (!confirmed) {
      return;
    }

    await updateStatus(bookingId, 'cancelled');
  };

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

  return (
    <div className="customer-page owner-bookings-page">
      <section className="customer-page-header owner-bookings-hero">
        <div>
          <p className="customer-eyebrow">Requests</p>
          <h1>Booking Requests</h1>
          <p>
            Accept requests, schedule inspections, then finalize deposits or
            cancel after the visit.
          </p>
        </div>
      </section>

      {!loading && !error && (
        <section className="my-bookings-stats owner-bookings-stats">
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
              <span>Confirmed</span>
              <strong>{stats.confirmed}</strong>
            </div>
            <span className="my-bookings-stat-icon" aria-hidden="true">
              <IconConfirmed />
            </span>
          </article>
        </section>
      )}

      {loading && <p className="customer-status">Loading requests...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <section className="customer-panel owner-bookings-empty">
          <p className="customer-empty-title">No booking requests yet</p>
          <p className="customer-empty">
            When customers request your halls, they will appear here for review.
          </p>
        </section>
      )}

      {!loading && bookings.length > 0 && (
        <section className="owner-requests-section">
          <div className="owner-requests-head">
            <div>
              <h2>All requests</h2>
              <p>Review and manage customer booking requests.</p>
            </div>
            <span className="owner-bookings-count">
              {bookings.length} booking{bookings.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="owner-requests-list">
            {bookings.map((booking, index) => {
              const customerName =
                booking.customerId?.fullName || 'Customer';
              const contact =
                booking.customerId?.phone ||
                booking.customerId?.email ||
                '';
              const avatarSrc = getAvatarUrl(booking.customerId?.avatarUrl);

              return (
                <article
                  key={booking._id}
                  className="owner-request-card"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="owner-request-body">
                    <div className="owner-request-top">
                      <div className="owner-request-customer">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={customerName}
                            className="owner-request-avatar-img"
                          />
                        ) : (
                          <span className="owner-request-avatar">
                            {getNameLetter(customerName)}
                          </span>
                        )}
                        <div>
                          <strong>{customerName}</strong>
                          <span>{contact}</span>
                        </div>
                      </div>
                      <span
                        className={`status-badge ${statusClass[booking.status] || ''}`}
                      >
                        {statusLabel[booking.status] || booking.status}
                      </span>
                    </div>

                    <h3>{booking.hallId?.hallName || 'Hall'}</h3>

                    <div className="owner-request-meta">
                      <div>
                        <span>Event date</span>
                        <strong>{formatDate(booking.eventDate)}</strong>
                      </div>
                      <div>
                        <span>Guests</span>
                        <strong>{booking.guestCount || '—'}</strong>
                      </div>
                      <div>
                        <span>Submitted</span>
                        <strong>{formatDate(booking.createdAt)}</strong>
                      </div>
                      {booking.status === 'confirmed' && booking.depositPaid && (
                        <div>
                          <span>Deposit</span>
                          <strong>
                            ${Number(booking.depositAmount || 0).toLocaleString()}
                          </strong>
                        </div>
                      )}
                    </div>

                    {booking.specialNotes && (
                      <p className="owner-request-notes">
                        <span>Notes</span>
                        {booking.specialNotes}
                      </p>
                    )}

                    <div className="owner-booking-actions owner-request-actions">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="owner-accept-btn"
                            disabled={busyId === booking._id}
                            onClick={() =>
                              updateStatus(booking._id, 'accepted')
                            }
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="owner-reject-btn"
                            disabled={busyId === booking._id}
                            onClick={() =>
                              updateStatus(booking._id, 'rejected')
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {booking.status === 'accepted' && (
                        <>
                          <button
                            type="button"
                            className="owner-schedule-btn"
                            onClick={() => openScheduleModal(booking)}
                          >
                            {booking.appointment?.scheduledDate
                              ? 'Edit Visit'
                              : 'Schedule Visit'}
                          </button>
                          <button
                            type="button"
                            className="owner-confirm-btn"
                            disabled={busyId === booking._id}
                            onClick={() => openConfirmModal(booking)}
                          >
                            Finalize &amp; Confirm
                          </button>
                          <button
                            type="button"
                            className="owner-reject-btn"
                            disabled={busyId === booking._id}
                            onClick={() =>
                              handlePostVisitCancel(booking._id)
                            }
                          >
                            Cancel
                          </button>
                          </>
                      )}
                      {(booking.status === 'confirmed' ||
                        booking.status === 'rejected' ||
                        booking.status === 'cancelled') && (
                        <span className="owner-bookings-done">
                          No actions needed
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {scheduleBooking && (
        <div
          className="booking-modal-overlay"
          role="presentation"
          onClick={() => !scheduling && setScheduleBooking(null)}
        >
          <div
            className="booking-modal booking-modal--owner"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-modal-head">
              <div className="booking-modal-intro">
                <p className="hh-eyebrow booking-modal-eyebrow">Inspection</p>
                <h2 id="schedule-modal-title">Schedule Inspection Visit</h2>
              </div>
              <button
                type="button"
                className="booking-modal-close"
                onClick={() => setScheduleBooking(null)}
                aria-label="Close"
                disabled={scheduling}
              >
                ×
              </button>
            </div>

            <p className="booking-modal-sub">
              Set a meetup time for{' '}
              <strong>
                {scheduleBooking.customerId?.fullName || 'the customer'}
              </strong>{' '}
              at{' '}
              <strong>
                {scheduleBooking.hallId?.hallName || 'the venue'}
              </strong>
              .
            </p>

            {scheduleError && <p className="auth-error">{scheduleError}</p>}

            <form className="booking-form" onSubmit={handleScheduleSubmit}>
              <label className="booking-field">
                <span className="booking-field-label">
                  Inspection Date &amp; Time
                </span>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledDate}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      scheduledDate: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="booking-field">
                <span className="booking-field-label">Meetup Notes</span>
                <textarea
                  rows="3"
                  placeholder="e.g. Meet at Main Gate with Manager Hassan"
                  value={scheduleForm.locationNotes}
                  onChange={(event) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      locationNotes: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="booking-modal-actions">
                <button
                  type="button"
                  className="owner-schedule-btn"
                  onClick={() => setScheduleBooking(null)}
                  disabled={scheduling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="customer-gold-btn booking-modal-save-btn"
                  disabled={scheduling}
                >
                  {scheduling ? 'Saving...' : 'Save Visit Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmBooking && (
        <div
          className="booking-modal-overlay"
          role="presentation"
          onClick={() => !confirming && setConfirmBooking(null)}
        >
          <div
            className="booking-modal booking-modal--owner"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-modal-head">
              <div className="booking-modal-intro">
                <p className="hh-eyebrow booking-modal-eyebrow">Deposit</p>
                <h2 id="confirm-modal-title">Finalize &amp; Confirm Booking</h2>
              </div>
              <button
                type="button"
                className="booking-modal-close"
                onClick={() => setConfirmBooking(null)}
                aria-label="Close"
                disabled={confirming}
              >
                ×
              </button>
            </div>

            <p className="booking-modal-sub">
              Record the deposit collected after the inspection with{' '}
              <strong>
                {confirmBooking.customerId?.fullName || 'the customer'}
              </strong>{' '}
              for{' '}
              <strong>
                {confirmBooking.hallId?.hallName || 'the venue'}
              </strong>
              .
            </p>

            {confirmError && <p className="auth-error">{confirmError}</p>}

            <form className="booking-form" onSubmit={handleConfirmSubmit}>
              <label className="booking-field">
                <span className="booking-field-label">
                  Deposit Amount Collected
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 200"
                  value={confirmForm.depositAmount}
                  onChange={(event) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      depositAmount: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="owner-deposit-toggle">
                <span>Deposit Paid</span>
                <input
                  type="checkbox"
                  checked={confirmForm.depositPaid}
                  onChange={(event) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      depositPaid: event.target.checked,
                    }))
                  }
                />
                <em>{confirmForm.depositPaid ? 'Yes — verified' : 'No'}</em>
              </label>

              <label className="booking-field">
                <span className="booking-field-label">Agreement Notes</span>
                <textarea
                  rows="4"
                  placeholder="Hall design details, seating layout, card arrangements, extras agreed during the meeting..."
                  value={confirmForm.agreementNotes}
                  onChange={(event) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      agreementNotes: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="booking-modal-actions">
                <button
                  type="button"
                  className="owner-schedule-btn"
                  onClick={() => setConfirmBooking(null)}
                  disabled={confirming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="customer-gold-btn booking-modal-save-btn"
                  disabled={confirming || !confirmForm.depositPaid}
                >
                  {confirming ? 'Confirming...' : 'Confirm Booking & Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerBookings;

    
