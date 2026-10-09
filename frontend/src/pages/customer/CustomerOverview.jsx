import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
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

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
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
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReviewBooking, setActiveReviewBooking] = useState(null);
  const [activeReviewData, setActiveReviewData] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [bookingsRes, eligibleRes, reviewsRes] = await Promise.all([
        api.get('/api/bookings/my-bookings'),
        api.get('/api/reviews/eligible-bookings').catch(() => ({ data: { bookings: [] } })),
        api.get('/api/reviews/my').catch(() => ({ data: { reviews: [] } })),
      ]);

      setBookings(bookingsRes.data.bookings || []);
      setEligibleBookings(eligibleRes.data.bookings || []);
      setMyReviews(reviewsRes.data.reviews || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    ).length;
    const completedEligible = eligibleBookings.length;
    const reviewsGiven = myReviews.length;

    return { total, pending, confirmed, completedEligible, reviewsGiven };
  }, [bookings, eligibleBookings, myReviews]);

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

  const openReviewModal = (booking, review = null) => {
    setActiveReviewBooking(booking);
    setActiveReviewData(review || booking.review || null);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setToastMessage('Rating & review submitted successfully! Hotel overall rating updated.');
    loadDashboardData();
  };

  const firstName = getFirstName(user?.fullName);

  return (
    <div className="customer-page customer-dash">
      {toastMessage && <div className="customer-toast">{toastMessage}</div>}

      <section className="customer-welcome customer-dash-hero">
        <div>
          <p className="customer-eyebrow">Welcome back</p>
          <h1>Hello, {firstName}!</h1>
          <p>
            Track your bookings, rate your completed hotel stays, and discover
            top-rated venues in Hargeisa.
          </p>
          <div className="customer-hero-actions">
            <Link to="/hotels" className="customer-gold-btn">
              Explore Top Rated Hotels
            </Link>
            <Link to="/customer/reviews" className="customer-outline-btn">
              ⭐ My Reviews ({metrics.reviewsGiven})
            </Link>
          </div>
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
                <p>Confirmed Stays</p>
                <strong>{metrics.confirmed}</strong>
                <em>Accepted &amp; Confirmed</em>
              </div>
            </article>
            <article className="metric-card customer-dash-metric">
              <span className="customer-dash-metric-icon is-gold">
                <IconStar />
              </span>
              <div>
                <p>Reviews Given</p>
                <strong>{metrics.reviewsGiven}</strong>
                <em>{metrics.completedEligible} completed stays</em>
              </div>
            </article>
          </section>

          {/* CUSTOMER REVIEWS & RATINGS SECTION (Requirement 3 & 4) */}
          <section className="customer-panel customer-dash-reviews-panel">
            <div className="customer-panel-head">
              <div className="customer-panel-title-wrap">
                <h2>Customer Reviews &amp; Star Ratings</h2>
                <span className="hh-dash-badge">Verified Service Experience</span>
              </div>
              <Link to="/customer/reviews" className="customer-panel-link">
                View all reviews →
              </Link>
            </div>

            {eligibleBookings.length === 0 ? (
              <div className="customer-empty-panel customer-empty-panel-inset">
                <p className="customer-empty-title">No completed hotel stays yet</p>
                <p className="customer-empty">
                  Reviews and star ratings can be submitted after your booking has been completed and the hotel service has been provided.
                </p>
                <Link to="/hotels" className="customer-gold-btn">
                  Browse Hotels &amp; Halls
                </Link>
              </div>
            ) : (
              <div className="customer-dash-eligible-grid">
                {eligibleBookings.map((b) => (
                  <article key={b._id} className="customer-dash-eligible-card">
                    <div className="customer-dash-eligible-body">
                      <div className="customer-dash-eligible-top">
                        <span className="status-badge status-badge-confirmed">
                          ✓ Service Provided
                        </span>
                        <span className="customer-dash-eligible-date">
                          {formatDate(b.eventDate)}
                        </span>
                      </div>

                      <h3>{b.hotelId?.hotelName || 'Hotel'}</h3>
                      <p className="customer-dash-eligible-hall">
                        {b.hallId?.hallName || 'Hall space'} · {b.guestCount} guests
                      </p>

                      {b.hasReviewed && b.review ? (
                        <div className="customer-dash-reviewed-box">
                          <div className="customer-dash-reviewed-stars">
                            <StarRating rating={b.review.rating} size="sm" />
                          </div>
                          {b.review.comment && (
                            <p className="customer-dash-reviewed-snippet">
                              “{b.review.comment}”
                            </p>
                          )}
                          <button
                            type="button"
                            className="customer-edit-review-link"
                            onClick={() => openReviewModal(b, b.review)}
                          >
                            ✎ Edit Rating &amp; Review
                          </button>
                        </div>
                      ) : (
                        <div className="customer-dash-unreviewed-box">
                          <p className="customer-dash-unreviewed-prompt">
                            How was your service experience at {b.hotelId?.hotelName}?
                          </p>
                          <button
                            type="button"
                            className="customer-gold-btn customer-rate-btn"
                            onClick={() => openReviewModal(b)}
                          >
                            ⭐ Rate Hotel &amp; Write Review
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="customer-dash-grid">
            <section className="customer-panel customer-dash-bookings">
              <div className="customer-panel-head">
                <h2>My Recent Bookings</h2>
                <Link to="/customer/my-bookings">View all</Link>
              </div>

              {recent.length === 0 ? (
                <div className="customer-empty-panel customer-empty-panel-inset">
                  <p className="customer-empty-title">No booking requests yet</p>
                  <p className="customer-empty">
                    Browse halls and hotels to send booking requests.
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
                        <span>Location</span>
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
                  <h2>Quick Actions</h2>
                </div>
                <div className="customer-dash-action-grid">
                  <Link to="/hotels" className="customer-dash-action">
                    <IconBrowse />
                    <span>Browse Hotels</span>
                  </Link>
                  <Link to="/customer/my-bookings" className="customer-dash-action">
                    <IconBooking />
                    <span>My Bookings</span>
                  </Link>
                  <Link to="/customer/reviews" className="customer-dash-action">
                    <IconStar />
                    <span>Rate &amp; Reviews</span>
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

      {reviewModalOpen && activeReviewBooking && (
        <ReviewModal
          booking={activeReviewBooking}
          initialReview={activeReviewData}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}

export default CustomerOverview;
