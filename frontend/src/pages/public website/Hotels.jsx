import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Navbar from '../../components/Navbar';
import HotelCard from '../../components/HotelCard';
import StarRating from '../../components/StarRating';
import { API_BASE } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const resolveImage = (image) => {
  if (!image) return '/banner01.png';
  if (image.startsWith('http')) return image;
  return `${API_BASE}${image}`;
};

const emptyFilters = { q: '', minCapacity: '', maxPrice: '', minRating: '' };
const ITEMS_PER_ROW = 4; // 4 hotels per row (4-column layout)

function Hotels() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q')?.trim() || '';
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [capacityTerm, setCapacityTerm] = useState('');
  const [maxPriceTerm, setMaxPriceTerm] = useState('');
  const [minRatingTerm, setMinRatingTerm] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (4-column) | 'detailed'

  const [filters, setFilters] = useState({
    ...emptyFilters,
    q: initialQuery,
  });

  useEffect(() => {
    const nextQuery = searchParams.get('q')?.trim() || '';
    setSearchTerm(nextQuery);
    setFilters((prev) => ({ ...prev, q: nextQuery }));
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    filters.q || filters.minCapacity || filters.maxPrice || filters.minRating
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = {};
        if (filters.q) params.q = filters.q;
        if (filters.minCapacity) params.minCapacity = filters.minCapacity;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;

        const { data } = await api.get('/api/hotels', {
          params: Object.keys(params).length ? params : undefined,
        });

        let list = data.hotels || [];

        // Filter by minRating if specified
        if (filters.minRating) {
          const minR = Number(filters.minRating);
          list = list.filter((h) => (Number(h.averageRating) || 0) >= minR);
        }

        // Sort descending based on star rating (Requirement 2 & 5)
        list.sort((a, b) => {
          const rA = Number(a.averageRating) || 0;
          const rB = Number(b.averageRating) || 0;
          if (rB !== rA) return rB - rA;
          const cA = Number(a.reviewCount) || 0;
          const cB = Number(b.reviewCount) || 0;
          if (cB !== cA) return cB - cA;
          return String(a.hotelName || '').localeCompare(String(b.hotelName || ''));
        });

        setHotels(list);
        setStartIndex(0);
      } catch (err) {
        setError(getApiError(err, 'Unable to load hotels'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters]);

  const handleSearch = (event) => {
    event.preventDefault();
    setFilters({
      q: searchTerm.trim(),
      minCapacity: capacityTerm.trim(),
      maxPrice: maxPriceTerm.trim(),
      minRating: minRatingTerm.trim(),
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setCapacityTerm('');
    setMaxPriceTerm('');
    setMinRatingTerm('');
    setFilters(emptyFilters);
  };

  const totalHalls = useMemo(
    () =>
      hotels.reduce(
        (sum, hotel) => sum + (hotel.halls?.length ?? hotel.hallCount ?? 0),
        0
      ),
    [hotels]
  );

  const totalHotels = hotels.length;
  const maxStart = Math.max(0, totalHotels - ITEMS_PER_ROW);
  const visibleHotels = hotels.slice(startIndex, startIndex + ITEMS_PER_ROW);

  const canGoNext = startIndex + ITEMS_PER_ROW < totalHotels;
  const canGoPrev = startIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setStartIndex((prev) => Math.min(maxStart, prev + ITEMS_PER_ROW));
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setStartIndex((prev) => Math.max(0, prev - ITEMS_PER_ROW));
    }
  };

  const totalPages = Math.ceil(totalHotels / ITEMS_PER_ROW);
  const currentPage = Math.floor(startIndex / ITEMS_PER_ROW) + 1;
  const currentEnd = Math.min(startIndex + ITEMS_PER_ROW, totalHotels);

  const resultsLabel = useMemo(() => {
    if (loading) return 'Loading…';
    const counts = `${hotels.length} hotel${hotels.length === 1 ? '' : 's'} · ${totalHalls} hall${totalHalls === 1 ? '' : 's'}`;
    if (!hasActiveFilters) return `${counts} (Sorted by Star Rating)`;
    return `${counts} matching filters`;
  }, [loading, hotels.length, totalHalls, hasActiveFilters]);

  const emptyMessage = hasActiveFilters
    ? 'No hotels or halls match your search criteria. Try adjusting your filters.'
    : 'No hotels found. Try another search query.';

  return (
    <main className="hh-page">
      <div className="venues-nav-wrap">
        <Navbar />
      </div>

      <section className="hh-hero">
        <div className="hh-hero-inner">
          <h1 className="hh-brand">HallHub</h1>
          <p className="hh-section-title">Hotels &amp; Event Halls</p>
          <p className="hh-hero-sub">
            Discover premier hotels and event venues, ranked by verified customer ratings.
          </p>

          <form className="hh-search" onSubmit={handleSearch}>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Hotel name or city..."
              aria-label="Search hotels"
              className="hh-search-main"
            />
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={capacityTerm}
              onChange={(event) => setCapacityTerm(event.target.value)}
              placeholder="Min guests"
              aria-label="Minimum capacity"
              className="hh-search-num"
            />
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={maxPriceTerm}
              onChange={(event) => setMaxPriceTerm(event.target.value)}
              placeholder="Max $/day"
              aria-label="Maximum price per day"
              className="hh-search-num"
            />
            <select
              value={minRatingTerm}
              onChange={(e) => setMinRatingTerm(e.target.value)}
              aria-label="Minimum rating"
              className="hh-search-select"
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5+ Stars</option>
              <option value="4.0">★ 4.0+ Stars</option>
              <option value="3.0">★ 3.0+ Stars</option>
            </select>
            <button type="submit">Search</button>
            {hasActiveFilters ? (
              <button
                type="button"
                className="hh-search-clear"
                onClick={handleClear}
              >
                Clear
              </button>
            ) : null}
          </form>
        </div>
      </section>

      <section className="hh-body">
        <div className="hh-body-head">
          <div className="hh-results-summary-left">
            <p>{resultsLabel}</p>
            <span className="hh-sort-indicator-pill">
              ⭐ Highest-Rated First
            </span>
          </div>

          <div className="hh-view-controls">
            <button
              type="button"
              className={`hh-view-toggle-btn${viewMode === 'grid' ? ' is-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="4-Column Hotel Grid View"
            >
              ⊞ 4-Column Grid
            </button>
            <button
              type="button"
              className={`hh-view-toggle-btn${viewMode === 'detailed' ? ' is-active' : ''}`}
              onClick={() => setViewMode('detailed')}
              title="Detailed Hotel & Halls View"
            >
              ☰ Detailed List
            </button>
          </div>
        </div>

        {error && <p className="hh-empty hh-error">{error}</p>}

        {loading && (
          <div className="hh-4col-hotel-grid" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="hh-skeleton-block"
                style={{ height: 380, borderRadius: 20 }}
              />
            ))}
          </div>
        )}

        {!loading && !error && hotels.length === 0 && (
          <p className="hh-empty">{emptyMessage}</p>
        )}

        {/* 4-COLUMN LAYOUT WITH FORWARD ARROW (Requirement 1 & 2) */}
        {!loading && !error && hotels.length > 0 && viewMode === 'grid' && (
          <div className="hh-4col-wrapper">
            <div className="hh-4col-toolbar">
              <span className="hh-4col-status-text">
                Showing hotels {startIndex + 1}–{currentEnd} of {totalHotels} (4 hotels per row)
              </span>

              {totalHotels > ITEMS_PER_ROW && (
                <div className="hh-4col-arrow-group">
                  <button
                    type="button"
                    className="featured-slider-btn is-prev"
                    onClick={handlePrev}
                    disabled={!canGoPrev}
                    aria-label="Previous 4 hotels"
                    title="Previous 4 hotels"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="featured-slider-btn is-next"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    aria-label="Next 4 hotels"
                    title="Next 4 hotels (forward)"
                  >
                    ›
                  </button>
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
                  const pageStart = pageIdx * ITEMS_PER_ROW;
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
          </div>
        )}

        {/* DETAILED LIST VIEW */}
        {!loading && !error && hotels.length > 0 && viewMode === 'detailed' && (
          <div className="hh-list">
            {hotels.map((hotel, hotelIndex) => {
              const halls = hotel.halls || [];
              const avgRating = Number(hotel.averageRating) || 0;
              const reviewCount = Number(hotel.reviewCount) || 0;

              return (
                <section
                  key={hotel._id}
                  className={`hh-hotel${hotel.isFeatured ? ' is-featured-hotel' : ''}`}
                  style={{ animationDelay: `${hotelIndex * 50}ms` }}
                >
                  <header className="hh-hotel-head">
                    <div className="hh-hotel-head-main">
                      <div className="hh-hotel-badges-row">
                        <p className="hh-hotel-place">
                          {hotel.city}
                          {hotel.address ? ` · ${hotel.address}` : ''}
                        </p>
                        <div className="hh-hotel-badges-right">
                          <StarRating
                            rating={avgRating}
                            reviewCount={reviewCount}
                            size="sm"
                          />
                          {hotel.isFeatured ? (
                            <span className="hh-featured-badge">⭐ Featured</span>
                          ) : null}
                        </div>
                      </div>
                      <h2>
                        <Link
                          to={`/hotels/${hotel._id}`}
                          className="hh-hotel-name"
                        >
                          {hotel.hotelName}
                        </Link>
                      </h2>
                      {hotel.description ? (
                        <p className="hh-hotel-description">{hotel.description}</p>
                      ) : null}
                    </div>
                    <div className="hh-hotel-actions">
                      <span className="hh-hotel-count">
                        {halls.length || hotel.hallCount || 0} hall
                        {(halls.length || hotel.hallCount || 0) === 1 ? '' : 's'}
                      </span>
                      <Link to={`/hotels/${hotel._id}`} className="hh-hotel-link">
                        View hotel &amp; halls
                      </Link>
                    </div>
                  </header>

                  {halls.length === 0 ? (
                    <div className="hh-empty-panel">
                      <p className="hh-empty-inline">No halls listed yet.</p>
                    </div>
                  ) : (
                    <div className="hh-hall-grid">
                      {halls.map((hall, hallIndex) => (
                        <article
                          key={hall._id}
                          className={`hh-hall-card${hotel.isFeatured ? ' is-featured-hall' : ''}`}
                          style={{
                            animationDelay: `${hotelIndex * 50 + hallIndex * 35}ms`,
                          }}
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
                            />
                            {hotel.isFeatured || hall.isFeatured ? (
                              <span className="hh-hall-featured-pill">
                                ⭐ Featured
                              </span>
                            ) : null}
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
                              Preview hall
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Hotels;
