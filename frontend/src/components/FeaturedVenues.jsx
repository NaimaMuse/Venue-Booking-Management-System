import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE } from '../utils/auth';
import api from '../utils/api';

const MANUAL_HALLS = [
  {
    id: 'manual-1',
    hallName: 'Grand Banquet Hall',
    hotelName: 'Maansoor Hotel',
    city: 'Hargeisa',
    capacity: 400,
    pricePerDay: 850,
    image: '/banner01.png',
    to: '/hotels',
  },
  {
    id: 'manual-2',
    hallName: 'Royal Entrance Hall',
    hotelName: 'Ambassador Hotel',
    city: 'Hargeisa',
    capacity: 280,
    pricePerDay: 620,
    image: '/banner02.png',
    to: '/hotels',
  },
  {
    id: 'manual-3',
    hallName: 'Garden Reception Hall',
    hotelName: 'Maan-Soor Hotel',
    city: 'Hargeisa',
    capacity: 350,
    pricePerDay: 740,
    image: '/banner03.png',
    to: '/hotels',
  },
];

const getHallImage = (hall) => {
  if (hall.image) {
    return hall.image;
  }

  const firstImage = hall?.images?.[0];
  if (!firstImage) {
    return '/banner01.png';
  }
  if (firstImage.startsWith('http')) {
    return firstImage;
  }
  return `${API_BASE}${firstImage}`;
};

const mapDbHall = (hall) => ({
  id: hall._id,
  hallName: hall.hallName,
  hotelName: hall.hotelId?.hotelName || 'Approved Hotel',
  city: hall.hotelId?.city || 'Hargeisa',
  capacity: hall.capacity,
  pricePerDay: hall.pricePerDay,
  image: getHallImage(hall),
  to: `/venues/${hall._id}`,
});

function FeaturedVenues() {
  const [dbHalls, setDbHalls] = useState([]);
  const [start, setStart] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/halls');
        setDbHalls((data.halls || []).map(mapDbHall));
      } catch {
        setDbHalls([]);
      }
    };

    load();
  }, []);

  const halls = useMemo(() => [...MANUAL_HALLS, ...dbHalls], [dbHalls]);
  const visibleCount = 3;
  const maxStart = Math.max(0, halls.length - visibleCount);
  const visible = halls.slice(start, start + visibleCount);
  const canSlide = halls.length > visibleCount;

  const goPrev = () => setStart((prev) => Math.max(0, prev - 1));
  const goNext = () => setStart((prev) => Math.min(maxStart, prev + 1));

  return (
    <section className="featured-venues-section" id="venues">
      <div className="section-header">
        <span className="section-label">Featured Halls</span>
        <h2>Popular Halls in Hargeisa</h2>
      </div>

      <div className="featured-slider">
        {canSlide && (
          <button
            type="button"
            className="featured-slider-btn is-prev"
            onClick={goPrev}
            disabled={start === 0}
            aria-label="Previous halls"
          >
            ‹
          </button>
        )}

        <div className="venue-grid featured-venue-grid">
          {visible.map((hall) => (
            <article key={hall.id} className="venue-card">
              <div className="venue-card-image-wrap">
                <img
                  src={hall.image}
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
                  {hall.hotelName}
                  {hall.city ? ` · ${hall.city}` : ''}
                </p>
                <p className="price-tag">
                  ${Number(hall.pricePerDay).toLocaleString()}/day
                </p>
                <Link to={hall.to} className="venue-card-btn">
                  View Details &amp; Reserve
                </Link>
              </div>
            </article>
          ))}
        </div>

        {canSlide && (
          <button
            type="button"
            className="featured-slider-btn is-next"
            onClick={goNext}
            disabled={start >= maxStart}
            aria-label="Next halls"
          >
            ›
          </button>
        )}
      </div>

      <div className="featured-venues-cta">
        <Link to="/hotels" className="customer-gold-btn">
          Browse Hotels &amp; Halls
        </Link>
      </div>
    </section>
  );
}

export default FeaturedVenues;
