import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE, getUser } from '../utils/auth';
import api from '../utils/api';

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

function FeaturedVenues() {
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(0);

  const currentUser = getUser();
  const isHotelOwner = currentUser?.role === 'hotel_owner';

  useEffect(() => {
    let isMounted = true;

    const loadFeatured = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/plus/featured');
        if (isMounted) {
          setFeaturedHotels(data.featuredHotels || []);
          setStart(0);
        }
      } catch (err) {
        if (isMounted) {
          setFeaturedHotels([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  // Only active Plus/featured hotels appear in this section
  if (featuredHotels.length === 0) {
    if (isHotelOwner) {
      return (
        <section className="featured-venues-section hh-plus-empty-promo" id="venues">
          <div className="hh-plus-owner-teaser">
            <span className="hh-featured-pill">⭐ HallHub Plus</span>
            <h3>Promote Your Venue on the HallHub Homepage</h3>
            <p>
              Get top placement, more customer inquiries, and a prime spot in the
              Featured Venues showcase.
            </p>
            <Link to="/owner/plus" className="customer-gold-btn">
              Upgrade to HallHub Plus ⭐
            </Link>
          </div>
        </section>
      );
    }
    return null;
  }

  const visibleCount = 3;
  const maxStart = Math.max(0, featuredHotels.length - visibleCount);
  const visible = featuredHotels.slice(start, start + visibleCount);
  const canSlide = featuredHotels.length > visibleCount;

  const goPrev = () => setStart((prev) => Math.max(0, prev - 1));
  const goNext = () => setStart((prev) => Math.min(maxStart, prev + 1));

  return (
    <section className="featured-venues-section hh-plus-featured-section" id="venues">
      <div className="section-header">
        <div className="hh-featured-header-kicker">
          <span className="hh-featured-star">⭐</span>
          <span className="section-label">Featured Venues</span>
        </div>
        <h2>Promoted Venues in Hargeisa</h2>
        <p className="hh-featured-subtitle">Promoted by HallHub Plus</p>
      </div>

      <div className="featured-slider">
        {canSlide && (
          <button
            type="button"
            className="featured-slider-btn is-prev"
            onClick={goPrev}
            disabled={start === 0}
            aria-label="Previous venues"
          >
            ‹
          </button>
        )}

        <div className="venue-grid featured-venue-grid">
          {visible.map((hotel) => {
            const firstHall = hotel.halls?.[0];
            const coverSrc = resolveImage(
              hotel.coverImage || firstHall?.images?.[0]
            );
            const priceText = hotel.minPrice
              ? `$${Number(hotel.minPrice).toLocaleString()}/day`
              : 'Flexible rates';
            const capacityText = hotel.maxCapacity
              ? `Up to ${hotel.maxCapacity} guests`
              : 'Multi-capacity';
            const hallsCountText = `${hotel.hallCount || 0} hall${
              hotel.hallCount === 1 ? '' : 's'
            } available`;

            return (
              <article key={hotel._id} className="venue-card hh-featured-card">
                <div className="venue-card-image-wrap">
                  <img
                    src={coverSrc}
                    alt={hotel.hotelName}
                    className="venue-card-image"
                    onError={(event) => {
                      event.currentTarget.src = '/banner01.png';
                    }}
                  />
                  <div className="hh-featured-badge-overlay">
                    <span>⭐ Featured</span>
                  </div>
                  {hotel.maxCapacity > 0 && (
                    <span className="capacity-badge">{capacityText}</span>
                  )}
                </div>

                <div className="venue-card-body">
                  <div className="hh-card-meta-top">
                    <span className="hh-card-halls-count">{hallsCountText}</span>
                    <span className="hh-card-city">
                      📍 {hotel.city || 'Hargeisa'}
                    </span>
                  </div>

                  <h3>{hotel.hotelName}</h3>

                  <p className="venue-hotel">
                    {hotel.address
                      ? `${hotel.address}`
                      : 'Hargeisa banquet and event center'}
                  </p>

                  <div className="hh-card-price-row">
                    <div>
                      <span className="hh-price-label">Starting from</span>
                      <p className="price-tag">{priceText}</p>
                    </div>
                  </div>

                  <div className="hh-card-actions">
                    <Link
                      to={`/hotels/${hotel._id}`}
                      className="venue-card-btn hh-featured-action-btn"
                    >
                      View Venue &amp; Halls
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {canSlide && (
          <button
            type="button"
            className="featured-slider-btn is-next"
            onClick={goNext}
            disabled={start >= maxStart}
            aria-label="Next venues"
          >
            ›
          </button>
        )}
      </div>

      <div className="featured-venues-cta">
        <Link to="/hotels" className="customer-gold-btn">
          Explore All Venues
        </Link>
      </div>
    </section>
  );
}

export default FeaturedVenues;
