import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { API_BASE } from '../utils/auth';
import api, { getApiError } from '../utils/api';

const resolveImage = (image) => {
  if (!image) {
    return '/hotel-hero-moole.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

function HotelDetails() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/api/hotels/${id}`);
        setHotel(data.hotel || null);
        setHalls(data.halls || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to load hotel details'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const heroImage = useMemo(() => {
    if (!hotel) {
      return '/hotel-hero-moole.png';
    }

    const name = String(hotel.hotelName || '').toLowerCase();
    const isMoole = name.includes('moole');

    if (isMoole) {
      return '/hotel-hero-moole.png';
    }

    return resolveImage(hotel.coverImage || halls[0]?.images?.[0]);
  }, [hotel, halls]);

  const scrollToHalls = () => {
    const section = document.getElementById('hotel-halls');
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasAbout = Boolean(hotel?.description?.trim());
  const hasContact = Boolean(hotel?.contactPhone || hotel?.address || hotel?.city);

  return (
    <main className="hh-page hotel-details-page">
      <div className="venues-nav-wrap">
        <Navbar />
      </div>

      <section className="hh-body hh-details-body">
        {loading && (
          <div className="hh-skeleton-list" aria-hidden="true">
            <div className="hh-skeleton-block hh-skeleton-hero" />
            <div className="hh-skeleton-block" />
          </div>
        )}

        {error && <p className="hh-empty hh-error">{error}</p>}

        {!loading && !error && hotel && (
          <>
            <div className="hh-details-hero">
              <img
                src={heroImage}
                alt={hotel.hotelName}
                onError={(event) => {
                  event.currentTarget.src = '/hotel-hero-moole.png';
                }}
              />
              <div className="hh-details-hero-shade" aria-hidden="true" />
              <div className="hh-details-hero-ornament" aria-hidden="true" />
              <div className="hh-details-hero-copy">
                <p className="hh-eyebrow hh-details-eyebrow">
                  Hargeisa Hall Finder
                </p>
                <p className="hh-details-hero-place">
                  {hotel.city}
                  {hotel.address ? ` · ${hotel.address}` : ''}
                </p>
                <h1>{hotel.hotelName}</h1>
                <div className="hh-details-hero-meta-row">
                  <button
                    type="button"
                    className="hh-details-hero-pill"
                    onClick={scrollToHalls}
                  >
                    {halls.length} hall{halls.length === 1 ? '' : 's'} available
                  </button>
                  {hotel.contactPhone ? (
                    <span className="hh-details-hero-pill is-soft">
                      {hotel.contactPhone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {(hasAbout || hasContact) && (
              <div className="hh-details-strip">
                {hasAbout && (
                  <div className="hh-details-strip-about">
                    <span>About</span>
                    <p>{hotel.description.trim()}</p>
                  </div>
                )}
                {hasContact && (
                  <ul className="hh-details-strip-meta">
                    {hotel.contactPhone ? (
                      <li>
                        <span>Phone</span>
                        <strong>{hotel.contactPhone}</strong>
                      </li>
                    ) : null}
                    {hotel.address ? (
                      <li>
                        <span>Location</span>
                        <strong>{hotel.address}</strong>
                      </li>
                    ) : null}
                    {hotel.city ? (
                      <li>
                        <span>City</span>
                        <strong>{hotel.city}</strong>
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            )}

            <section id="hotel-halls" className="hh-details-halls">
              <header className="hh-hotel-head">
                <div>
                  <p className="hh-hotel-place">Halls</p>
                  <h2>
                    {halls.length === 0
                      ? 'No halls yet'
                      : `${halls.length} space${halls.length === 1 ? '' : 's'}`}
                  </h2>
                </div>
              </header>

              {halls.length === 0 ? (
                <p className="hh-empty-inline">No available halls listed yet.</p>
              ) : (
                <div className="hh-hall-grid">
                  {halls.map((hall, hallIndex) => (
                    <article
                      key={hall._id}
                      className="hh-hall-card"
                      style={{ animationDelay: `${hallIndex * 45}ms` }}
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
                          onError={(event) => {
                            event.currentTarget.src = '/hotel-hero-moole.png';
                          }}
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
          </>
        )}
      </section>
    </main>
  );
}

export default HotelDetails;
