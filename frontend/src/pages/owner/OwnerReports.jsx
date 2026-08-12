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