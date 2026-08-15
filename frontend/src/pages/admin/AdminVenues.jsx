import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatDate } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const viewFilters = [
  { id: 'all', label: 'All halls' },
  { id: 'available', label: 'Available' },
  { id: 'unavailable', label: 'Unavailable' },
];

const hotelStatusLabel = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function AdminVenues() {
  const [hotels, setHotels] = useState([]);
  const [halls, setHalls] = useState([]);
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVenues = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/admin/venues');
        setHotels(data.hotels || []);
        setHalls(data.halls || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to load venues'));
      } finally {
        setLoading(false);
      }
    };

    loadVenues();
  }, []);

  const hotelMap = useMemo(() => {
    const map = {};
    hotels.forEach((hotel) => {
      map[hotel._id] = hotel;
    });
    return map;
  }, [hotels]);

  const counts = useMemo(() => {
    const available = halls.filter((h) => h.isAvailable).length;
    return {
      all: halls.length,
      available,
      unavailable: halls.length - available,
      hotels: hotels.length,
    };
  }, [halls, hotels]);

  const filteredHalls = useMemo(() => {
    const query = search.trim().toLowerCase();

    return halls.filter((hall) => {
      if (viewFilter === 'available' && !hall.isAvailable) {
        return false;
      }
      if (viewFilter === 'unavailable' && hall.isAvailable) {
        return false;
      }

      if (!query) {
        return true;
      }

      const hotelId = hall.hotelId?._id || hall.hotelId;
      const hotel = hotelMap[hotelId] || hall.hotelId || {};

      return [
        hall.hallName,
        hotel.hotelName,
        hotel.city,
        hotel.address,
        hotel.ownerId?.fullName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [halls, hotelMap, search, viewFilter]);

  return (
    <div className="customer-page admin-venues-page">
      <section className="customer-page-header admin-venues-hero">
        <div>
          <p className="customer-eyebrow">Directory</p>
          <h1>All Venues</h1>
          <p>
            Browse halls across the platform — capacity, pricing, and
            availability. Approvals are handled separately.
          </p>
        </div>
        <Link to="/admin/hotels" className="customer-gold-btn">
          Go to Approvals
        </Link>
      </section>

      <section className="admin-venues-kpis">
        <article>
          <span>Halls</span>
          <strong>{counts.all}</strong>
        </article>
        <article className="is-approved">
          <span>Available</span>
          <strong>{counts.available}</strong>
        </article>
        <article className="is-pending">
          <span>Unavailable</span>
          <strong>{counts.unavailable}</strong>
        </article>
        <article>
          <span>Hotels</span>
          <strong>{counts.hotels}</strong>
        </article>
      </section>

      <div className="admin-venues-toolbar">
        <div className="admin-venues-filters" role="tablist">
          {viewFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={viewFilter === item.id}
              className={`admin-venues-filter${
                viewFilter === item.id ? ' is-active' : ''
              }`}
              onClick={() => setViewFilter(item.id)}
            >
              {item.label}
              <em>{counts[item.id] ?? 0}</em>
            </button>
          ))}
        </div>

        <label className="admin-venues-search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Hall, hotel, city, or owner..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {loading && <p className="customer-status">Loading venues...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && filteredHalls.length === 0 && (
        <p className="customer-empty">No halls match your search.</p>
      )}

      {!loading && filteredHalls.length > 0 && (
        <div className="admin-venues-table-wrap">
          <table className="admin-venues-table">
            <thead>
              <tr>
                <th>Hall</th>
                <th>Hotel</th>
                <th>Capacity</th>
                <th>Price / day</th>
                <th>Availability</th>
                <th>Hotel status</th>
                <th>Listed</th>
              </tr>
            </thead>
            <tbody>
              {filteredHalls.map((hall) => {
                const hotelId = hall.hotelId?._id || hall.hotelId;
                const hotel = hotelMap[hotelId] || hall.hotelId || {};
                const hotelStatus = hotel.verificationStatus || 'pending';

                return (
                  <tr key={hall._id}>
                    <td>
                      <strong>{hall.hallName}</strong>
                      {hall.amenities?.length ? (
                        <span>{hall.amenities.slice(0, 2).join(' · ')}</span>
                      ) : null}
                    </td>
                    <td>
                      <strong>{hotel.hotelName || '—'}</strong>
                      <span>
                        {hotel.city || 'Hargeisa'}
                        {hotel.ownerId?.fullName
                          ? ` · ${hotel.ownerId.fullName}`
                          : ''}
                      </span>
                    </td>
                    <td>{Number(hall.capacity || 0).toLocaleString()} guests</td>
                    <td>
                      ${Number(hall.pricePerDay || 0).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`admin-venue-avail${
                          hall.isAvailable ? ' is-on' : ' is-off'
                        }`}
                      >
                        {hall.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-hotel-badge is-${hotelStatus}`}>
                        {hotelStatusLabel[hotelStatus] || hotelStatus}
                      </span>
                    </td>
                    <td>{formatDate(hall.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminVenues;
