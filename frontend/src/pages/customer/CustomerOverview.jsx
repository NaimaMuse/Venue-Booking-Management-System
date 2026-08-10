import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE, formatDate, getFirstName, getUser } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

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

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const IconBooking = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V7M16 3.5V7M4 10H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconPending = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconConfirmed = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.5 12.2L11 14.7L15.5 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconVisit = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s-6.5-5.2-6.5-10A6.5 6.5 0 0 1 12 4.5a6.5 6.5 0 0 1 6.5 6.5c0 4.8-6.5 10-6.5 10Z" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const IconBrowse = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

function CustomerOverview() {
  const user = getUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/bookings/my-bookings');
        setBookings(data.bookings || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to load dashboard'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    ).length;
    const upcomingVisits = bookings.filter(
      (b) =>
        b.status === 'accepted' &&
        b.appointment?.scheduledDate &&
        !b.appointment?.completed
    ).length;

    return { total, pending, confirmed, upcomingVisits };
  }, [bookings]);

  const recent = bookings.slice(0, 3);

  const nextAppointment = useMemo(() => {
    const upcoming = bookings
      .filter(
        (booking) =>
          booking.status === 'accepted' &&
          booking.appointment?.scheduledDate &&
          !booking.appointment?.completed
      )
      .sort(
        (a, b) =>
          new Date(a.appointment.scheduledDate) -
          new Date(b.appointment.scheduledDate)
      );

    return upcoming[0] || null;
  }, [bookings]);

  const firstName = getFirstName(user?.fullName);

  return (
    <div className="customer-page customer-dash">
      <section className="customer-welcome customer-dash-hero">
        <div>
          <p className="customer-eyebrow">Welcome back</p>
          <h1>Hello, {firstName}!</h1>
          <p>
            Find the best halls for your events and track your bookings and
            appointments in one place.
          </p>
          <Link to="/hotels" className="customer-gold-btn">
            Explore Halls &amp; Hotels
          </Link>
        </div>
        <div className="customer-dash-hero-art" aria-hidden="true" />
      </section>

      {loading && <p className="customer-status">Loading your dashboard...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="customer-dash-metrics">
            <article className="metric-card customer-dash-metric">
              <span className="customer-dash-metric-icon is-purple">
                <IconBooking />
              </span>
              <div>
                <p>Total Bookings</p>
                <strong>{metrics.total}</strong>
                <em>All time</em>
              </div>
            </article>
            <article className="metric-card customer-dash-metric">
              <span className="customer-dash-metric-icon is-orange">
                <IconPending />
              </span>
              <div>
                <p>Pending Bookings</p>
                <strong>{metrics.pending}</strong>
                <em>Awaiting response</em>
              </div>
            </article>
            <article className="metric-card customer-dash-metric">
              <span className="customer-dash-metric-icon is-green">
                <IconConfirmed />
              </span>
              <div>
                <p>Confirmed Bookings</p>
                <strong>{metrics.confirmed}</strong>
                <em>Accepted by owner</em>
              </div>
            </article>
            <article className="metric-card customer-dash-metric">
              <span className="customer-dash-metric-icon is-rose">
                <IconVisit />
              </span>
              <div>
                <p>Upcoming Visits</p>
                <strong>{metrics.upcomingVisits}</strong>
                <em>Scheduled</em>
              </div>
            </article>
          </section>

          <section className="customer-dash-grid">
            <section className="customer-panel customer-dash-bookings">
              <div className="customer-panel-head">
                <h2>My Bookings</h2>
                <Link to="/customer/my-bookings">View all</Link>
              </div>

              {recent.length === 0 ? (
                <div className="customer-empty-panel customer-empty-panel-inset">
                  <p className="customer-empty-title">No booking requests yet</p>
                  <p className="customer-empty">
                    Browse hotels and halls to get started with your first request.
                  </p>
                  <Link to="/hotels" className="customer-gold-btn">
                    Browse Halls
                  </Link>
                </div>
              ) : (
                <div className="customer-dash-booking-list">
                  {recent.map((booking) => (
                    <article key={booking._id} className="customer-dash-booking-card">
                      <img
                        src={resolveImage(booking.hallId?.images?.[0])}
                        alt={booking.hallId?.hallName || 'Hall'}
                      />
                      <div className="customer-dash-booking-body">
                        <span
                          className={`status-badge ${statusClass[booking.status] || ''}`}
                        >
                          {statusDisplay[booking.status] || booking.status}
                        </span>
                        <h3>{booking.hallId?.hallName || 'Hall'}</h3>
                        <p>
                          {booking.hotelId?.hotelName || 'Hotel'}
                          {booking.hotelId?.city ? ` · ${booking.hotelId.city}` : ''}
                        </p>
                        <div className="customer-dash-booking-meta">
                          <span>{formatDate(booking.eventDate)}</span>
                          <span>{booking.guestCount || '—'} guests</span>
                        </div>
                        <small>Requested on {formatDate(booking.createdAt)}</small>
                        <Link
                          to="/customer/my-bookings"
                          className="customer-dash-detail-btn"
                        >
                          View Details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="customer-dash-side">
              <section className="customer-panel customer-dash-appointment">
                <div className="customer-panel-head">
                  <h2>Upcoming Appointment</h2>
                </div>

                {nextAppointment ? (
                  <div className="customer-dash-appointment-card">
                    <p className="customer-dash-appointment-kicker">
                      Inspection Visit
                    </p>
                    <h3>{nextAppointment.hallId?.hallName || 'Hall'}</h3>
                    <ul>
                      <li>
                        <span>Date</span>
                        <strong>
                          {formatDate(nextAppointment.appointment?.scheduledDate)}
                        </strong>
                      </li>
                      <li>
                       <span>LOCATION</span>
                        <strong>
                          {nextAppointment.appointment?.locationNotes ||
                            nextAppointment.hotelId?.hotelName ||
                            'Hotel reception'}
                        </strong>
                      </li>
                    </ul>
                    <Link
                      to="/customer/my-appointments"
                      className="customer-gold-btn"
                    >
                      View Details
                    </Link>
                  </div>
                ) : (
                  <div className="customer-dash-empty-side">
                    <p>No upcoming visits</p>
                    <span>
                      When an owner schedules an inspection, it will appear here.
                    </span>
                    <Link to="/customer/my-appointments">My Appointments</Link>
                  </div>
                )}
              </section>

              <section className="customer-panel customer-dash-actions">
                <div className="customer-panel-head">
                <h2>QUICK ACTIONS</h2>
                </div>
                <div className="customer-dash-action-grid">
                  <Link to="/hotels" className="customer-dash-action">
                    <IconBrowse />
                    <span>Browse Halls</span>
                  </Link>
                  <Link to="/customer/my-bookings" className="customer-dash-action">
                    <IconBooking />
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/customer/my-appointments"
                    className="customer-dash-action"
                  >
                    <IconVisit />
                    <span>Appointments</span>
                  </Link>
                  <Link to="/customer/profile" className="customer-dash-action">
                    <IconHeart />
                    <span>Profile</span>
                  </Link>
                </div>
              </section>
            </div>
          </section>

        </>
      )}
    </div>
  );
}

export default CustomerOverview;
