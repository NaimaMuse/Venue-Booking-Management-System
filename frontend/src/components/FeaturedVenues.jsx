import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE } from '../utils/auth';
import api, { getApiError } from '../utils/api';

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

function FeaturedVenues() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/halls');
        setHalls((data.halls || []).slice(0, 3));
      } catch (err) {
        setError(getApiError(err, 'Unable to load halls'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="featured-venues-section" id="venues">
      <div className="section-header">
        <span className="section-label">Featured Halls</span>
        <h2>Popular Halls in Hargeisa</h2>
      </div>

      {loading && <p className="venues-status">Loading halls...</p>}
      {error && <p className="venues-status venues-error">{error}</p>}

      {!loading && !error && halls.length === 0 && (
        <p className="venues-status">
          Approved halls will appear here once hotel owners publish them.
        </p>
      )}

      {!loading && !error && halls.length > 0 && (
        <div className="venue-grid featured-venue-grid">
          {halls.map((hall) => (
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
                <span className="capacity-badge">{hall.capacity} guests</span>
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
                <Link to={`/venues/${hall._id}`} className="venue-card-btn">
                  View Details &amp; Reserve
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="featured-venues-cta">
        <Link to="/hotels" className="customer-gold-btn">
          Browse Hotels &amp; Halls
        </Link>
      </div>
    </section>
  );
}

export default FeaturedVenues;
