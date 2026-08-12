import { useEffect, useState } from 'react';

import api, { getApiError } from '../utils/api';

export const RANGE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Date to Date' },
];

/** Current calendar month as YYYY-MM-DD from/to (for Date to Date default). */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad = (value) => String(value).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();

  return {
    from: `${year}-${pad(month + 1)}-01`,
    to: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  };
};

export const CHART_COLORS = [
  '#4a2040',
  '#c5a070',
  '#d4b37a',
  '#8a4a78',
  '#6b6570',
  '#1f7a3f',
];

export const emptyReports = {
  hotels: { total: 0, approved: 0, pending: 0, rejected: 0 },
  halls: { total: 0, available: 0, unavailable: 0 },
  bookings: {
    total: 0,
    pending: 0,
    accepted: 0,
    confirmed: 0,
    cancelled: 0,
    rejected: 0,
  },
  revenue: { total: 0, byHotel: [], byMonth: [] },
  users: { customers: 0, hotelOwners: 0 },
  timeline: [],
  topHalls: [],
  topHotels: [],
  hotelOptions: [],
};

/** Normalize booking buckets so UI totals always match reports.total */
export const getBookingDisplayStats = (bookings = {}) => {
  const pending = Number(bookings.pending) || 0;
  const accepted = Number(bookings.accepted) || 0;
  const confirmed = Number(bookings.confirmed) || 0;
  const cancelled = Number(bookings.cancelled) || 0;
  const rejected = Number(bookings.rejected) || 0;
  const known = pending + accepted + confirmed + cancelled + rejected;
  const total = Number(bookings.total) || known;

  return {
    total,
    pending,
    accepted: accepted + confirmed,
    rejected: rejected + cancelled,
    confirmed,
    cancelled,
    successRate: total
      ? Math.round(((accepted + confirmed) / total) * 100)
      : 0,
  };
};

export const money = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export const getReportsFilterLabel = ({ range, from, to, hotelName }) => {
  const parts = [];
  if (range === 'custom') {
    parts.push(`${from || '…'} → ${to || '…'}`);
  } else {
    parts.push(
      RANGE_OPTIONS.find((option) => option.id === range)?.label || 'All'
    );
  }
  if (hotelName) {
    parts.push(hotelName);
  }
  return parts.join(' · ');
};

/** Apply range change and auto-fill current month for Date to Date. */
export const applyReportRangeChange = (nextRange, setters) => {
  const { setRange, setFrom, setTo } = setters;
  setRange(nextRange);

  if (nextRange === 'custom') {
    const month = getCurrentMonthRange();
    setFrom(month.from);
    setTo(month.to);
    return;
  }

  setFrom('');
  setTo('');
};

export const exportReportsCsv = (reports, filter, filenamePrefix) => {
  const label = getReportsFilterLabel(filter);
  const rows = [
    ['Section', 'Metric', 'Value'],
    ['Filter', 'Range', label],
    ['Hotels', 'Total', reports.hotels.total],
    ['Hotels', 'Approved', reports.hotels.approved],
    ['Hotels', 'Pending', reports.hotels.pending],
    ['Hotels', 'Rejected', reports.hotels.rejected],
    ['Halls', 'Total', reports.halls.total],
    ['Halls', 'Available', reports.halls.available],
    ['Halls', 'Unavailable', reports.halls.unavailable],
    ['Bookings', 'Total', reports.bookings.total],
    ['Bookings', 'Pending', reports.bookings.pending],
    ['Bookings', 'Accepted', reports.bookings.accepted],
    ['Bookings', 'Rejected', reports.bookings.rejected],
    ['Revenue', 'Total Accepted Value', reports.revenue.total],
    ['Users', 'Customers', reports.users.customers],
    ['Users', 'Hotel Owners', reports.users.hotelOwners],
    [],
    ['Top Halls', 'Hall', 'Hotel', 'Bookings', 'Revenue'],
    ...reports.topHalls.map((item) => [
      'Top Hall',
      item.hallName,
      item.hotelName,
      item.bookings,
      item.revenue || 0,
    ]),
    [],
    ['Top Hotels', 'Hotel', 'City', 'Bookings', 'Revenue'],
    ...reports.topHotels.map((item) => [
      'Top Hotel',
      item.hotelName,
      item.city,
      item.bookings,
      item.revenue || 0,
    ]),
    [],
    ['Revenue By Hotel', 'Hotel', 'Revenue'],
    ...reports.revenue.byHotel.map((item) => [
      'Revenue',
      item.hotelName,
      item.revenue,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const stamp = filter.from || filter.to || filter.range || 'year';
  link.download = `${filenamePrefix}-${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export function useAdminReports({
  range = 'all',
  from = '',
  to = '',
  hotelId = '',
} = {}) {
  const [reports, setReports] = useState(emptyReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const needsDates = range === 'custom';
    const hasDates = Boolean(from && to && from <= to);

    if (needsDates && !hasDates) {
      setLoading(false);
      setError('');
      return undefined;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const params = { range };
        if (from) params.from = from;
        if (to) params.to = to;
        if (hotelId) params.hotelId = hotelId;

        const { data } = await api.get('/api/admin/reports', { params });

        if (!active) {
          return;
        }

        setReports({
          ...emptyReports,
          ...data,
          hotels: { ...emptyReports.hotels, ...data?.hotels },
          halls: { ...emptyReports.halls, ...data?.halls },
          bookings: { ...emptyReports.bookings, ...data?.bookings },
          revenue: { ...emptyReports.revenue, ...data?.revenue },
          users: { ...emptyReports.users, ...data?.users },
          timeline: data?.timeline || [],
          topHalls: data?.topHalls || [],
          topHotels: data?.topHotels || [],
          hotelOptions: data?.hotelOptions || [],
        });
      } catch (err) {
        if (!active) {
          return;
        }
        setError(
          getApiError(err, 'Unable to load live analytics from the database')
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [range, from, to, hotelId]);

  return { reports, loading, error };
}
