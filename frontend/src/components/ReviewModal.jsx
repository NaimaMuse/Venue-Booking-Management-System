import React, { useState } from 'react';
import StarRating from './StarRating';
import api, { getApiError } from '../utils/api';
import { formatDate } from '../utils/auth';

export function ReviewModal({
  booking,
  initialReview = null,
  isOpen,
  onClose,
  onSuccess,
}) {
  const [rating, setRating] = useState(initialReview?.rating || 5);
  const [comment, setComment] = useState(initialReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) {
    return null;
  }

  const hotelName =
    booking.hotelId?.hotelName || booking.hotelName || 'Selected Hotel';
  const hallName = booking.hallId?.hallName || booking.hallName || 'Hall';
  const eventDate = booking.eventDate ? formatDate(booking.eventDate) : 'Completed Event';
  const isEditing = Boolean(initialReview?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating (1 to 5 stars).');
      return;
    }

    try {
      setSubmitting(true);

      let response;
      if (isEditing) {
        response = await api.put(`/api/reviews/${initialReview._id}`, {
          rating,
          comment: comment.trim(),
        });
      } else {
        response = await api.post('/api/reviews', {
          bookingId: booking._id,
          rating,
          comment: comment.trim(),
        });
      }

      if (onSuccess) {
        onSuccess(response.data?.review || { rating, comment });
      }
      onClose();
    } catch (err) {
      setError(
        getApiError(
          err,
          'Unable to submit review. You must have completed your booking before reviewing.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="booking-modal-overlay hh-review-modal-overlay"
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="booking-modal hh-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="booking-modal-head">
          <div className="booking-modal-intro">
            <p className="hh-eyebrow booking-modal-eyebrow">Customer Experience</p>
            <h2 id="review-modal-title">
              {isEditing ? 'Edit Your Review' : 'Rate & Review Hotel'}
            </h2>
          </div>
          <button
            type="button"
            className="booking-modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="hh-review-form">
          {error && <p className="booking-form-error">{error}</p>}

          <div className="hh-review-context-card">
            <div>
              <p className="hh-review-hotel-name">{hotelName}</p>
              <p className="hh-review-event-details">
                {hallName} · Event Date: {eventDate}
              </p>
            </div>
            <span className="status-badge status-badge-confirmed">
              ✓ Service Completed
            </span>
          </div>

          <div className="hh-review-field">
            <label className="hh-review-label">
              Overall Star Rating <span className="hh-required">*</span>
            </label>
            <div className="hh-review-stars-wrap">
              <StarRating
                rating={rating}
                size="lg"
                interactive={true}
                onChange={(newRating) => setRating(newRating)}
                showValue={true}
                showCount={false}
              />
            </div>
          </div>

          <div className="hh-review-field">
            <label htmlFor="review-comment" className="hh-review-label">
              Your Review / Service Experience
            </label>
            <textarea
              id="review-comment"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience: venue ambiance, staff hospitality, air conditioning, setup..."
              maxLength="1000"
              className="hh-review-textarea"
            />
            <small className="hh-review-char-count">
              {comment.length} / 1000 characters
            </small>
          </div>

          <div className="hh-review-modal-actions">
            <button
              type="button"
              className="venue-summary-cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="customer-gold-btn hh-review-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? 'Submitting…'
                : isEditing
                ? 'Update Rating & Review'
                : 'Submit Rating & Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
