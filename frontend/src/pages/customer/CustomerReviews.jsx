import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
import { API_BASE, formatDate } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const resolveImage = (image) => {
  if (!image) return '/banner01.png';
  if (image.startsWith('http')) return image;
  return `${API_BASE}${image}`;
};

function CustomerReviews() {
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('eligible'); // 'eligible' | 'submitted'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [eligibleRes, reviewsRes] = await Promise.all([
        api.get('/api/reviews/eligible-bookings'),
        api.get('/api/reviews/my'),
      ]);

      setEligibleBookings(eligibleRes.data.bookings || []);
      setMyReviews(reviewsRes.data.reviews || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load customer reviews'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleOpenReview = (booking, review = null) => {
    setSelectedBooking(booking);
    setSelectedReview(review || booking.review || null);
    setModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setToast('Your star rating and review were saved! Hotel overall rating updated.');
    loadData();
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your review? This will automatically update the hotel overall rating.'
    );
    if (!confirmed) return;

    try {
      setDeletingId(reviewId);
      await api.delete(`/api/reviews/${reviewId}`);
      setToast('Review deleted successfully.');
      loadData();
    } catch (err) {
      setError(getApiError(err, 'Unable to delete review'));
    } finally {
      setDeletingId('');
    }
  };

  const unreviewedBookings = eligibleBookings.filter((b) => !b.hasReviewed);

  return (
    <div className="customer-page customer-reviews-page">
      {toast && <div className="customer-toast">{toast}</div>}

      <section className="customer-page-header customer-reviews-hero">
        <div>
          <p className="customer-eyebrow">HallHub Ratings</p>
          <h1>Reviews &amp; Star Ratings</h1>
          <p>
            Rate your completed hotel stays and help other organizers find the
            finest venues in Hargeisa.
          </p>
        </div>
        <Link to="/hotels" className="customer-gold-btn">
          Explore Hotels
        </Link>
      </section>

      {/* REVIEW ELIGIBILITY NOTICE (Requirement 4) */}
      <section className="hh-eligibility-banner">
        <div className="hh-eligibility-icon">ℹ️</div>
        <div>
          <h4>Review Eligibility Rules</h4>
          <p>
            To ensure genuine and trustworthy ratings, reviews and star ratings
            can only be submitted after your booking is confirmed and the hotel
            service has been provided (event date has passed).
          </p>
        </div>
      </section>

      <div className="mb-toolbar customer-reviews-toolbar">
        <div
          className="booking-filter-tabs mb-filter-tabs"
          role="tablist"
          aria-label="Review tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'eligible'}
            className={`booking-filter-tab${activeTab === 'eligible' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('eligible')}
          >
            Ready to Rate ({unreviewedBookings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'submitted'}
            className={`booking-filter-tab${activeTab === 'submitted' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('submitted')}
          >
            My Submitted Reviews ({myReviews.length})
          </button>
        </div>
      </div>

      {loading && <p className="customer-status">Loading reviews...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && activeTab === 'eligible' && (
        <div className="customer-reviews-tab-content">
          {unreviewedBookings.length === 0 ? (
            <div className="customer-empty-panel">
              <p className="customer-empty-title">
                No unreviewed completed stays
              </p>
              <p className="customer-empty">
                {myReviews.length > 0
                  ? 'Great job! You have reviewed all your completed hotel bookings.'
                  : 'Once your confirmed bookings take place, you will be invited to leave a star rating and review.'}
              </p>
              <Link to="/hotels" className="customer-gold-btn">
                Browse More Hotels
              </Link>
            </div>
          ) : (
            <div className="customer-eligible-list">
              {unreviewedBookings.map((b) => (
                <article key={b._id} className="customer-eligible-card">
                  <img
                    src={resolveImage(
                      b.hotelId?.coverImage || b.hallId?.images?.[0]
                    )}
                    alt={b.hotelId?.hotelName || 'Hotel'}
                    className="customer-eligible-img"
                  />
                  <div className="customer-eligible-info">
                    <div className="customer-eligible-meta-top">
                      <span className="status-badge status-badge-confirmed">
                        ✓ Service Completed
                      </span>
                      <span className="customer-eligible-date">
                        Event Date: {formatDate(b.eventDate)}
                      </span>
                    </div>

                    <h3>{b.hotelId?.hotelName || 'Hotel'}</h3>
                    <p className="customer-eligible-sub">
                      {b.hallId?.hallName || 'Hall'} · {b.guestCount} guests ·{' '}
                      {b.hotelId?.city || 'Hargeisa'}
                    </p>

                    <div className="customer-eligible-actions">
                      <button
                        type="button"
                        className="customer-gold-btn"
                        onClick={() => handleOpenReview(b)}
                      >
                        ⭐ Rate &amp; Write Review
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !error && activeTab === 'submitted' && (
        <div className="customer-reviews-tab-content">
          {myReviews.length === 0 ? (
            <div className="customer-empty-panel">
              <p className="customer-empty-title">No submitted reviews yet</p>
              <p className="customer-empty">
                Complete a hotel stay to rate and review your experience.
              </p>
            </div>
          ) : (
            <div className="customer-submitted-reviews-list">
              {myReviews.map((rev) => (
                <article key={rev._id} className="customer-submitted-review-card">
                  <div className="customer-submitted-review-head">
                    <div>
                      <span className="customer-submitted-badge">
                        Verified Experience
                      </span>
                      <h3>{rev.hotelId?.hotelName || 'Hotel'}</h3>
                      <p className="customer-submitted-hotel-place">
                        {rev.hotelId?.city} · {rev.hotelId?.address}
                      </p>
                    </div>

                    <div className="customer-submitted-rating-box">
                      <StarRating rating={rev.rating} size="md" />
                      <span className="customer-submitted-date">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  {rev.comment ? (
                    <p className="customer-submitted-comment">“{rev.comment}”</p>
                  ) : (
                    <p className="customer-submitted-no-comment">
                      <em>No written comment provided.</em>
                    </p>
                  )}

                  <div className="customer-submitted-actions">
                    <button
                      type="button"
                      className="mb-btn mb-btn-secondary"
                      onClick={() =>
                        handleOpenReview(
                          {
                            _id: rev.bookingId?._id || rev.bookingId,
                            hotelId: rev.hotelId,
                            eventDate: rev.bookingId?.eventDate,
                          },
                          rev
                        )
                      }
                    >
                      ✎ Edit Review
                    </button>
                    <button
                      type="button"
                      className="mb-btn mb-btn-danger"
                      disabled={deletingId === rev._id}
                      onClick={() => handleDeleteReview(rev._id)}
                    >
                      {deletingId === rev._id ? 'Deleting...' : '🗑 Delete'}
                    </button>
                    <Link
                      to={`/hotels/${rev.hotelId?._id || rev.hotelId}`}
                      className="mb-btn mb-btn-primary"
                    >
                      View Hotel Page
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          initialReview={selectedReview}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}

export default CustomerReviews;
