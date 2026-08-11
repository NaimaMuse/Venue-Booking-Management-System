import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Navbar from '../../components/Navbar';
import { API_BASE } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const emptyFilters = { q: '', minCapacity: '', maxPrice: '' };

function Hotels() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q')?.trim() || '';
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [capacityTerm, setCapacityTerm] = useState('');
  const [maxPriceTerm, setMaxPriceTerm] = useState('');
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
    filters.q || filters.minCapacity || filters.maxPrice
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = {};
        if (filters.q) {
          params.q = filters.q;
        }
        if (filters.minCapacity) {
          params.minCapacity = filters.minCapacity;
        }
        if (filters.maxPrice) {
          params.maxPrice = filters.maxPrice;
        }

        const { data } = await api.get('/api/hotels', {
          params: Object.keys(params).length ? params : undefined,
        });
        setHotels(data.hotels || []);
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
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setCapacityTerm('');
    setMaxPriceTerm('');
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

  const resultsLabel = useMemo(() => {
    if (loading) {
      return 'Loading…';
    }

    const counts = `${hotels.length} hotel${hotels.length === 1 ? '' : 's'} · ${totalHalls} hall${totalHalls === 1 ? '' : 's'}`;

    if (!hasActiveFilters) {
      return `${hotels.length} hotels · ${totalHalls} halls`;
    }

    const bits = [];
    if (filters.q) {
      bits.push(`“${filters.q}”`);
    }
    if (filters.minCapacity) {
      bits.push(`${filters.minCapacity}+ guests`);
    }
    if (filters.maxPrice) {
      bits.push(`up to $${filters.maxPrice}/day`);
    }

    return `${counts} for ${bits.join(' · ')}`;
  }, [loading, hotels.length, totalHalls, hasActiveFilters, filters]);

  const focusedHotel =
    !loading && !error && filters.q && hotels.length === 1 ? hotels[0] : null;

  const emptyMessage = hasActiveFilters
    ? 'No halls match your filters. Try another name, capacity, or price.'
    : 'No hotels found. Try another name or city.';

  return (
    <main className="hh-page">
      <div className="venues-nav-wrap">
        <Navbar />
      </div>

      <section className="hh-hero">
        <div className="hh-hero-inner">
          {focusedHotel ? (
            <>
              <p className="hh-eyebrow">Hargeisa Hall Finder</p>
              <h1>{focusedHotel.hotelName}</h1>
              <p className="hh-hero-sub">
                {[focusedHotel.city, focusedHotel.address]
                  .filter(Boolean)
                  .join(' · ') || 'Halls at this hotel'}
              </p>
            </>
          ) : (
            <>
              <h1 className="hh-brand">Hargeisa Hall Finder</h1>
              <p className="hh-section-title">Hotels &amp; Halls</p>
              <p className="hh-hero-sub">
                Search by hotel, capacity, or price.
              </p>
            </>
          )}

          <form className="hh-search" onSubmit={handleSearch}>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Hotel name or city"
              aria-label="Search hotels"
              className="hh-search-main"
            />
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={capacityTerm}
              onChange={(event) => setCapacityTerm(event.target.value)}
              placeholder="Min capacity"
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
          <p>{resultsLabel}</p>
        </div>

        {error && <p className="hh-empty hh-error">{error}</p>}

        {loading && (
          <div className="hh-skeleton-list" aria-hidden="true">
            <div className="hh-skeleton-block" />
            <div className="hh-skeleton-block" />
          </div>
        )}

        {!loading && !error && hotels.length === 0 && (
          <p className="hh-empty">{emptyMessage}</p>
        )}

        {!loading && !error && hotels.length > 0 && (
          <div className="hh-list">
            {hotels.map((hotel, hotelIndex) => {
              const halls = hotel.halls || [];

              return (
                <section
                  key={hotel._id}
                  className="hh-hotel"
                  style={{ animationDelay: `${hotelIndex * 60}ms` }}
                >
                  <header className="hh-hotel-head">
                    <div>
                      <p className="hh-hotel-place">
                        {hotel.city}
                        {hotel.address ? ` · ${hotel.address}` : ''}
                      </p>
                      <h2>
                        <Link
                          to={`/hotels/${hotel._id}`}
                          className="hh-hotel-name"
                        >
                          {hotel.hotelName}
                        </Link>
                      </h2>
                    </div>
                    <span className="hh-hotel-count">
                      {halls.length} hall{halls.length === 1 ? '' : 's'}
                    </span>
                  </header>

                  {halls.length === 0 ? (
                    <p className="hh-empty-inline">No halls listed yet.</p>
                  ) : (
                    <div className="hh-hall-grid">
                      {halls.map((hall, hallIndex) => (
                        <article
                          key={hall._id}
                          className="hh-hall-card"
                          style={{
                            animationDelay: `${hotelIndex * 60 + hallIndex * 40}ms`,
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
