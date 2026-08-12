import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { API_BASE, formatDate, getFirstName, getUser } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const statusClass = {
  pending: 'status-badge-pending',
  accepted: 'status-badge-accepted',
  confirmed: 'status-badge-confirmed',
  cancelled: 'status-badge-cancelled',
  rejected: 'status-badge-rejected',
};

const CHART_COLORS = {
  pending: '#d4b37a',
  accepted: '#4a2040',
  rejected: '#b42318',
};

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20V7L12 3L20 7V20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M9 20V13H15V20" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V7M16 3.5V7M4 10H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

function OwnerOverview() {
  const user = getUser();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [halls, setHalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(location.state?.toast || '');
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);

  useEffect(() => {
    if (location.state?.toast) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [hotelResult, hallsResult, bookingsResult] = await Promise.all([
          api.get('/api/hotels/my-hotel').catch((err) => err),
          api.get('/api/halls/my-halls').catch((err) => err),
          api.get('/api/bookings/owner-requests').catch((err) => err),
        ]);

        if (hotelResult instanceof Error || hotelResult.isAxiosError) {
          if (hotelResult.response?.status !== 404) {
            throw new Error(getApiError(hotelResult, 'Failed to load hotel'));
          }
        } else {
          const nextHotel = hotelResult.data.hotel || null;
          setHotel(nextHotel);

          if (
            nextHotel?.verificationStatus === 'approved' &&
            nextHotel.hasSeenApprovalAlert === false
          ) {
            setShowApprovalAlert(true);
          }
        }

        if (hallsResult instanceof Error || hallsResult.isAxiosError) {
          const status = hallsResult.response?.status;
          if (status !== 403 && status !== 404) {
            throw new Error(getApiError(hallsResult, 'Failed to load halls'));
          }
        } else {
          setHalls(hallsResult.data.halls || []);
        }

        if (bookingsResult instanceof Error || bookingsResult.isAxiosError) {
          setBookings([]);
        } else {
          setBookings(bookingsResult.data.bookings || []);
        }
      } catch (err) {
        setError(getApiError(err, 'Unable to load dashboard'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!showApprovalAlert || !hotel?._id) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      setShowApprovalAlert(false);
      try {
        await api.patch('/api/hotels/my-hotel/approval-alert-seen');
        setHotel((prev) =>
          prev ? { ...prev, hasSeenApprovalAlert: true } : prev
        );
      } catch (err) {
        console.error(getApiError(err, 'Failed to mark approval alert seen'));
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [showApprovalAlert, hotel?._id]);

  const metrics = useMemo(() => {
    const totalHalls = halls.filter((hall) => hall.isAvailable !== false).length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const upcomingVisits = bookings.filter(
      (b) => b.status === 'accepted' && b.appointment?.scheduledDate
    ).length;
    return { totalHalls, pending, upcomingVisits };
  }, [halls, bookings]);

  const monthOverview = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const thisMonth = bookings.filter((booking) => {
      const date = new Date(booking.createdAt || booking.eventDate);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const accepted = thisMonth.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    );
    const revenue = accepted.reduce(
      (sum, booking) => sum + (Number(booking.depositAmount) || 0),
      0
    );
    const occupancy =
      halls.length > 0
        ? Math.min(100, Math.round((accepted.length / halls.length) * 100))
        : 0;

    return {
      newBookings: thisMonth.length,
      acceptedBookings: accepted.length,
      revenue,
      occupancy,
    };
  }, [bookings, halls.length]);

  const statusChart = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const accepted = bookings.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    ).length;
    const rejected = bookings.filter(
      (b) => b.status === 'rejected' || b.status === 'cancelled'
    ).length;
    const total = pending + accepted + rejected;

    return [
      { name: 'Pending', value: pending, key: 'pending' },
      { name: 'Accepted', value: accepted, key: 'accepted' },
      { name: 'Rejected', value: rejected, key: 'rejected' },
    ].map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [bookings]);

  const recent = bookings.slice(0, 5);
  const status = hotel?.verificationStatus;
  const canAddHalls = status === 'approved';
  const chartHasData = statusChart.some((item) => item.value > 0);

  return (
    <div className="customer-page owner-dashboard">
      {toast && <div className="customer-toast">{toast}</div>}

      {showApprovalAlert && (
        <div className="owner-approval-flash" role="status">
          <span>
            Congratulations! Your hotel has been approved by the admin. You can
            now manage your venue and add halls.
          </span>
          <button
            type="button"
            className="owner-alert-dismiss"
            aria-label="Dismiss approval alert"
            onClick={async () => {
              setShowApprovalAlert(false);
              try {
                await api.patch('/api/hotels/my-hotel/approval-alert-seen');
                setHotel((prev) =>
                  prev ? { ...prev, hasSeenApprovalAlert: true } : prev
                );
              } catch (err) {
                console.error(
                  getApiError(err, 'Failed to mark approval alert seen')
                );
              }
            }}
          >
            ×
          </button>
        </div>
      )}
      
      <section className="customer-welcome owner-welcome-banner">
        <div>
          <p className="customer-eyebrow">Owner Portal</p>
          <h1>Welcome back, {getFirstName(user?.fullName)}!</h1>
          <p>
            Manage your hotel profile, halls, and customer booking requests from
            one place.
            {hotel?.hotelName ? ` · ${hotel.hotelName}` : ''}
          </p>
        </div>
        <div className="owner-welcome-actions">
          {canAddHalls ? (
            <Link to="/owner/reports" className="customer-gold-btn">
              Hotel Report
            </Link>
          ) : null}
          {canAddHalls ? (
            <Link to="/owner/halls/new" className="owner-schedule-btn">
              + Add New Hall
            </Link>
          ) : (
            <Link to="/owner/hotel-profile" className="customer-gold-btn">
              Hotel Profile
            </Link>
          )}
        </div>
      </section>

      {!hotel && !loading && (
        <div className="owner-status-banner owner-status-pending">
          <strong>No hotel registered yet.</strong>
          <span>
            {' '}
            Complete your{' '}
            <Link to="/owner/hotel-profile">hotel profile</Link> to get started.
          </span>
        </div>
      )}

      {hotel && status === 'pending' && (
        <div className="owner-status-banner owner-status-pending">
          <span className="status-badge status-badge-pending">
            Status: Pending Admin Approval
          </span>
          <span>
            Your hotel registration is under review. Halls stay hidden until
            approved.
          </span>
        </div>
      )}

      {hotel && status === 'rejected' && (
        <div className="owner-status-banner owner-status-rejected">
          <span className="status-badge status-badge-rejected">
            Status: Rejected
          </span>
          <span>
            {hotel.rejectionReason ||
              'Please update your hotel profile and contact support.'}
          </span>
        </div>
      )}

      {loading && <p className="customer-status">Loading dashboard...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="owner-metric-row">
            <article className="metric-card owner-metric-card">
              <span className="owner-metric-icon">
                <IconBuilding />
              </span>
              <div>
                <p>Total Halls</p>
                <strong>{metrics.totalHalls}</strong>
              </div>
            </article>
            <article className="metric-card owner-metric-card">
              <span className="owner-metric-icon">
                <IconClock />
              </span>
              <div>
                <p>Pending Requests</p>
                <strong>{metrics.pending}</strong>
              </div>
            </article>
            <article className="metric-card owner-metric-card">
              <span className="owner-metric-icon">
                <IconCalendar />
              </span>
              <div>
                <p>Upcoming Visits</p>
                <strong>{metrics.upcomingVisits}</strong>
              </div>
            </article>
          </section>

          <section className="owner-dash-grid">
            {canAddHalls && (
              <section className="customer-panel owner-halls-panel">
                <div className="customer-panel-head">
                  <h2>Your Halls</h2>
                  <Link to="/owner/halls">Manage halls</Link>
                </div>

                {halls.length === 0 ? (
                  <p className="customer-empty">
                    No halls yet. Add your first hall with amenities and photos so
                    customers can book it.
                  </p>
                ) : (
                  <div className="owner-hall-dash-list">
                    {halls.slice(0, 4).map((hall) => (
                      <article key={hall._id} className="owner-hall-dash-card">
                        <img
                          src={resolveImage(hall.images?.[0])}
                          alt={hall.hallName}
                        />
                        <div className="owner-hall-dash-body">
                          <div className="owner-hall-dash-top">
                            <strong>{hall.hallName}</strong>
                            <span
                              className={`owner-hall-status${
                                hall.isAvailable === false ? ' is-inactive' : ''
                              }`}
                            >
                              {hall.isAvailable === false ? 'Inactive' : 'Active'}
                            </span>
                          </div>
                          <span>
                            {hall.capacity} guests · ${hall.pricePerDay}/day
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="owner-dashboard-actions">
                  <Link to="/owner/halls/new" className="owner-accept-btn">
                    + Add New Hall
                  </Link>
                  {hotel?._id && (
                    <Link
                      to={`/hotels/${hotel._id}`}
                      className="owner-schedule-btn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Public Hotel Page
                    </Link>
                  )}
                </div>
              </section>
            )}

            <section className="customer-panel owner-month-panel owner-report-teaser">
              <div className="customer-panel-head">
                <h2>Hotel report snapshot</h2>
                {canAddHalls ? (
                  <Link to="/owner/reports">Full report</Link>
                ) : null}
              </div>
              <p className="owner-report-teaser-copy">
                Stats for{' '}
                <strong>{hotel?.hotelName || 'your hotel'}</strong> this month —
                deposits, demand, and conversion.
              </p>
              <ul className="owner-month-list">
                <li>
                  <span>New bookings</span>
                  <strong>{monthOverview.newBookings}</strong>
                </li>
                <li>
                  <span>Accepted / confirmed</span>
                  <strong>{monthOverview.acceptedBookings}</strong>
                </li>
                <li>
                  <span>Deposit revenue</span>
                  <strong>${monthOverview.revenue.toLocaleString()}</strong>
                </li>
                <li>
                  <span>Occupancy signal</span>
                  <strong>{monthOverview.occupancy}%</strong>
                </li>
              </ul>
              {canAddHalls ? (
                <Link to="/owner/reports" className="owner-report-open-btn">
                  Open hotel report →
                </Link>
              ) : null}
            </section>
          </section>

          <section className="owner-dash-grid owner-dash-grid-bottom">
            <section className="customer-panel">
              <div className="customer-panel-head">
                <h2>Recent Bookings</h2>
                <Link to="/owner/bookings">View all</Link>
              </div>

              {recent.length === 0 ? (
                <div className="owner-empty-bookings">
                  <IconCalendar />
                  <p>No booking requests yet</p>
                  <span>
                    Once customers request your halls, they will show here.
                  </span>
                </div>
              ) : (
                <div className="customer-table-wrap">
                  <table className="customer-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Hall</th>
                        <th>Event Date</th>
                        <th>Guests</th>
                        <th>Status</th>
                        <th>Requested On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((booking) => (
                        <tr key={booking._id}>
                          <td>
                            <strong>
                              {booking.customerId?.fullName || 'Customer'}
                            </strong>
                            <span>{booking.customerId?.email || ''}</span>
                          </td>
                          <td>{booking.hallId?.hallName || 'Hall'}</td>
                          <td>{formatDate(booking.eventDate)}</td>
                          <td>{booking.guestCount || '—'}</td>
                          <td>
                            <span
                              className={`status-badge ${statusClass[booking.status] || ''}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td>{formatDate(booking.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="customer-panel owner-status-panel">
              <div className="customer-panel-head">
                <h2>Booking Status</h2>
              </div>
              {chartHasData ? (
                <div className="owner-status-chart">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusChart}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {statusChart.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={CHART_COLORS[entry.key]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="owner-status-legend">
                    {statusChart.map((item) => (
                      <li key={item.key}>
                        <span
                          className="owner-status-dot"
                          style={{ background: CHART_COLORS[item.key] }}
                        />
                        <span>{item.name}</span>
                        <strong>{item.percent}%</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="owner-empty-bookings">
                  <p>No booking status data yet</p>
                  <span>Stats will appear once requests start coming in.</span>
                </div>
              )}
            </section>
          </section>
        </>
      )}
    </div>
  );
}

export default OwnerOverview;

