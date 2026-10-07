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
