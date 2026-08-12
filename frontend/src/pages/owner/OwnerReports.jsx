import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatDate } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const STATUS_COLORS = {
  pending: '#d4b37a',
  accepted: '#4a2040',
  confirmed: '#1f7a3f',
  rejected: '#a33a4a',
  cancelled: '#8a8190',
};

const money = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const currentMonthBounds = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(last).padStart(2, '0')}`,
  };
};

function OwnerReports() {
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = { range };
        if (range === 'custom' && from && to) {
          params.from = from;
          params.to = to;
        }
        const { data } = await api.get('/api/owner/reports', { params });
        setReport(data);
      } catch (err) {
        setError(getApiError(err, 'Unable to load hotel report'));
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (range === 'custom' && (!from || !to)) {
      return;
    }

    load();
  }, [range, from, to]);

  const summary = report?.summary || {};
  const pieData = useMemo(
    () =>
      (report?.statusBreakdown || []).filter((item) => item.value > 0),
    [report]
  );

  const handleRangeChange = (next) => {
    if (next === 'custom') {
      const bounds = currentMonthBounds();
      setFrom(bounds.from);
      setTo(bounds.to);
    } else {
      setFrom('');
      setTo('');
    }
    setRange(next);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="customer-page owner-reports-page">
      <section className="customer-page-header owner-reports-hero">
        <div>
          <p className="customer-eyebrow">My Hotel Report</p>
          <h1>{report?.hotel?.hotelName || 'Hotel Report'}</h1>
          <p>
            Performance for your venue only — bookings, deposits, hall demand,
            and conversion.
            {report?.hotel?.city ? ` · ${report.hotel.city}` : ''}
          </p>
        </div>
        <div className="owner-reports-hero-actions">
          <Link to="/owner/dashboard" className="owner-schedule-btn">
            Dashboard
          </Link>
          <button
            type="button"
            className="customer-gold-btn"
            onClick={handlePrint}
          >
            Print report
          </button>
        </div>
      </section>

      <div className="owner-reports-toolbar no-print">
        <div className="owner-reports-filters" role="tablist">
          <button
            type="button"
            className={`owner-reports-filter${range === 'all' ? ' is-active' : ''}`}
            onClick={() => handleRangeChange('all')}
          >
            All time
          </button>
          <button
            type="button"
            className={`owner-reports-filter${
              range === 'custom' ? ' is-active' : ''
            }`}
            onClick={() => handleRangeChange('custom')}
          >
            Date to date
          </button>
        </div>

        {range === 'custom' && (
          <div className="owner-reports-dates">
            <label>
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      {loading && <p className="customer-status">Loading hotel report...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}

      {!loading && !error && report && (
        <>
          <section className="owner-reports-kpis">
            <article>
              <span>Total bookings</span>
              <strong>{summary.totalBookings || 0}</strong>
            </article>
            <article className="is-gold">
              <span>Deposit revenue</span>
              <strong>{money(summary.depositRevenue)}</strong>
            </article>
            <article className="is-green">
              <span>Confirmed</span>
              <strong>{summary.confirmed || 0}</strong>
            </article>
            <article>
              <span>Conversion</span>
              <strong>{summary.conversionRate || 0}%</strong>
            </article>
            <article>
              <span>Pending</span>
              <strong>{summary.pending || 0}</strong>
            </article>
            <article>
              <span>Halls</span>
              <strong>
                {summary.availableHalls || 0}
                <small>/{summary.totalHalls || 0}</small>
              </strong>
            </article>
          </section>
          
          <section className="owner-reports-grid">
            <article className="owner-reports-panel">
              <div className="owner-reports-panel-head">
                <div>
                  <p>Demand</p>
                  <h2>Bookings over time</h2>
                </div>
              </div>
              {(report.timeline || []).length === 0 ? (
                <p className="owner-reports-empty">No timeline data yet.</p>
              ) : (
                <div className="owner-reports-chart">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={report.timeline}>
                      <defs>
                        <linearGradient id="ownerRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c5a070" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#c5a070" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f0e6ec" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#8a8190', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8a8190', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        stroke="#4a2040"
                        fill="url(#ownerRev)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="owner-reports-panel">
              <div className="owner-reports-panel-head">
                <div>
                  <p>Pipeline</p>
                  <h2>Booking status</h2>
                </div>
              </div>
              {pieData.length === 0 ? (
                <p className="owner-reports-empty">No status data yet.</p>
              ) : (
                <div className="owner-reports-pie-wrap">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={74}
                        paddingAngle={3}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={STATUS_COLORS[entry.key] || '#c5a070'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="owner-reports-legend">
                    {pieData.map((item) => (
                      <li key={item.key}>
                        <span
                          style={{ background: STATUS_COLORS[item.key] }}
                        />
                        {item.name}
                        <strong>{item.value}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          </section>

          <section className="owner-reports-panel">
            <div className="owner-reports-panel-head">
              <div>
                <p>Halls</p>
                <h2>Hall performance</h2>
              </div>
              <Link to="/owner/halls">Manage halls</Link>
            </div>

            {(report.byHall || []).length === 0 ? (
              <p className="owner-reports-empty">No halls listed yet.</p>
            ) : (
              <div className="owner-reports-table-wrap">
                <table className="owner-reports-table">
                  <thead>
                    <tr>
                      <th>Hall</th>
                      <th>Capacity</th>
                      <th>Price / day</th>
                      <th>Bookings</th>
                      <th>Confirmed</th>
                      <th>Deposit revenue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byHall.map((hall) => (
                      <tr key={hall.hallId}>
                        <td>
                          <strong>{hall.hallName}</strong>
                        </td>
                        <td>{hall.capacity} guests</td>
                        <td>{money(hall.pricePerDay)}</td>
                        <td>{hall.bookings}</td>
                        <td>{hall.confirmed}</td>
                        <td>{money(hall.revenue)}</td>
                        <td>
                          <span
                            className={`admin-venue-avail${
                              hall.isAvailable ? ' is-on' : ' is-off'
                            }`}
                          >
                            {hall.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="owner-reports-panel">
            <div className="owner-reports-panel-head">
              <div>
                <p>Activity</p>
                <h2>Recent bookings</h2>
              </div>
              <Link to="/owner/bookings">View all</Link>
            </div>

            {(report.recent || []).length === 0 ? (
              <p className="owner-reports-empty">No bookings in this period.</p>
            ) : (
              <div className="owner-reports-table-wrap">
                <table className="owner-reports-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Hall</th>
                      <th>Event date</th>
                      <th>Guests</th>
                      <th>Deposit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recent.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>{booking.customerName}</strong>
                        </td>
                        <td>{booking.hallName}</td>
                        <td>{formatDate(booking.eventDate)}</td>
                        <td>{booking.guestCount || '—'}</td>
                        <td>{money(booking.depositAmount)}</td>
                        <td>
                          <span
                            className={`status-badge status-badge-${booking.status}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default OwnerReports;
