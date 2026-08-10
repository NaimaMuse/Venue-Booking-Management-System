import React, { useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import ReportToolbar from '../../components/admin/ReportToolbar';
import {
  applyReportRangeChange,
  CHART_COLORS,
  exportReportsCsv,
  getBookingDisplayStats,
  money,
  useAdminReports,
} from '../../hooks/useAdminReports';

const IconMoney = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M12 7.5V16.5M9.8 9.2C9.8 8.3 10.7 7.6 12 7.6C13.3 7.6 14.2 8.3 14.2 9.2C14.2 10.2 13.2 10.7 12 10.7C10.8 10.7 9.8 11.2 9.8 12.2C9.8 13.2 10.7 13.9 12 13.9C13.3 13.9 14.2 13.2 14.2 12.3"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

function AdminRevenueReports() {
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hotelId, setHotelId] = useState('');

  const filter = {
    range,
    from: range === 'custom' ? from : '',
    to: range === 'custom' ? to : '',
    hotelId,
  };
  const { reports, loading, error } = useAdminReports(filter);
  const bookingStats = useMemo(
    () => getBookingDisplayStats(reports.bookings),
    [reports.bookings]
  );

  const selectedHotel = reports.hotelOptions.find(
    (hotel) => hotel.id === hotelId
  );
  const hotelEarnings = reports.revenue.byHotel || [];

  const pieData = useMemo(
    () =>
      hotelEarnings
        .filter((hotel) => hotel.revenue > 0)
        .map((hotel, index) => ({
          name: hotel.hotelName,
          value: hotel.revenue,
          color: CHART_COLORS[index % CHART_COLORS.length],
        })),
    [hotelEarnings]
  );

  const avgPerBooking =
    bookingStats.accepted > 0
      ? reports.revenue.total / bookingStats.accepted
      : 0;

  return (
    <div className="customer-page admin-reports-page revenue-reports-page">
      <ReportToolbar
        title="Revenue Reports"
        subtitle="Track how much each hotel contributed to the system in the selected period."
        range={range}
        from={from}
        to={to}
        hotelId={hotelId}
        hotelOptions={reports.hotelOptions}
        onRangeChange={(nextRange) =>
          applyReportRangeChange(nextRange, { setRange, setFrom, setTo })
        }
        onFromChange={setFrom}
        onToChange={setTo}
        onHotelChange={setHotelId}
        onExportCsv={() =>
          exportReportsCsv(
            reports,
            {
              ...filter,
              hotelName: selectedHotel?.hotelName,
            },
            'hhf-revenue-reports'
          )
        }
        loading={loading}
        error={error}
        heroClassName="revenue-reports-hero"
        hintAll="Showing revenue from all hotels and all time."
        hintCustom="Date to Date shows booking revenue by event or request date. Use Hotel to focus on one venue."
      />

      {!loading && !error && (
        <>
          <section className="revenue-hero-card">
            <div className="revenue-hero-copy">
              <span className="revenue-hero-icon">
                <IconMoney />
              </span>
              <div>
                <p>Total earned</p>
                <h2>{money(reports.revenue.total)}</h2>
                <small>
                  {selectedHotel
                    ? selectedHotel.hotelName
                    : `${hotelEarnings.length} hotel${
                        hotelEarnings.length === 1 ? '' : 's'
                      } with activity`}
                  {range === 'custom' && from && to
                    ? ` · ${from} → ${to}`
                    : ' · All time'}
                </small>
              </div>
            </div>
            <ul className="revenue-hero-stats">
              <li>
                <span>Accepted</span>
                <strong>{bookingStats.accepted}</strong>
              </li>
              <li>
                <span>Avg / booking</span>
                <strong>{money(avgPerBooking)}</strong>
              </li>
              <li>
                <span>Requests</span>
                <strong>{bookingStats.total}</strong>
              </li>
            </ul>
          </section>

          <section className="revenue-split">
            <article className="revenue-board">
              <header className="revenue-board-head">
                <div>
                  <p>Contribution</p>
                  <h3>Hotel earnings</h3>
                </div>
                {hotelId ? (
                  <button
                    type="button"
                    className="revenue-clear-btn"
                    onClick={() => setHotelId('')}
                  >
                    Show all hotels
                  </button>
                ) : null}
              </header>

              {hotelEarnings.length === 0 ? (
                <p className="revenue-empty-msg">
                  No booking revenue for this filter yet.
                </p>
              ) : (
                <div className="revenue-table">
                  <div className="revenue-table-head">
                    <span>Hotel</span>
                    <span>Bookings</span>
                    <span>Revenue</span>
                    <span>Share</span>
                  </div>
                  {hotelEarnings.map((hotel, index) => {
                    const share = reports.revenue.total
                      ? Math.round(
                          (hotel.revenue / reports.revenue.total) * 100
                        )
                      : 0;
                    const active = hotelId === hotel.hotelId;
                    return (
                      <button
                        key={hotel.hotelId || hotel.hotelName}
                        type="button"
                        className={`revenue-table-row${active ? ' is-active' : ''}`}
                        onClick={() =>
                          setHotelId(active ? '' : hotel.hotelId || '')
                        }
                      >
                        <span className="revenue-table-hotel">
                          <i>{index + 1}</i>
                          <span>
                            <strong>{hotel.hotelName}</strong>
                            <small>{hotel.city || 'Hargeisa'}</small>
                          </span>
                        </span>
                        <span>{hotel.bookings}</span>
                        <span className="revenue-table-money">
                          {money(hotel.revenue)}
                        </span>
                        <span className="revenue-table-share">
                          <b>{share}%</b>
                          <em style={{ width: `${Math.max(share, 4)}%` }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>

            <aside className="revenue-side">
              <article className="revenue-side-card">
                <p>Share map</p>
                <h3>By hotel</h3>
                {pieData.length === 0 ? (
                  <p className="revenue-empty-msg">No chart data.</p>
                ) : (
                  <>
                    <div className="revenue-pie-wrap">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => money(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="revenue-pie-center">
                        <strong>{money(reports.revenue.total)}</strong>
                      </div>
                    </div>
                    <ul className="revenue-pie-legend">
                      {pieData.map((entry) => (
                        <li key={entry.name}>
                          <i style={{ background: entry.color }} />
                          <span>{entry.name}</span>
                          <strong>{money(entry.value)}</strong>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminRevenueReports;