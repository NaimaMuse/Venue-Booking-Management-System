import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import ReportToolbar from '../../components/admin/ReportToolbar';
import {
  applyReportRangeChange,
  exportReportsCsv,
  getBookingDisplayStats,
  useAdminReports,
} from '../../hooks/useAdminReports';

const IconHotels = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 19.5V6.8C4 5.8 4.8 5 5.8 5H14.2C15.2 5 16 5.8 16 6.8V19.5"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path d="M16 10H19.2C20.2 10 21 10.8 21 11.8V19.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19.5H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8 9H10M8 12.5H10M8 16H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconHalls = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9 14H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconBookings = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V6.5M16 3.5V6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

function MiniDonut({ data, total }) {
  if (!data.length) {
    return <p className="ops-mini-empty">No data</p>;
  }

  return (
    <div className="ops-mini-donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={34}
            outerRadius={48}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="ops-mini-donut-center">
        <strong>{total}</strong>
      </div>
    </div>
  );
}

function StatusBars({ items, total }) {
  return (
    <ul className="ops-bars">
      {items.map((item) => {
        const pct = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.name}>
            <div className="ops-bars-label">
              <span>{item.name}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="ops-bars-track">
              <i style={{ width: `${pct}%`, background: item.color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AdminOperationsReports() {
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filter = {
    range,
    from: range === 'custom' ? from : '',
    to: range === 'custom' ? to : '',
  };
  const { reports, loading, error } = useAdminReports(filter);

  const hotelItems = useMemo(
    () => [
      { name: 'Approved', value: reports.hotels.approved, color: '#1f7a3f' },
      { name: 'Pending', value: reports.hotels.pending, color: '#c5a070' },
      { name: 'Rejected', value: reports.hotels.rejected, color: '#a33a4a' },
    ],
    [reports.hotels]
  );

  const hallItems = useMemo(
    () => [
      { name: 'Available', value: reports.halls.available, color: '#4a2040' },
      { name: 'Unavailable', value: reports.halls.unavailable, color: '#8a8190' },
    ],
    [reports.halls]
  );

  const bookingStats = useMemo(
    () => getBookingDisplayStats(reports.bookings),
    [reports.bookings]
  );

  const bookingItems = useMemo(
    () => [
      { name: 'Pending', value: bookingStats.pending, color: '#c5a070' },
      { name: 'Accepted', value: bookingStats.accepted, color: '#1f7a3f' },
      { name: 'Rejected', value: bookingStats.rejected, color: '#a33a4a' },
    ],
    [bookingStats]
  );

  const hotelChart = hotelItems.filter((item) => item.value > 0);
  const hallChart = hallItems.filter((item) => item.value > 0);

  const hotelTotal =
    reports.hotels.approved + reports.hotels.pending + reports.hotels.rejected;
  const approvalRate = hotelTotal
    ? Math.round((reports.hotels.approved / hotelTotal) * 100)
    : 0;
  const hallLiveRate = reports.halls.total
    ? Math.round((reports.halls.available / reports.halls.total) * 100)
    : 0;

  return (
    <div className="customer-page admin-reports-page ops-reports-page">
      <ReportToolbar
        title="Operations Reports"
        subtitle="Track hotels, halls, and booking activity across the platform."
        range={range}
        from={from}
        to={to}
        onRangeChange={(nextRange) =>
          applyReportRangeChange(nextRange, { setRange, setFrom, setTo })
        }
        onFromChange={setFrom}
        onToChange={setTo}
        onExportCsv={() =>
          exportReportsCsv(reports, filter, 'hhf-operations-reports')
        }
        loading={loading}
        error={error}
        heroClassName="ops-reports-hero"
      />

      {!loading && !error && (
        <>
          <section className="ops-kpi-grid">
            <article className="ops-kpi-card">
              <span className="ops-kpi-icon">
                <IconHotels />
              </span>
              <div>
                <p>Hotels</p>
                <strong>{hotelTotal}</strong>
                <small>{approvalRate}% approved</small>
              </div>
            </article>
            <article className="ops-kpi-card">
              <span className="ops-kpi-icon is-gold">
                <IconHalls />
              </span>
              <div>
                <p>Halls</p>
                <strong>{reports.halls.total}</strong>
                <small>{hallLiveRate}% available</small>
              </div>
            </article>
            <article className="ops-kpi-card">
              <span className="ops-kpi-icon is-plum">
                <IconBookings />
              </span>
              <div>
                <p>Bookings</p>
                <strong>{bookingStats.total}</strong>
                <small>{bookingStats.successRate}% accepted</small>
              </div>
            </article>
            <article className="ops-kpi-card is-alert">
              <span className="ops-kpi-icon is-alert">
                <IconBookings />
              </span>
              <div>
                <p>Needs attention</p>
                <strong>
                  {reports.hotels.pending + bookingStats.pending}
                </strong>
                <small>
                  {reports.hotels.pending} hotels · {bookingStats.pending}{' '}
                  bookings
                </small>
              </div>
            </article>
          </section>

          <section className="ops-compact-grid">
            <article className="ops-compact-card">
              <header>
                <p>Hotels</p>
                <h2>Status</h2>
              </header>
              <div className="ops-compact-body">
                <MiniDonut data={hotelChart} total={hotelTotal} />
                <StatusBars items={hotelItems} total={hotelTotal} />
              </div>
            </article>

            <article className="ops-compact-card">
              <header>
                <p>Halls</p>
                <h2>Inventory</h2>
              </header>
              <div className="ops-compact-body">
                <MiniDonut data={hallChart} total={reports.halls.total} />
                <StatusBars items={hallItems} total={reports.halls.total} />
              </div>
            </article>

            <article className="ops-compact-card">
              <header>
                <p>Bookings</p>
                <h2>Requests</h2>
              </header>
              <div className="ops-compact-body ops-compact-body-solo">
                <StatusBars items={bookingItems} total={bookingStats.total} />
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminOperationsReports;
