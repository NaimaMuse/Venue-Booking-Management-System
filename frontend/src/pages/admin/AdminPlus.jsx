import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getApiError } from '../../utils/api';
import { formatDate } from '../../utils/auth';

const FILTERS = [
  { id: 'all', label: 'All Subscriptions' },
  { id: 'active', label: 'Active Plus' },
  { id: 'pending_payment', label: 'Pending Payment' },
  { id: 'expired', label: 'Expired' },
];

function AdminPlus() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeCount: 0,
    pendingCount: 0,
    expiredCount: 0,
    totalSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/plus/admin/subscriptions');
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(getApiError(err, 'Unable to load Plus subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleConfirmPayment = async (subscriptionId) => {
    const ref = window.prompt(
      'Confirm payment received. Enter optional verification notes / reference:'
    );
    if (ref === null) return; // User canceled

    try {
      setBusyId(subscriptionId);
      setError('');
      setSuccess('');

      const { data } = await api.patch(
        `/api/plus/admin/confirm/${subscriptionId}`,
        {
          paymentNotes: ref ? ref.trim() : 'Payment confirmed by administrator',
        }
      );

      setSuccess(
        data.message || 'Payment confirmed! Hotel is now featured with HallHub Plus.'
      );
      await loadSubscriptions();
    } catch (err) {
      setError(getApiError(err, 'Failed to confirm payment'));
    } finally {
      setBusyId('');
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel / expire this subscription? The hotel will lose its Featured benefits.'
      )
    ) {
      return;
    }

    try {
      setBusyId(subscriptionId);
      setError('');
      setSuccess('');

      await api.patch(`/api/plus/admin/cancel/${subscriptionId}`);
      setSuccess('Subscription cancelled.');
      await loadSubscriptions();
    } catch (err) {
      setError(getApiError(err, 'Failed to cancel subscription'));
    } finally {
      setBusyId('');
    }
  };

  const visibleSubscriptions = useMemo(() => {
    let list = subscriptions;

    if (filter !== 'all') {
      list = list.filter((sub) => sub.status === filter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((sub) => {
        const hotelName = sub.hotelId?.hotelName?.toLowerCase() || '';
        const ownerName = sub.ownerId?.fullName?.toLowerCase() || '';
        const ownerEmail = sub.ownerId?.email?.toLowerCase() || '';
        const ref = sub.paymentReference?.toLowerCase() || '';
        const city = sub.hotelId?.city?.toLowerCase() || '';
        return (
          hotelName.includes(q) ||
          ownerName.includes(q) ||
          ownerEmail.includes(q) ||
          ref.includes(q) ||
          city.includes(q)
        );
      });
    }

    return list;
  }, [subscriptions, filter, search]);

  const getStatusBadge = (status, expiresAt) => {
    const isPast = expiresAt && new Date(expiresAt) <= new Date();

    if (status === 'active' && !isPast) {
      return <span className="status-badge status-badge-confirmed">Active ⭐</span>;
    }
    if (status === 'pending_payment') {
      return (
        <span className="status-badge status-badge-pending">
          Pending Payment
        </span>
      );
    }
    if (status === 'expired' || isPast) {
      return <span className="status-badge status-badge-cancelled">Expired</span>;
    }
    if (status === 'cancelled') {
      return <span className="status-badge status-badge-rejected">Cancelled</span>;
    }
    return <span className="status-badge">{status}</span>;
  };

  return (
    <div className="customer-page admin-plus-page">
      {/* Component Specific CSS Styles */}
      <style>{`
        .admin-plus-page {
          padding: 2rem;
          max-width: 1300px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
        }

        .admin-plus-hero {
          background: linear-gradient(135deg, #4a2040 0%, #1e293b 100%);
          color: #ffffff;
          padding: 2.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
        }

        .customer-eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.825rem;
          font-weight: 700;
          color: #f59e0b;
          margin: 0 0 0.5rem 0;
        }

        .admin-plus-hero h1 {
          margin: 0 0 0.75rem 0;
          font-size: 2.25rem;
          font-weight: 800;
        }

        .admin-plus-hero p {
          margin: 0;
          color: #94a3b8;
          max-width: 650px;
          line-height: 1.6;
          font-size: 1rem;
        }

        /* Notifications */
        .auth-error {
          background-color: #e63dd2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem 1.25rem;
          border-radius: 10px;
          font-weight: 500;
        }

        .profile-success {
          background-color: #4a2040;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 1rem 1.25rem;
          border-radius: 10px;
          font-weight: 500;
        }

        /* KPI Cards */
        .admin-plus-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .owner-metric-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .owner-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .owner-metric-icon {
          font-size: 2rem;
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .owner-metric-card p {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .owner-metric-card strong {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        /* Table & Filters Panel */
        .admin-plus-table-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .admin-plus-panel-head {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          background: #f8fafc;
        }

        .admin-plus-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .admin-filter-pill {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-filter-pill:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .admin-filter-pill.is-active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .admin-search-input {
          padding: 0.55rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.875rem;
          width: 260px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .admin-search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .customer-status, .customer-empty {
          padding: 3rem;
          text-align: center;
          color: #64748b;
          font-size: 1rem;
          margin: 0;
        }

        /* Table */
        .admin-plus-table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .hh-plus-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.875rem;
        }

        .hh-plus-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .hh-plus-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .hh-plus-table tr:hover {
          background: #fafafa;
        }

        .hh-table-sub {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.15rem;
        }

        .hh-plan-tag {
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 600;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          display: inline-block;
        }

        code {
          background: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
          color: #334155;
        }

        .hh-expired-date {
          color: #dc2626;
          font-weight: 600;
        }

        /* Status Badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .status-badge-confirmed {
          background: #dcfce7;
          color: #15803d;
        }

        .status-badge-pending {
          background: #fef3c7;
          color: #b45309;
        }

        .status-badge-cancelled {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-badge-rejected {
          background: #fee2e2;
          color: #b91c1c;
        }

        /* Actions Cell & Buttons */
        .admin-actions-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .hh-action-btn-sm {
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .hh-action-btn-sm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .customer-gold-btn {
          background: #f59e0b;
          color: #ffffff;
        }

        .customer-gold-btn:hover:not(:disabled) {
          background: #d97706;
        }

        .owner-reject-btn {
          background: #ffffff;
          border-color: #fca5a5;
          color: #dc2626;
        }

        .owner-reject-btn:hover:not(:disabled) {
          background: #fef2f2;
        }

        .owner-schedule-btn {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #334155;
        }

        .owner-schedule-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
      `}</style>

      <section className="customer-page-header admin-plus-hero">
        <div>
          <p className="customer-eyebrow">Admin Management</p>
          <h1>⭐ HallHub Plus Subscriptions</h1>
          <p>
            Review hotel paid promotions, verify payment transactions, and track
            active and expired Plus subscriptions across the platform.
          </p>
        </div>
      </section>

      {error && <p className="auth-error" style={{ marginBottom: 20 }}>{error}</p>}
      {success && <p className="profile-success" style={{ marginBottom: 20 }}>{success}</p>}

      {/* KPI Stats Row */}
      <section className="owner-metric-row admin-plus-kpi-row">
        <article className="metric-card owner-metric-card">
          <span className="owner-metric-icon">⭐</span>
          <div>
            <p>Active Plus Hotels</p>
            <strong>{stats.activeCount || 0}</strong>
          </div>
        </article>

        <article className="metric-card owner-metric-card">
          <span className="owner-metric-icon">⏳</span>
          <div>
            <p>Pending Payment Verification</p>
            <strong>{stats.pendingCount || 0}</strong>
          </div>
        </article>

        <article className="metric-card owner-metric-card">
          <span className="owner-metric-icon">📉</span>
          <div>
            <p>Expired Subscriptions</p>
            <strong>{stats.expiredCount || 0}</strong>
          </div>
        </article>

        <article className="metric-card owner-metric-card">
          <span className="owner-metric-icon">💰</span>
          <div>
            <p>Total Plus Revenue</p>
            <strong>${Number(stats.totalRevenue || 0).toLocaleString()}</strong>
          </div>
        </article>
      </section>

      {/* Main Subscriptions Panel */}
      <section className="customer-panel admin-plus-table-panel">
        <div className="customer-panel-head admin-plus-panel-head">
          <div className="admin-plus-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`admin-filter-pill${filter === f.id ? ' is-active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="admin-plus-search-box">
            <input
              type="search"
              placeholder="Search hotel, owner, or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>

        {loading ? (
          <p className="customer-status">Loading subscriptions...</p>
        ) : visibleSubscriptions.length === 0 ? (
          <p className="customer-empty">
            {filter === 'all'
              ? 'No HallHub Plus subscriptions found.'
              : `No ${filter.replace('_', ' ')} subscriptions found.`}
          </p>
        ) : (
          <div className="admin-plus-table-responsive">
            <table className="admin-venues-table hh-plus-table">
              <thead>
                <tr>
                  <th>Hotel</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Payment Ref</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Expiration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubscriptions.map((sub) => {
                  const hotelName = sub.hotelId?.hotelName || 'Unknown Hotel';
                  const hotelCity = sub.hotelId?.city || 'Hargeisa';
                  const ownerName = sub.ownerId?.fullName || 'Unknown Owner';
                  const ownerPhone = sub.ownerId?.phone || sub.ownerId?.email || '';
                  const isBusy = busyId === sub._id;
                  const isPending = sub.status === 'pending_payment';
                  const isActive =
                    sub.status === 'active' &&
                    sub.expiresAt &&
                    new Date(sub.expiresAt) > new Date();

                  return (
                    <tr key={sub._id}>
                      <td>
                        <strong>{hotelName}</strong>
                        <span className="hh-table-sub">{hotelCity}</span>
                      </td>

                      <td>
                        <strong>{ownerName}</strong>
                        <span className="hh-table-sub">{ownerPhone}</span>
                      </td>

                      <td>
                        <span className="hh-plan-tag">{sub.planName}</span>
                      </td>

                      <td>
                        <strong>${sub.price}</strong>
                      </td>

                      <td>
                        <code>{sub.paymentReference || '—'}</code>
                        <span className="hh-table-sub">
                          Via {sub.paymentMethod?.toUpperCase()}
                        </span>
                      </td>

                      <td>{getStatusBadge(sub.status, sub.expiresAt)}</td>

                      <td>{formatDate(sub.startedAt)}</td>

                      <td>
                        <span
                          className={
                            sub.expiresAt && new Date(sub.expiresAt) <= new Date()
                              ? 'hh-expired-date'
                              : ''
                          }
                        >
                          {formatDate(sub.expiresAt)}
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions-cell">
                          {isPending && (
                            <button
                              type="button"
                              className="customer-gold-btn hh-action-btn-sm"
                              onClick={() => handleConfirmPayment(sub._id)}
                              disabled={isBusy}
                              title="Verify payment and activate Plus promotion"
                            >
                              {isBusy ? 'Processing...' : 'Confirm & Activate'}
                            </button>
                          )}

                          {isActive && (
                            <button
                              type="button"
                              className="owner-reject-btn hh-action-btn-sm"
                              onClick={() => handleCancelSubscription(sub._id)}
                              disabled={isBusy}
                              title="Cancel / expire subscription"
                            >
                              Cancel
                            </button>
                          )}

                          {sub.hotelId?._id && (
                            <Link
                              to={`/hotels/${sub.hotelId._id}`}
                              className="owner-schedule-btn hh-action-btn-sm"
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Hotel
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPlus;