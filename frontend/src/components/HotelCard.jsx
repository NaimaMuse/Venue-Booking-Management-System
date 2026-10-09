import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { API_BASE } from '../utils/auth';

const resolveImage = (image) => {
  if (!image) return '/banner01.png';
  if (image.startsWith('http')) return image;
  return `${API_BASE}${image}`;
};

export function HotelCard({ hotel }) {
  const halls = hotel.halls || [];
  const hallCount = hotel.hallCount || halls.length || 0;
  const coverSrc = resolveImage(hotel.coverImage || halls[0]?.images?.[0]);

  let minPrice = hotel.minPrice;
  let maxCapacity = hotel.maxCapacity;

  if (!minPrice && halls.length > 0) {
    const prices = halls.map((h) => Number(h.pricePerDay) || 0).filter((p) => p > 0);
    if (prices.length > 0) minPrice = Math.min(...prices);
  }

  if (!maxCapacity && halls.length > 0) {
    const caps = halls.map((h) => Number(h.capacity) || 0).filter((c) => c > 0);
    if (caps.length > 0) maxCapacity = Math.max(...caps);
  }

  const priceText = minPrice
    ? `$${Number(minPrice).toLocaleString()}/day`
    : 'Flexible rates';

  const capacityText = maxCapacity
    ? `Up to ${maxCapacity} guests`
    : 'Multi-capacity';

  const avgRating = Number(hotel.averageRating) || 0;
  const reviewCount = Number(hotel.reviewCount) || 0;

  return (
    <article className={`hh-hotel-card-item${hotel.isFeatured ? ' is-featured-hotel-card' : ''}`}>
      <div className="hh-hotel-card-image-wrap">
        <Link
          to={`/hotels/${hotel._id}`}
          className="hh-hotel-card-photo-link"
          aria-label={`View ${hotel.hotelName}`}
        >
          <img
            src={coverSrc}
            alt={hotel.hotelName}
            className="hh-hotel-card-img"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/banner01.png';
            }}
          />
        </Link>

        {hotel.isFeatured && (
          <div className="hh-hotel-card-badge is-featured">
            <span>⭐ Featured</span>
          </div>
        )}

        <div className="hh-hotel-card-rating-badge">
          <span className="hh-hotel-star-icon">★</span>
          <span className="hh-hotel-star-num">
            {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
          </span>
          {reviewCount > 0 && (
            <span className="hh-hotel-star-reviews">({reviewCount})</span>
          )}
        </div>

        {maxCapacity > 0 && (
          <span className="hh-hotel-card-capacity">{capacityText}</span>
        )}
      </div>

      <div className="hh-hotel-card-body">
        <div className="hh-hotel-card-meta-top">
          <span className="hh-hotel-card-halls">
            {hallCount} {hallCount === 1 ? 'hall' : 'halls'}
          </span>
          <span className="hh-hotel-card-city">
            📍 {hotel.city || 'Hargeisa'}
          </span>
        </div>

        <h3 className="hh-hotel-card-title">
          <Link to={`/hotels/${hotel._id}`} className="hh-hotel-card-name-link">
            {hotel.hotelName}
          </Link>
        </h3>

        <p className="hh-hotel-card-address">
          {hotel.address || 'Hargeisa, Somaliland'}
        </p>

        <div className="hh-hotel-card-rating-row">
          <StarRating
            rating={avgRating}
            reviewCount={reviewCount}
            size="sm"
            showValue={false}
            showCount={true}
          />
        </div>

        <div className="hh-hotel-card-footer">
          <div className="hh-hotel-card-price">
            <span className="hh-hotel-price-label">Starting from</span>
            <p className="hh-hotel-price-val">{priceText}</p>
          </div>

          <Link
            to={`/hotels/${hotel._id}`}
            className="hh-hotel-card-btn"
          >
            View Hotel
          </Link>
        </div>
      </div>
    </article>
  );
}

export default HotelCard;
