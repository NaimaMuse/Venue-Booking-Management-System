import React, { useMemo, useState } from 'react';
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

import ReportToolbar from '../../components/admin/ReportToolbar';
import {
  applyReportRangeChange,
  exportReportsCsv,
  getBookingDisplayStats,
  money,
  useAdminReports,
} from '../../hooks/useAdminReports';

function AdminPerformanceReports() {
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filter = {
    range,
    from: range === 'custom' ? from : '',
    to: range === 'custom' ? to : '',
  };
  const { reports, loading, error } = useAdminReports(filter);
  const bookingStats = useMemo(
    () => getBookingDisplayStats(reports.bookings),
    [reports.bookings]
  );

  const totalUsers = reports.users.customers + reports.users.hotelOwners;
  const userPie = useMemo(
    () =>
      [
        {
          name: 'Customers',
          value: reports.users.customers,
          color: '#4a2040',
        },
        {
          name: 'Hotel Owners',
          value: reports.users.hotelOwners,
          color: '#c5a070',
        },
      ].filter((item) => item.value > 0),
    [reports.users]
  );

  const peakMonth = useMemo(() => {
    if (!reports.timeline?.length) {
      return null;
    }
    return reports.timeline.reduce((best, point) =>
      (point.bookings || 0) > (best.bookings || 0) ? point : best
    );
  }, [reports.timeline]);

  return (
    <div className="customer-page admin-reports-page performance-reports-page">
      <ReportToolbar
        title="Performance Reports"
        subtitle="Track platform growth, booking activity, and top-performing venues."
        range={range}
        from={from}
        to={to}
        onRangeChange={(nextRange) =>
          applyReportRangeChange(nextRange, { setRange, setFrom, setTo })
        }
        onFromChange={setFrom}
        onToChange={setTo}
        onExportCsv={() =>
          exportReportsCsv(reports, filter, 'hhf-performance-reports')
        }
        loading={loading}
        error={error}
        heroClassName="performance-reports-hero"
        hintAll="Showing all-time growth and rankings."
        hintCustom="Date to Date filters booking activity and rankings by event or request date."
      />

      {!loading && !error && (
        <>
          <section className="perf-hero-card">
            <div>
              <p>Platform users</p>
              <h2>{totalUsers}</h2>
              <small>
                {reports.users.customers} customers ·{' '}
                {reports.users.hotelOwners} hotel owners
              </small>
            </div>
            <ul className="perf-hero-stats">
              <li>
                <span>Bookings</span>
                <strong>{bookingStats.total}</strong>
              </li>
              <li>
                <span>Accepted</span>
                <strong>{bookingStats.accepted}</strong>
              </li>
              <li>
                <span>Peak month</span>
                <strong>
                  {peakMonth?.bookings
                    ? `${peakMonth.month} (${peakMonth.bookings})`
                    : '—'}
                </strong>
              </li>
            </ul>
          </section>

          <section className="perf-kpis">
            <article>
              <span>Customers</span>
              <strong>{reports.users.customers}</strong>
              <small>
                {totalUsers
                  ? Math.round((reports.users.customers / totalUsers) * 100)
                  : 0}
                % of users
              </small>
            </article>
            <article>
              <span>Hotel owners</span>
              <strong>{reports.users.hotelOwners}</strong>
              <small>
                {totalUsers
                  ? Math.round((reports.users.hotelOwners / totalUsers) * 100)
                  : 0}
                % of users
              </small>
            </article>
            <article>
              <span>Top halls</span>
              <strong>{reports.topHalls.length}</strong>
              <small>Ranked by bookings</small>
            </article>
            <article>
              <span>Top hotels</span>
              <strong>{reports.topHotels.length}</strong>
              <small>Ranked by activity</small>
            </article>
          </section>

          <section className="perf-mid">
            <article className="perf-panel">
              <header>
                <p>Users</p>
                <h3>Audience mix</h3>
              </header>
              {userPie.length === 0 ? (
                <p className="perf-empty">No user data yet.</p>
              ) : (
                <div className="perf-user-mix">
                  <div className="perf-pie-wrap">
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={userPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {userPie.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="perf-pie-center">
                      <strong>{totalUsers}</strong>
                    </div>
                  </div>
                  <ul className="perf-legend">
                    {userPie.map((entry) => (
                      <li key={entry.name}>
                        <i style={{ background: entry.color }} />
                        <span>{entry.name}</span>
                        <strong>{entry.value}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className="perf-panel perf-panel-wide">
              <header>
                <p>Growth</p>
                <h3>Booking volume</h3>
              </header>
              <div className="perf-chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={reports.timeline}>
                    <defs>
                      <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c5a070" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#c5a070" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#eadfe6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#8a8190', fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#8a8190', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #eadfe6',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#4a2040"
                      strokeWidth={2.4}
                      fill="url(#perfFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="perf-ranks">
            <article className="perf-panel">
              <header>
                <p>Halls</p>
                <h3>Most popular</h3>
              </header>
              {reports.topHalls.length === 0 ? (
                <p className="perf-empty">No hall activity in this range.</p>
              ) : (
                <ul className="perf-rank-list">
                  {reports.topHalls.map((hall, index) => (
                    <li key={hall.hallId}>
                      <span className="perf-rank-num">{index + 1}</span>
                      <div>
                        <strong>{hall.hallName}</strong>
                        <small>{hall.hotelName}</small>
                      </div>
                      <div className="perf-rank-meta">
                        <strong>{hall.bookings}</strong>
                        <small>{money(hall.revenue || 0)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="perf-panel">
              <header>
                <p>Hotels</p>
                <h3>Top performing</h3>
              </header>
              {reports.topHotels.length === 0 ? (
                <p className="perf-empty">No hotel activity in this range.</p>
              ) : (
                <ul className="perf-rank-list">
                  {reports.topHotels.map((hotel, index) => (
                    <li key={hotel.hotelId}>
                      <span className="perf-rank-num">{index + 1}</span>
                      <div>
                        <strong>{hotel.hotelName}</strong>
                        <small>{hotel.city || 'Hargeisa'}</small>
                      </div>
                      <div className="perf-rank-meta">
                        <strong>{hotel.bookings}</strong>
                        <small>{money(hotel.revenue || 0)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminPerformanceReports;
