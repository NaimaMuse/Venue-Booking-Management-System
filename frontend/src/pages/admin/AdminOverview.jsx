import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatDate, getFirstName, getUser } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const IconPending = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconHotels = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 19.5V6.8C4 5.8 4.8 5 5.8 5H14.2C15.2 5 16 5.8 16 6.8V19.5"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path d="M16 10H19.2C20.2 10 21 10.8 21 11.8V19.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19.5H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconHalls = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const IconBookings = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V6.5M16 3.5V6.5M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

function AdminOverview() {
  const user = getUser();
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedHotels: 0,
    rejectedHotels: 0,
    totalLiveHalls: 0,
    platformBookings: 0,
  });
  const [pendingHotels, setPendingHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsRes, pendingRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/hotels/pending'),
        ]);

        setStats(statsRes.data.stats || {});
        setPendingHotels((pendingRes.data.hotels || []).slice(0, 4));
      } catch (err) {
        setError(getApiError(err, 'Unable to load admin dashboard'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="customer-page admin-dash-page">
      <section className="customer-page-header admin-dash-hero">
        <div>
          <p className="customer-eyebrow">Admin Portal</p>
          <h1>Dashboard</h1>
          <p>
            Welcome, {getFirstName(user?.fullName)}. Monitor approvals, venues,
            and platform booking activity.
          </p>
        </div>
        <div className="admin-dash-hero-actions">
          <Link to="/admin/hotels" className="customer-gold-btn">
            Review Approvals
          </Link>
          <Link to="/admin/venues" className="owner-schedule-btn">
            All Venues
          </Link>
        </div>
      </section>

      {loading && <p className="customer-status">Loading dashboard...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="admin-dash-kpis">
            <article className={stats.pendingApprovals > 0 ? 'is-alert' : ''}>
              <span className="admin-dash-kpi-icon is-gold">
                <IconPending />
              </span>
              <div>
                <p>Pending approvals</p>
                <strong>{stats.pendingApprovals || 0}</strong>
              </div>
            </article>
            <article>
              <span className="admin-dash-kpi-icon">
                <IconHotels />
              </span>
              <div>
                <p>Approved hotels</p>
                <strong>{stats.approvedHotels || 0}</strong>
              </div>
            </article>
            <article>
              <span className="admin-dash-kpi-icon is-plum">
                <IconHalls />
              </span>
              <div>
                <p>Live halls</p>
                <strong>{stats.totalLiveHalls || 0}</strong>
              </div>
            </article>
            <article>
              <span className="admin-dash-kpi-icon">
                <IconBookings />
              </span>
              <div>
                <p>Platform bookings</p>
                <strong>{stats.platformBookings || 0}</strong>
              </div>
            </article>
          </section>

          <section className="admin-dash-grid">
            <article className="admin-dash-panel">
              <div className="admin-dash-panel-head">
                <div>
                  <p>Approvals</p>
                  <h2>Newest pending requests</h2>
                </div>
                <Link to="/admin/hotels">View all</Link>
              </div>

              {pendingHotels.length === 0 ? (
                <p className="admin-dash-empty">
                  No hotels waiting for review right now.
                </p>
              ) : (
                <ul className="admin-dash-pending-list">
                  {pendingHotels.map((hotel) => (
                    <li key={hotel._id}>
                      <div>
                        <strong>{hotel.hotelName}</strong>
                        <small>
                          {hotel.ownerId?.fullName || 'Owner'} ·{' '}
                          {hotel.city || 'Hargeisa'}
                        </small>
                      </div>
                      <div className="admin-dash-pending-meta">
                        <span>{formatDate(hotel.createdAt)}</span>
                        <Link
                          to="/admin/hotels"
                          state={{ focusHotelId: hotel._id }}
                          className="admin-dash-review-btn"
                        >
                          Review
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <aside className="admin-dash-side">
              <article className="admin-dash-panel">
                <div className="admin-dash-panel-head">
                  <div>
                    <p>Shortcuts</p>
                    <h2>Quick links</h2>
                  </div>
                </div>
                <div className="admin-dash-links">
                  <Link to="/admin/hotels">Hotel approvals</Link>
                  <Link to="/admin/venues">Browse venues</Link>
                  <Link to="/admin/reports/operations">Operations reports</Link>
                  <Link to="/admin/reports/revenue">Revenue reports</Link>
                  <Link to="/admin/reports/performance">Performance</Link>
                </div>
              </article>

              <article className="admin-dash-panel admin-dash-status-card">
                <p>Directory health</p>
                <ul>
                  <li>
                    <span>Approved</span>
                    <strong>{stats.approvedHotels || 0}</strong>
                  </li>
                  <li>
                    <span>Rejected</span>
                    <strong>{stats.rejectedHotels || 0}</strong>
                  </li>
                  <li>
                    <span>Pending</span>
                    <strong>{stats.pendingApprovals || 0}</strong>
                  </li>
                </ul>
              </article>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminOverview;
