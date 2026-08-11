import React from 'react';

import {
  getReportsFilterLabel,
  RANGE_OPTIONS,
} from '../../hooks/useAdminReports';
function ReportToolbar({
  title,
  subtitle,
  range,
  from,
  to,
  hotelId = '',
  hotelOptions = [],
  onRangeChange,
  onFromChange,
  onToChange,
  onHotelChange,
  onExportCsv,
  loading,
  error,
  heroClassName = '',
  hintAll = 'Showing all hotels, halls, and bookings.',
  hintCustom = 'Date to Date filters hotels/halls created in this range, and bookings with event or request date in this range.',
}) {
  const selectedHotelName = hotelOptions.find(
    (hotel) => hotel.id === hotelId
  )?.hotelName;
  const rangeLabel = getReportsFilterLabel({
    range,
    from,
    to,
    hotelName: selectedHotelName,
  });
  const printedOn = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const isCustom = range === 'custom';
  const dateError = isCustom && from && to && from > to;
  const showHotelFilter = typeof onHotelChange === 'function';

  return (
    <>
      <section
        className={`customer-page-header admin-reports-header${
          heroClassName ? ` ${heroClassName}` : ''
        }`}
      >
        <div>
          <p className="customer-eyebrow">Live Analytics</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="admin-reports-actions">
          <button
            type="button"
            className="owner-schedule-btn"
            onClick={() => window.print()}
          >
            Print / Export PDF
          </button>
          <button type="button" className="customer-gold-btn" onClick={onExportCsv}>
            Export CSV
          </button>
        </div>
        <div className="admin-reports-print-meta" aria-hidden="true">
          <span>{rangeLabel}</span>
          <span>Printed {printedOn}</span>
        </div>
      </section>

      <div className="admin-reports-filters" aria-label="Report filters">
        <label className="admin-reports-select">
          <span>Search by</span>
          <select
            value={range}
            onChange={(event) => onRangeChange(event.target.value)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {showHotelFilter && (
          <label className="admin-reports-select admin-reports-hotel">
            <span>Hotel</span>
            <select
              value={hotelId}
              onChange={(event) => onHotelChange(event.target.value)}
            >
              <option value="">All hotels</option>
              {hotelOptions.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.hotelName}
                  {hotel.city ? ` · ${hotel.city}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {isCustom && (
          <>
            <label className="admin-reports-date">
              <span>From</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => onFromChange(event.target.value)}
              />
            </label>

            <label className="admin-reports-date">
              <span>To</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => onToChange(event.target.value)}
              />
            </label>
          </>
        )}
      </div>

      {range === 'all' && !isCustom && (
        <p className="admin-reports-hint">{hintAll}</p>
      )}
      {isCustom && from && to && !dateError && (
        <p className="admin-reports-hint">{hintCustom}</p>
      )}

      {dateError && (
        <p className="customer-status customer-error">
          From date must be earlier than To date.
        </p>
      )}
      {isCustom && (!from || !to) && !loading && (
        <p className="customer-status">Choose From and To dates to filter.</p>
      )}
      {loading && <p className="customer-status">Loading live data from MongoDB...</p>}
      {error && <p className="customer-status customer-error">{error}</p>}
    </>
  );
}

export default ReportToolbar;
