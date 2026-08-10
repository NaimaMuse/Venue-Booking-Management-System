import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE, formatDate } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';
import { markAppointmentsSeen } from '../../utils/appointmentAlerts';

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const formatVisitDateTime = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function MyAppointments() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/bookings/my-bookings');
        const nextBookings = data.bookings || [];
        setBookings(nextBookings);
        markAppointmentsSeen(nextBookings);
      } catch (err) {
        setError(getApiError(err, 'Unable to load appointments'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const appointments = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.status === 'accepted' &&
            (booking.appointment?.scheduledDate ||
              booking.appointment?.locationNotes)
        )
        .sort((a, b) => {
          const aDate = new Date(a.appointment?.scheduledDate || 0).getTime();
          const bDate = new Date(b.appointment?.scheduledDate || 0).getTime();
          return aDate - bDate;
        }),
    [bookings]
  );

  const upcomingCount = appointments.filter(
    (booking) => !booking.appointment?.completed
  ).length;
  const completedCount = appointments.filter(
    (booking) => booking.appointment?.completed
  ).length;

  return (
    <div className="customer-page appointments-page">
      <section className="customer-page-header appointments-hero">
        <div>
          <p className="customer-eyebrow">Hargeisa Hall Finder</p>
          <h1>My Appointments</h1>
          <p>
            Track scheduled hall inspection visits confirmed by hotel owners.
          </p>
        </div>
        <Link to="/customer/my-bookings" className="customer-gold-btn">
          View Bookings
        </Link>
      </section>

      {!loading && !error && (
        <section className="appointments-stats">
          <article>
            <span>Total Visits</span>
            <strong>{appointments.length}</strong>
          </article>
          <article>
            <span>Upcoming</span>
            <strong>{upcomingCount}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>
        </section>
      )}

      {loading && <p className="customer-status">Loading appointments...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <div className="customer-empty-panel appointments-empty">
          <p className="customer-empty-title">No scheduled visits yet</p>
          <p className="customer-empty">
            Once a hotel owner accepts your booking and sets a visit time, it
            will appear here.
          </p>
          <div className="appointments-empty-actions">
            <Link to="/customer/my-bookings" className="customer-gold-btn">
              View Bookings
            </Link>
            <Link to="/hotels" className="owner-schedule-btn">
              Browse Halls
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="appointments-list">
          {appointments.map((booking, index) => {
            const isCompleted = Boolean(booking.appointment?.completed);

            return (
              <article
                key={booking._id}
                className="appointments-card"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="appointments-card-media">
                  <img
                    src={resolveImage(booking.hallId?.images?.[0])}
                    alt={booking.hallId?.hallName || 'Hall'}
                  />
                </div>

                <div className="appointments-card-body">
                  <div className="appointments-card-top">
                    <div>
                      <p className="appointments-kicker">Inspection Visit</p>
                      <h3>{booking.hallId?.hallName || 'Hall'}</h3>
                      <p className="appointments-hotel">
                        {booking.hotelId?.hotelName || 'Hotel'}
                        {booking.hotelId?.city
                          ? ` · ${booking.hotelId.city}`
                          : ''}
                      </p>
                    </div>
                    <span
                      className={`status-badge ${
                        isCompleted
                          ? 'status-badge-confirmed'
                          : 'status-badge-accepted'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>

                  <div className="appointments-meta">
                    <div>
                      <span>Event Date</span>
                      <strong>{formatDate(booking.eventDate)}</strong>
                    </div>
                    <div>
                      <span>Visit Date &amp; Time</span>
                      <strong>
                        {formatVisitDateTime(booking.appointment?.scheduledDate)}
                      </strong>
                    </div>
                    <div>
                      <span>Guests</span>
                      <strong>{booking.guestCount || '—'}</strong>
                    </div>
                  </div>

                  <div className="appointments-notes">
                    <h4>Meetup notes</h4>
                    <p>
                      {booking.appointment?.locationNotes ||
                        'No meetup notes provided yet.'}
                    </p>
                  </div>

                  <div className="appointments-card-actions">
                    <Link
                      to="/customer/my-bookings"
                      className="appointments-link-btn"
                    >
                      Open booking
                    </Link>
                    {booking.hotelId?.address && (
                      <span className="appointments-address">
                        {booking.hotelId.address}
                      </span>
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

export default MyAppointments;
