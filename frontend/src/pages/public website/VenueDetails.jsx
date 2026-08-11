import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../components/Navbar';
import { API_BASE, getToken, getUser } from '../../utils/auth';
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

const formatUnavailableLabel = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    eventDate: '',
    guestCount: '',
    specialNotes: '',
  });
  const [unavailableDates, setUnavailableDates] = useState([]);

  useEffect(() => {
    const loadHall = async () => {
      try {
        setLoading(true);
        setError('');

        const [hallRes, datesRes] = await Promise.all([
          api.get(`/api/halls/${id}`),
          api
            .get(`/api/bookings/unavailable-dates/${id}`)
            .catch(() => ({ data: {} })),
        ]);

        setHall(hallRes.data.hall);
        setActiveImage(0);
        setUnavailableDates(datesRes.data.unavailableDates || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to load hall'));
      } finally {
        setLoading(false);
      }
    };

    loadHall();
  }, [id]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const unavailableSet = useMemo(
    () => new Set(unavailableDates),
    [unavailableDates]
  );

  const images = useMemo(() => {
    const list = hall?.images?.length ? hall.images : ['/banner01.png'];
    return list.map(resolveImage);
  }, [hall]);

  const currentUser = getUser();
  const canRequestBooking = !currentUser || currentUser.role === 'customer';
  const dateConflict = form.eventDate && unavailableSet.has(form.eventDate);

  const ensureCustomer = () => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      navigate('/login', { state: { from: `/venues/${id}` } });
      return false;
    }

    if (user.role !== 'customer') {
      setFormError('Booking requests are available for customer accounts.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!ensureCustomer()) {
      return;
    }

    if (!form.eventDate || !form.guestCount) {
      setFormError('Event date and guest count are required.');
      return;
    }

    if (unavailableSet.has(form.eventDate)) {
      setFormError(
        `This hall is already booked for ${form.eventDate}. Please choose another date.`
      );
      return;
    }

    if (Number(form.guestCount) < 1) {
      setFormError('Guest count must be at least 1.');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/api/bookings', {
        hallId: id,
        eventDate: form.eventDate,
        guestCount: Number(form.guestCount),
        specialNotes: form.specialNotes.trim() || undefined,
      });

      navigate('/customer/my-bookings', {
        state: { toast: 'Booking request submitted successfully.' },
      });
    } catch (err) {
      setFormError(getApiError(err, 'Unable to submit booking right now'));
    } finally {
      setSubmitting(false);
    }
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const dayRate = Number(hall?.pricePerDay) || 0;

  return (
    <main className="hh-page venue-details-page venue-book-page">
      <div className="venue-book-nav">
        <Navbar />
      </div>

      <section className="venue-details-content venue-book-content">
        {loading && (
          <div className="hh-skeleton-list" aria-hidden="true">
            <div className="hh-skeleton-block hh-skeleton-hero" />
            <div className="hh-skeleton-block" />
          </div>
        )}
        {error && <p className="hh-empty hh-error">{error}</p>}

        {!loading && !error && hall && (
          <>
            <header className="venue-book-header">
              <div>
                <p className="venue-book-kicker">
                  {hall.hotelId?.hotelName || 'Approved Hotel'}
                  {hall.hotelId?.city ? ` · ${hall.hotelId.city}` : ''}
                </p>
                <h1>{hall.hallName}</h1>
                <div className="venue-book-meta-line">
                  <span className="venue-book-chip">{hall.capacity} Guests</span>
                  <span className="venue-book-address">
                    {hall.hotelId?.address ||
                      `${hall.hotelId?.city || 'Hargeisa'}, Somaliland`}
                  </span>
                </div>
              </div>
            </header>

            <div className="venue-book-layout">
              <div className="venue-book-main">
                <div className="venue-gallery venue-book-gallery">
                  <div className="venue-gallery-main">
                    <img
                      key={images[activeImage]}
                      src={images[activeImage]}
                      alt={hall.hallName}
                      onError={(event) => {
                        event.currentTarget.src = '/banner01.png';
                      }}
                    />
                    <span className="venue-book-featured">Featured</span>
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="venue-book-nav-btn is-prev"
                          onClick={prevImage}
                          aria-label="Previous photo"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="venue-book-nav-btn is-next"
                          onClick={nextImage}
                          aria-label="Next photo"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="venue-gallery-thumbs">
                      {images.map((src, index) => (
                        <button
                          key={`${src}-${index}`}
                          type="button"
                          className={`venue-thumb${activeImage === index ? ' is-active' : ''}`}
                          onClick={() => setActiveImage(index)}
                          aria-label={`View photo ${index + 1}`}
                        >
                          <img src={src} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="venue-book-tabs">
                  <button
                    type="button"
                    className={activeTab === 'about' ? 'is-active' : ''}
                    onClick={() => setActiveTab('about')}
                  >
                    About Hall
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'amenities' ? 'is-active' : ''}
                    onClick={() => setActiveTab('amenities')}
                  >
                    Amenities
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'location' ? 'is-active' : ''}
                    onClick={() => setActiveTab('location')}
                  >
                    Location
                  </button>
                </div>

                <div className="venue-book-panel">
                  {activeTab === 'about' && (
                    <>
                      <h2>About this hall</h2>
                      <p className="venue-description">
                        {hall.description ||
                          'An elegant banquet hall ready for weddings, parties, and special events in Hargeisa.'}
                      </p>
                    </>
                  )}

                  {activeTab === 'amenities' && (
                    <>
                      <h2>Amenities</h2>
                      <div className="amenity-list venue-amenities">
                        {(hall.amenities || []).length === 0 ? (
                          <span className="amenity-badge">Amenities TBA</span>
                        ) : (
                          hall.amenities.map((amenity) => (
                            <span key={amenity} className="amenity-badge">
                              {amenity}
                            </span>
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {activeTab === 'location' && (
                    <>
                      <h2>Location</h2>
                      <p className="venue-description">
                        {hall.hotelId?.address ||
                          `${hall.hotelId?.city || 'Hargeisa'}, Somaliland`}
                      </p>
                      <p className="venue-description">
                        Hotel: {hall.hotelId?.hotelName || 'Approved Hotel'}
                        {hall.hotelId?.contactPhone
                          ? ` · ${hall.hotelId.contactPhone}`
                          : ''}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <aside className="venue-book-side">
                <section className="venue-book-card">
                  <h2>Book This Hall</h2>
                  <p className="venue-book-card-sub">
                    Pick your event date and guest count. Unavailable dates
                    cannot be selected.
                  </p>

                  {formError && <p className="booking-form-error">{formError}</p>}

                  {unavailableDates.length > 0 && (
                    <div className="booking-unavailable-block">
                      <p className="booking-unavailable-label">
                        Unavailable dates
                      </p>
                      <div className="booking-unavailable-chips">
                        {unavailableDates.map((date) => (
                          <span key={date} className="booking-unavailable-chip">
                            {formatUnavailableLabel(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <form className="booking-form venue-book-form" onSubmit={handleSubmit}>
                    <label className="booking-field">
                      <span className="booking-field-label">Event Date</span>
                      <input
                        type="date"
                        value={form.eventDate}
                        min={todayIso}
                        className={dateConflict ? 'is-conflict' : ''}
                        onChange={(event) => {
                          const nextDate = event.target.value;
                          setForm((prev) => ({
                            ...prev,
                            eventDate: nextDate,
                          }));
                          if (unavailableSet.has(nextDate)) {
                            setFormError(
                              `This hall is already booked for ${nextDate}. Please choose another date.`
                            );
                          } else {
                            setFormError('');
                          }
                        }}
                        required
                      />
                      {dateConflict && (
                        <span className="booking-field-hint is-error">
                          This date is unavailable — pick another day.
                        </span>
                      )}
                    </label>

                    <label className="booking-field">
                      <span className="booking-field-label">
                        Number of Guests
                      </span>
                      <input
                        type="number"
                        min="1"
                        max={hall.capacity || undefined}
                        value={form.guestCount}
                        placeholder={
                          hall.capacity ? `Up to ${hall.capacity}` : undefined
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            guestCount: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>

                    <label className="booking-field">
                      <span className="booking-field-label">Special Notes</span>
                      <textarea
                        rows="3"
                        placeholder="Setup needs, visit preferences, timing notes..."
                        value={form.specialNotes}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            specialNotes: event.target.value,
                          }))
                        }
                      />
                    </label>

                    {canRequestBooking ? (
                      <button
                        type="submit"
                        className="booking-submit-btn"
                        disabled={
                          submitting ||
                          !form.eventDate ||
                          unavailableSet.has(form.eventDate)
                        }
                      >
                        {submitting
                          ? 'Submitting…'
                          : 'Submit Booking Request'}
                      </button>
                    ) : (
                      <p className="venue-role-note">
                        Booking requests are available for customer accounts.
                      </p>
                    )}
                  </form>
                </section>

                <section className="venue-book-summary">
                  <h3>Booking Summary</h3>
                  <div className="venue-book-summary-hall">
                    <img src={images[0]} alt="" />
                    <div>
                      <strong>{hall.hallName}</strong>
                      <span>{hall.hotelId?.hotelName || 'Hotel'}</span>
                    </div>
                  </div>
                  <ul>
                    <li>
                      <span>Event date</span>
                      <strong>
                        {form.eventDate
                          ? formatUnavailableLabel(form.eventDate)
                          : 'Not selected'}
                      </strong>
                    </li>
                    <li>
                      <span>Guests</span>
                      <strong>{form.guestCount || '—'}</strong>
                    </li>
                    <li>
                      <span>Day rate</span>
                      <strong>${dayRate.toLocaleString()}</strong>
                    </li>
                  </ul>
                  <div className="venue-book-summary-total">
                    <span>Estimated total</span>
                    <strong>${dayRate.toLocaleString()}</strong>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default VenueDetails;
