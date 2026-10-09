import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HotelCard from './HotelCard';
import api from '../utils/api';

function FeaturedVenues() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadHotels = async () => {
      try {
        setLoading(true);
        // Load approved hotels sorted by rating
        const { data } = await api.get('/api/hotels');
        if (isMounted) {
          const list = data.hotels || [];
          // Ensure sorted descending by average star rating
          list.sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0));
          setHotels(list);
          setStart(0);
        }
      } catch (err) {
        if (isMounted) {
          setHotels([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHotels();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="featured-venues-section hh-4col-hotels-section" id="venues">
        <div className="section-header hh-4col-header">
          <div className="hh-4col-header-left">
            <span className="section-label">Top Rated Listings</span>
            <h2>Hotels &amp; Event Venues</h2>
          </div>
        </div>
        <div className="hh-4col-hotel-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="hh-skeleton-block" style={{ height: 360, borderRadius: 20 }} />
          ))}
        </div>
      </section>
    );
  }

  if (hotels.length === 0) {
    return null;
  }

  // 4-column layout: 4 hotels per row
  const visibleCount = 4;
  const maxStart = Math.max(0, hotels.length - visibleCount);
  const visibleHotels = hotels.slice(start, start + visibleCount);
  const canSlide = hotels.length > visibleCount;

  const goPrev = () => setStart((prev) => Math.max(0, prev - visibleCount));
  const goNext = () => setStart((prev) => Math.min(maxStart, prev + visibleCount));

  const currentEnd = Math.min(start + visibleCount, hotels.length);
  const totalPages = Math.ceil(hotels.length / visibleCount);
  const currentPage = Math.floor(start / visibleCount) + 1;

  return (
    <section className="featured-venues-section hh-4col-hotels-section" id="venues">
      <div className="section-header hh-4col-header">
        <div className="hh-4col-header-left">
          <div className="hh-featured-header-kicker">
            <span className="hh-featured-star">⭐</span>
            <span className="section-label">Top Rated Venues</span>
          </div>
          <h2>Hotels &amp; Event Halls in Hargeisa</h2>
          <p className="hh-featured-subtitle">
            Ranked by authentic customer service reviews and star ratings
          </p>
        </div>

        {canSlide && (
          <div className="hh-4col-nav-controls">
            <span className="hh-4col-page-indicator">
              Showing {start + 1}–{currentEnd} of {hotels.length} hotels
            </span>
            <div className="hh-4col-arrow-group">
              <button
                type="button"
                className="featured-slider-btn is-prev"
                onClick={goPrev}
                disabled={start === 0}
                aria-label="Previous 4 hotels"
                title="Previous hotels"
              >
                ‹
              </button>
              <button
                type="button"
                className="featured-slider-btn is-next"
                onClick={goNext}
                disabled={start + visibleCount >= hotels.length}
                aria-label="Next 4 hotels"
                title="Next hotels (forward)"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hh-4col-hotel-grid">
        {visibleHotels.map((hotel) => (
          <HotelCard key={hotel._id} hotel={hotel} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="hh-4col-pagination-dots" aria-label="Hotel page indicator">
          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const pageStart = pageIdx * visibleCount;
            const isActive = start === pageStart;
            return (
              <button
                key={pageIdx}
                type="button"
                className={`hh-4col-dot${isActive ? ' is-active' : ''}`}
                onClick={() => setStart(pageStart)}
                aria-label={`Go to hotel set ${pageIdx + 1}`}
              />
            );
          })}
        </div>
      )}

      <div className="featured-venues-cta">
        <Link to="/hotels" className="customer-gold-btn">
          Explore All Hotels &amp; Halls ({hotels.length})
        </Link>
      </div>
    </section>
  );
}

export default FeaturedVenues;
