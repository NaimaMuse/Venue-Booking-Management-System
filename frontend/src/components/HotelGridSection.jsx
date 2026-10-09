import React, { useState } from 'react';
import HotelCard from './HotelCard';

export function HotelGridSection({
  hotels = [],
  title = 'Available Hotels & Venues',
  subtitle = 'Explore top-rated hotels and event venues in Hargeisa',
  itemsPerPage = 4,
}) {
  const [startIndex, setStartIndex] = useState(0);

  if (!hotels || hotels.length === 0) {
    return null;
  }

  // Ensure hotels are sorted in descending order by average star rating
  const sortedHotels = [...hotels].sort((a, b) => {
    const rA = Number(a.averageRating) || 0;
    const rB = Number(b.averageRating) || 0;
    if (rB !== rA) return rB - rA;
    const cA = Number(a.reviewCount) || 0;
    const cB = Number(b.reviewCount) || 0;
    if (cB !== cA) return cB - cA;
    return String(a.hotelName || '').localeCompare(String(b.hotelName || ''));
  });

  const totalHotels = sortedHotels.length;
  const maxStart = Math.max(0, totalHotels - itemsPerPage);
  const visibleHotels = sortedHotels.slice(startIndex, startIndex + itemsPerPage);

  const canGoNext = startIndex + itemsPerPage < totalHotels;
  const canGoPrev = startIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setStartIndex((prev) => Math.min(maxStart, prev + itemsPerPage));
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setStartIndex((prev) => Math.max(0, prev - itemsPerPage));
    }
  };

  const currentPage = Math.floor(startIndex / itemsPerPage) + 1;
  const totalPages = Math.ceil(totalHotels / itemsPerPage);

  const currentEnd = Math.min(startIndex + itemsPerPage, totalHotels);

  return (
    <section className="hh-4col-hotels-section" id="hotel-listings">
      <div className="section-header hh-4col-header">
        <div className="hh-4col-header-left">
          <span className="section-label">Top Rated Listings</span>
          <h2>{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>

        {totalHotels > itemsPerPage && (
          <div className="hh-4col-nav-controls">
            <span className="hh-4col-page-indicator">
              Showing {startIndex + 1}–{currentEnd} of {totalHotels} hotels
            </span>
            <div className="hh-4col-arrow-group">
              <button
                type="button"
                className="hh-4col-arrow-btn is-prev"
                onClick={handlePrev}
                disabled={!canGoPrev}
                aria-label="Previous set of hotels"
                title="Previous hotels"
              >
                ‹
              </button>
              <button
                type="button"
                className="hh-4col-arrow-btn is-next"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="Next set of hotels"
                title="Next hotels"
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
        <div className="hh-4col-pagination-dots" aria-label="Hotel pages">
          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const pageStart = pageIdx * itemsPerPage;
            const isActive = startIndex === pageStart;
            return (
              <button
                key={pageIdx}
                type="button"
                className={`hh-4col-dot${isActive ? ' is-active' : ''}`}
                onClick={() => setStartIndex(pageStart)}
                aria-label={`Go to page ${pageIdx + 1}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HotelGridSection;
