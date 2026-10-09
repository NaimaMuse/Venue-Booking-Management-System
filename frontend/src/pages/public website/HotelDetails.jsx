import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../../components/Navbar';
import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
import { API_BASE, formatDate, getInitials, getUser } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const resolveImage = (image) => {
  if (!image) return '/hotel-hero-moole.png';
  if (image.startsWith('http')) return image;
  return `${API_BASE}${image}`;
};

function HotelDetails() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [halls, setHalls] = useState([]);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    distribution: {},
    averageRating: 0,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibleBooking, setEligibleBooking] = useState(null);
  const [customerReview, setCustomerReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const currentUser = getUser();
  const isCustomer = currentUser?.role === 'customer';

  const loadHotelAndReviews = async () => {
    try {
      setLoading(true);
      setError('');

      const [hotelRes, reviewsRes] = await Promise.all([
        api.get(`/api/hotels/${id}`),
        api.get(`/api/reviews/hotel/${id}`).catch(() => ({ data: { reviews: [] } })),
      ]);

      setHotel(hotelRes.data.hotel || null);
      setHalls(hotelRes.data.halls || []);
      setReviewsData(
        reviewsRes.data || {
          reviews: [],
          distribution: {},
          averageRating: 0,
          reviewCount: 0,
        }
      );

      // Check if logged-in customer has an eligible completed booking for this hotel
      if (isCustomer) {
        try {
          const eligibleRes = await api.get('/api/reviews/eligible-bookings');
          const matched = (eligibleRes.data.bookings || []).find(
            (b) => String(b.hotelId?._id || b.hotelId) === String(id)
          );
          if (matched) {
            setEligibleBooking(matched);
            if (matched.review) {
              setCustomerReview(matched.review);
            }
          }
        } catch (e) {
          // Non-blocking
        }
      }
    } catch (err) {
      setError(getApiError(err, 'Unable to load hotel details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelAndReviews();
  }, [id]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const heroImage = useMemo(() => {
    if (!hotel) return '/hotel-hero-moole.png';
    const name = String(hotel.hotelName || '').toLowerCase();
    if (name.includes('moole')) return '/hotel-hero-moole.png';
    return resolveImage(hotel.coverImage || halls[0]?.images?.[0]);
  }, [hotel, halls]);

  const scrollToHalls = () => {
    const section = document.getElementById('hotel-halls');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToReviews = () => {
    const section = document.getElementById('hotel-reviews');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReviewSuccess = () => {
    setToastMessage('Thank you! Your rating and review have been submitted.');
    loadHotelAndReviews();
  };

  const hasAbout = Boolean(hotel?.description?.trim());
  const hasContact = Boolean(hotel?.contactPhone || hotel?.address || hotel?.city);

  const avgRating = Number(hotel?.averageRating || reviewsData.averageRating || 0);
  const reviewCount = Number(hotel?.reviewCount || reviewsData.reviewCount || 0);
  const reviews = reviewsData.reviews || [];
  const distribution = reviewsData.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <main className="hh-page hotel-details-page">
      <div className="venues-nav-wrap">
        <Navbar />
      </div>

      {toastMessage && <div className="customer-toast">{toastMessage}</div>}

      <section className="hh-body hh-details-body">
        {loading && (
          <div className="hh-skeleton-list" aria-hidden="true">
            <div className="hh-skeleton-block hh-skeleton-hero" />
            <div className="hh-skeleton-block" />
          </div>
        )}

        {error && <p className="hh-empty hh-error">{error}</p>}

        {!loading && !error && hotel && (
          <>
            <div className="hh-details-hero">
              <img
                src={heroImage}
                alt={hotel.hotelName}
                onError={(event) => {
                  event.currentTarget.src = '/hotel-hero-moole.png';
                }}
              />
              <div className="hh-details-hero-shade" aria-hidden="true" />
              <div className="hh-details-hero-ornament" aria-hidden="true" />
              <div className="hh-details-hero-copy">
                <p className="hh-eyebrow hh-details-eyebrow">HallHub</p>
                <div className="hh-details-title-row">
                  <p className="hh-details-hero-place">
                    {hotel.city}
                    {hotel.address ? ` · ${hotel.address}` : ''}
                  </p>
                  {hotel.isFeatured ? (
                    <span className="hh-featured-badge">⭐ Featured Venue</span>
                  ) : null}
                </div>
                <h1>{hotel.hotelName}</h1>
                <div className="hh-details-hero-meta-row">
                  {/* Star Rating Pill */}
                  <button
                    type="button"
                    className="hh-details-hero-pill is-rating-pill"
                    onClick={scrollToReviews}
                    title="View customer reviews"
                  >
                    <span className="hh-hero-pill-star">★</span>
                    <strong>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</strong>
                    <span>
                      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </button>

                  {hotel.isFeatured ? (
                    <span className="hh-details-hero-pill is-featured-pill">
                      ⭐ HallHub Plus Partner
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="hh-details-hero-pill"
                    onClick={scrollToHalls}
                  >
                    {halls.length} hall{halls.length === 1 ? '' : 's'} available
                  </button>
                  {hotel.contactPhone ? (
                    <span className="hh-details-hero-pill is-soft">
                      {hotel.contactPhone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {(hasAbout || hasContact) && (
              <div className="hh-details-strip">
                {hasAbout && (
                  <div className="hh-details-strip-about">
                    <span>About</span>
                    <p>{hotel.description.trim()}</p>
                  </div>
                )}
                {hasContact && (
                  <ul className="hh-details-strip-meta">
                    {hotel.contactPhone ? (
                      <li>
                        <span>Phone</span>
                        <strong>{hotel.contactPhone}</strong>
                      </li>
                    ) : null}
                    {hotel.address ? (
                      <li>
                        <span>Location</span>
                        <strong>{hotel.address}</strong>
                      </li>
                    ) : null}
                    {hotel.city ? (
                      <li>
                        <span>City</span>
                        <strong>{hotel.city}</strong>
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            )}

            {/* AVAILABLE HALLS SECTION */}
            <section id="hotel-halls" className="hh-details-halls">
              <header className="hh-hotel-head">
                <div>
                  <p className="hh-hotel-place">Event Spaces</p>
                  <h2>
                    {halls.length === 0
                      ? 'No halls yet'
                      : `${halls.length} Available Hall${halls.length === 1 ? '' : 's'}`}
                  </h2>
                </div>
              </header>

              {halls.length === 0 ? (
                <p className="hh-empty-inline">No available halls listed yet.</p>
              ) : (
                <div className="hh-hall-grid">
                  {halls.map((hall, hallIndex) => (
                    <article
                      key={hall._id}
                      className="hh-hall-card"
                      style={{ animationDelay: `${hallIndex * 45}ms` }}
                    >
                      <Link
                        to={`/venues/${hall._id}`}
                        className="hh-hall-photo"
                        aria-label={`View ${hall.hallName} details`}
                      >
                        <img
                          src={resolveImage(hall.images?.[0])}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = '/banner01.png';
                          }}
                        />
                        <span className="hh-hall-photo-shade" />
                      </Link>
                      <div className="hh-hall-info">
                        <h3>{hall.hallName}</h3>
                        <p>
                          {hall.capacity} guests
                          <span aria-hidden="true">·</span>
                          ${hall.pricePerDay}/day
                        </p>
                        <Link
                          to={`/venues/${hall._id}`}
                          className="hh-hall-open"
                        >
                          Book Hall
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* CUSTOMER REVIEWS & STAR RATINGS SECTION */}
            <section id="hotel-reviews" className="hh-details-reviews-section">
              <header className="hh-reviews-head">
                <div>
                  <p className="hh-hotel-place">Verified Reviews</p>
                  <h2>Customer Reviews &amp; Star Ratings</h2>
                  <p className="hh-reviews-head-sub">
                    Ratings from customers who completed bookings at {hotel.hotelName}
                  </p>
                </div>

                {eligibleBooking && (
                  <button
                    type="button"
                    className="customer-gold-btn hh-write-review-btn"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    ⭐ {customerReview ? 'Edit Your Review' : 'Rate & Review Hotel'}
                  </button>
                )}
              </header>

              {/* OVERALL RATING CARD */}
              <div className="hh-rating-summary-card">
                <div className="hh-rating-score-box">
                  <span className="hh-rating-large-number">
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                  <div className="hh-rating-stars-large">
                    <StarRating rating={avgRating} size="md" showValue={false} showCount={false} />
                  </div>
                  <p className="hh-rating-score-label">
                    {reviewCount > 0
                      ? `Based on ${reviewCount} customer ${reviewCount === 1 ? 'review' : 'reviews'}`
                      : 'No customer ratings yet'}
                  </p>
                </div>

                <div className="hh-rating-breakdown">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[star] || 0;
                    const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                    return (
                      <div key={star} className="hh-breakdown-row">
                        <span className="hh-breakdown-star-label">{star} ★</span>
                        <div className="hh-breakdown-bar-track">
                          <div
                            className="hh-breakdown-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="hh-breakdown-count">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REVIEWS LIST */}
              {reviews.length === 0 ? (
                <div className="hh-empty-reviews-box">
                  <p className="hh-empty-reviews-title">No reviews yet for this hotel</p>
                  <p className="hh-empty-reviews-sub">
                    Verified reviews will appear here once customers complete their events and share feedback.
                  </p>
                </div>
              ) : (
                <div className="hh-reviews-list">
                  {reviews.map((rev) => {
                    const initials = getInitials(rev.customerId?.fullName || 'Customer');
                    return (
                      <article key={rev._id} className="hh-review-card">
                        <div className="hh-review-card-top">
                          <div className="hh-reviewer-profile">
                            <div className="hh-reviewer-avatar">
                              {rev.customerId?.avatarUrl ? (
                                <img
                                  src={resolveImage(rev.customerId.avatarUrl)}
                                  alt={rev.customerId.fullName}
                                />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div>
                              <strong className="hh-reviewer-name">
                                {rev.customerId?.fullName || 'Verified Customer'}
                              </strong>
                              <span className="hh-review-date">
                                Reviewed on {formatDate(rev.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="hh-review-rating-badge">
                            <StarRating rating={rev.rating} size="sm" showValue={true} showCount={false} />
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="hh-review-text">{rev.comment}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>

      {reviewModalOpen && eligibleBooking && (
        <ReviewModal
          booking={eligibleBooking}
          initialReview={customerReview}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </main>
  );
}

export default HotelDetails;
