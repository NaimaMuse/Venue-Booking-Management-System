import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { API_BASE } from '../utils/auth';
import api, { getApiError } from '../utils/api';

const capacityOptions = [
  { label: 'All Capacities', value: 'all' },
  { label: 'Up to 200 Guests', value: '0-200' },
  { label: '200 - 500 Guests', value: '200-500' },
  { label: '500+ Guests', value: '500+' },
];

const getHallImage = (hall) => {
  const firstImage = hall?.images?.[0];
  if (!firstImage) {
    return '/banner01.png';
  }

  if (firstImage.startsWith('http')) {
    return firstImage;
  }

  return `${API_BASE}${firstImage}`;
};

const matchesCapacity = (capacity, filter) => {
  if (filter === 'all') {
    return true;
  }

  if (filter === '0-200') {
    return capacity <= 200;
  }

  if (filter === '200-500') {
    return capacity >= 200 && capacity <= 500;
  }

  if (filter === '500+') {
    return capacity >= 500;
  }

  return true;
};

function Venues() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('');

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/halls');
        setHalls(data.halls || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to fetch venues right now'));
      } finally {
        setLoading(false);
      }
    };

    fetchHalls();
  }, []);

  const filteredHalls = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const maxPrice = priceFilter === '' ? null : Number(priceFilter);

    return halls.filter((hall) => {
      const hallName = hall.hallName?.toLowerCase() || '';
      const description = hall.description?.toLowerCase() || '';
      const hotelName = hall.hotelId?.hotelName?.toLowerCase() || '';

      const matchesSearch =
        !query ||
        hallName.includes(query) ||
        description.includes(query) ||
        hotelName.includes(query);

      const matchesPrice =
        maxPrice === null || Number.isNaN(maxPrice)
          ? true
          : Number(hall.pricePerDay) <= maxPrice;

      return (
        matchesSearch &&
        matchesCapacity(Number(hall.capacity), capacityFilter) &&
        matchesPrice
      );
    });
  }, [halls, searchTerm, capacityFilter, priceFilter]);

  return (
    <main className="venues-page">
      <div className="venues-nav-wrap">
        <Navbar />
      </div>

      <section className="venues-banner">
        <div className="venues-banner-inner">
          <h1>Explore Event Venues &amp; Halls in Hargeisa</h1>
          <p>
            Find the ideal space for weddings, corporate galas, and private
            celebrations.
          </p>
        </div>
      </section>

      <section className="venues-content">
        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="Search by hall name or description..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <select
            className="filter-select"
            value={capacityFilter}
            onChange={(event) => setCapacityFilter(event.target.value)}
          >
            {capacityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            className="filter-input filter-price"
            placeholder="Max price / day"
            value={priceFilter}
            onChange={(event) => setPriceFilter(event.target.value)}
          />
        </div>

        {loading && <p className="venues-status">Loading venues...</p>}
        {error && <p className="venues-status venues-error">{error}</p>}

        {!loading && !error && filteredHalls.length === 0 && (
          <p className="venues-status">
            No halls match your filters. Try adjusting search or price.
          </p>
        )}

        {!loading && !error && filteredHalls.length > 0 && (
          <div className="venue-grid">
            {filteredHalls.map((hall) => (
              <article key={hall._id} className="venue-card">
                <div className="venue-card-image-wrap">
                  <img
                    src={getHallImage(hall)}
                    alt={hall.hallName}
                    className="venue-card-image"
                    onError={(event) => {
                      event.currentTarget.src = '/banner01.png';
                    }}
                  />
                  <span className="capacity-badge">
                    {hall.capacity} guests
                  </span>
                </div>

                <div className="venue-card-body">
                  <h3>{hall.hallName}</h3>
                  <p className="venue-hotel">
                    {hall.hotelId?.hotelName || 'Approved Hotel'}
                    {hall.hotelId?.city ? ` · ${hall.hotelId.city}` : ''}
                  </p>

                  <p className="price-tag">
                    ${Number(hall.pricePerDay).toLocaleString()}/day
                  </p>

                  <div className="amenity-list">
                    {(hall.amenities || []).slice(0, 3).map((amenity) => (
                      <span key={amenity} className="amenity-badge">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/venues/${hall._id}`}
                    className="venue-card-btn"
                  >
                    View Details &amp; Reserve
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Venues;
