import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getApiError } from '../../utils/api';
import { formatDate } from '../../utils/auth';

const PAYMENT_METHODS = [
  { id: 'zaad', name: 'Zaad (Telesom)', details: 'Merchant: 402288 / 063-4889900' },
  { id: 'edahab', name: 'EDAHAB', details: 'Merchant: 701122 / 065-4889900' },
  { id: 'telesom', name: 'Telesom/EVC', details: 'Number: 063-4889900' },
  { id: 'bank_transfer', name: 'Bank Transfer', details: 'Dahabshiil Bank A/C: 102938475' },
];

function OwnerPlus() {
  const [plans, setPlans] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment checkout state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('zaad');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [plansRes, subRes] = await Promise.all([
        api.get('/api/plus/plans'),
        api.get('/api/plus/my-subscription'),
      ]);

      setPlans(plansRes.data.plans || []);
      setSubscriptionData(subRes.data);
      setHotel(subRes.data.hotel);
    } catch (err) {
      setError(getApiError(err, 'Unable to load HallHub Plus details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setPaymentReference('');
    setPaymentNotes('');
    setShowCheckoutModal(true);
    setError('');
    setSuccess('');
  };

  const closeCheckout = () => {
    setShowCheckoutModal(false);
    setSelectedPlan(null);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!paymentReference.trim()) {
      setError('Please provide your payment transaction reference / sender phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const { data } = await api.post('/api/plus/subscribe', {
        plan: selectedPlan.id,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentNotes: paymentNotes.trim(),
      });

      setSuccess(
        data.message ||
          'Subscription order submitted. Benefits will activate as soon as payment is confirmed.'
      );
      setShowCheckoutModal(false);
      await loadData();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit Plus subscription order'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    if (!window.confirm('Are you sure you want to cancel this pending subscription order?')) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/plus/cancel');
      setSuccess('Pending order cancelled successfully.');
      await loadData();
    } catch (err) {
      setError(getApiError(err, 'Failed to cancel order'));
    } finally {
      setSubmitting(false);
    }
  };

  const activeSub = subscriptionData?.activeSubscription;
  const pendingSub = subscriptionData?.pendingSubscription;
  const isPlusActive = subscriptionData?.hasActivePlus;
  const daysRemaining = subscriptionData?.daysRemaining ?? 0;
  const isHotelApproved = hotel?.verificationStatus === 'approved';

  return (
    <div className="customer-page owner-plus-page">
      <section className="customer-page-header owner-plus-hero">
        <div>
          <p className="customer-eyebrow">HallHub Plus Premium</p>
          <h1>⭐ HallHub Plus Promotion</h1>
          <p>
            Maximize your hotel&apos;s bookings with top placement in search results,
            an exclusive Featured badge, homepage spotlight, and higher photo upload capacity.
          </p>
        </div>
        <div className="owner-plus-hero-status">
          {isPlusActive ? (
            <span className="hh-plus-hero-badge is-active">
              ⭐ Active Plus Partner ({daysRemaining} days left)
            </span>
          ) : (
            <span className="hh-plus-hero-badge is-free">
              Standard Listing
            </span>
          )}
        </div>
      </section>

      {error && <p className="auth-error" style={{ marginBottom: 20 }}>{error}</p>}
      {success && <p className="profile-success" style={{ marginBottom: 20 }}>{success}</p>}

      {hotel && !isHotelApproved && (
        <div className="owner-status-banner owner-status-pending" style={{ marginBottom: 24 }}>
          <strong>Notice:</strong> Your hotel is currently pending admin approval.
          Once approved, HallHub Plus can be activated to boost your visibility.
        </div>
      )}

      {loading ? (
        <p className="customer-status">Loading HallHub Plus subscription details...</p>
      ) : (
        <>
          {/* Current Subscription Status Card */}
          <section className="customer-panel hh-plus-status-panel">
            <div className="customer-panel-head">
              <h2>Current Subscription Status</h2>
              {isPlusActive && (
                <span className="hh-status-active-pill">Status: Active</span>
              )}
            </div>

            {isPlusActive ? (
              <div className="hh-plus-active-dashboard">
                <div className="hh-plus-active-banner">
                  <div className="hh-plus-banner-left">
                    <span className="hh-plus-star-icon">⭐</span>
                    <div>
                      <h3>{activeSub?.planName || 'HallHub Plus'}</h3>
                      <p>
                        Your hotel <strong>{hotel?.hotelName}</strong> is actively promoted.
                        Benefits are live on the homepage and search listings.
                      </p>
                    </div>
                  </div>
                  <div className="hh-plus-countdown-box">
                    <strong>{daysRemaining}</strong>
                    <span>Days Remaining</span>
                  </div>
                </div>

                <div className="hh-plus-details-grid">
                  <div className="hh-plus-detail-box">
                    <span>Plan</span>
                    <strong>{activeSub?.planName}</strong>
                  </div>
                  <div className="hh-plus-detail-box">
                    <span>Price</span>
                    <strong>${activeSub?.price} USD</strong>
                  </div>
                  <div className="hh-plus-detail-box">
                    <span>Start Date</span>
                    <strong>{formatDate(activeSub?.startedAt)}</strong>
                  </div>
                  <div className="hh-plus-detail-box">
                    <span>Expiration Date</span>
                    <strong>{formatDate(activeSub?.expiresAt)}</strong>
                  </div>
                  <div className="hh-plus-detail-box">
                    <span>Max Hall Photos</span>
                    <strong>15 Photos Allowed</strong>
                  </div>
                  <div className="hh-plus-detail-box">
                    <span>Search Placement</span>
                    <strong>🚀 Top Priority</strong>
                  </div>
                </div>

                <div className="hh-plus-actions-row">
                  <button
                    type="button"
                    className="customer-gold-btn"
                    onClick={() => openCheckout(plans.find((p) => p.id === activeSub?.plan) || plans[0])}
                  >
                    Renew / Extend Subscription
                  </button>
                  {hotel?._id && (
                    <Link
                      to={`/hotels/${hotel._id}`}
                      className="owner-schedule-btn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Live Featured Listing
                    </Link>
                  )}
                </div>
              </div>
            ) : pendingSub ? (
              <div className="hh-plus-pending-dashboard">
                <div className="hh-plus-pending-banner">
                  <span className="hh-pending-clock">⏳</span>
                  <div>
                    <h3>Payment Pending Confirmation</h3>
                    <p>
                      You submitted an order for <strong>{pendingSub.planName}</strong> (${pendingSub.price} USD)
                      with Reference <code>{pendingSub.paymentReference}</code>.
                    </p>
                    <p style={{ marginTop: 6, fontSize: 13, color: '#6b6570' }}>
                      Once the platform administrator verifies your transfer, your Featured badge
                      and search boost will automatically become active.
                    </p>
                  </div>
                </div>

                <div className="hh-plus-pending-instructions">
                  <h4>Payment Transfer Instructions</h4>
                  <p>
                    Send <strong>${pendingSub.price}</strong> via {pendingSub.paymentMethod?.toUpperCase()}:
                  </p>
                  <ul className="hh-transfer-list">
                    <li><strong>Method:</strong> {pendingSub.paymentMethod}</li>
                    <li><strong>Reference to quote:</strong> {pendingSub.paymentReference}</li>
                    <li><strong>Zaad Merchant:</strong> 402288 or 063-4889900</li>
                    <li><strong>EDAHAB Merchant:</strong> 701122 or 065-4889900</li>
                  </ul>
                </div>

                <div className="hh-plus-actions-row">
                  <button
                    type="button"
                    className="customer-gold-btn"
                    onClick={() => openCheckout(plans.find((p) => p.id === pendingSub.plan) || plans[0])}
                  >
                    Update Payment Reference
                  </button>
                  <button
                    type="button"
                    className="owner-reject-btn"
                    onClick={handleCancelPending}
                    disabled={submitting}
                  >
                    Cancel Pending Order
                  </button>
                </div>
              </div>
            ) : (
              <div className="hh-plus-inactive-dashboard">
                <div className="hh-plus-inactive-callout">
                  <p>
                    You are currently using the <strong>Standard Free Tier</strong>. Your venue is
                    listed with regular placement and a 5-photo limit.
                  </p>
                  <p>
                    Choose a plan below to activate <strong>HallHub Plus ⭐</strong> and elevate
                    your venue to the top of customer search results.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Premium Benefits Grid */}
          <section className="customer-panel hh-plus-benefits-overview">
            <div className="customer-panel-head">
              <h2>HallHub Plus Benefits</h2>
            </div>
            <div className="hh-plus-feature-cards">
              <div className="hh-feature-card">
                <span className="hh-feature-icon">⭐</span>
                <h4>Featured Badge</h4>
                <p>
                  Display an eye-catching gold Featured partner badge on your hotel
                  and all your individual banquet hall listings.
                </p>
              </div>
              <div className="hh-feature-card">
                <span className="hh-feature-icon">🚀</span>
                <h4>Search Results Boost</h4>
                <p>
                  Appear at the very top of venue search results whenever a customer
                  searches for matching venues in Hargeisa.
                </p>
              </div>
              <div className="hh-feature-card">
                <span className="hh-feature-icon">🏠</span>
                <h4>Homepage Spotlight</h4>
                <p>
                  Get featured in the exclusive &ldquo;Featured Venues&rdquo; section
                  directly under the main homepage hero.
                </p>
              </div>
              <div className="hh-feature-card">
                <span className="hh-feature-icon">📸</span>
                <h4>Up to 15 Hall Photos</h4>
                <p>
                  Upload triple the gallery photos (up to 15 high-res photos per hall)
                  to showcase decor, stages, and seating styles.
                </p>
              </div>
              <div className="hh-feature-card">
                <span className="hh-feature-icon">⭐</span>
                <h4>Promote All Halls</h4>
                <p>
                  Every hall registered under your hotel receives promotional priority
                  and the verified badge across the site.
                </p>
              </div>
              <div className="hh-feature-card">
                <span className="hh-feature-icon">📊</span>
                <h4>Premium Analytics</h4>
                <p>
                  Benefit from boosted customer inquiry conversion and dedicated
                  visibility metrics on your dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* Pricing Plans Section */}
          <section className="customer-panel hh-plus-pricing-section">
            <div className="customer-panel-head">
              <h2>Select a HallHub Plus Plan</h2>
              <span className="hh-pricing-currency">All prices in USD</span>
            </div>

            <div className="hh-pricing-grid">
              {plans.map((plan) => {
                const isCurrent = activeSub?.plan === plan.id && isPlusActive;

                return (
                  <div
                    key={plan.id}
                    className={`hh-pricing-card${
                      plan.id === 'quarterly' ? ' is-popular' : ''
                    }${isCurrent ? ' is-current-plan' : ''}`}
                  >
                    {plan.badge && (
                      <span className="hh-pricing-badge">{plan.badge}</span>
                    )}

                    <div className="hh-pricing-head">
                      <h3>{plan.name}</h3>
                      <p className="hh-pricing-desc">{plan.description}</p>
                      <div className="hh-pricing-price-wrap">
                        <span className="hh-price-symbol">$</span>
                        <strong className="hh-price-amount">{plan.price}</strong>
                        <span className="hh-price-period">
                          / {plan.durationDays} days
                        </span>
                      </div>
                    </div>

                    <ul className="hh-pricing-features">
                      {plan.features.map((feat, index) => (
                        <li key={index}>
                          <span className="hh-check">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={`hh-pricing-btn ${
                        plan.id === 'quarterly'
                          ? 'customer-gold-btn'
                          : 'owner-schedule-btn'
                      }`}
                      onClick={() => openCheckout(plan)}
                      disabled={!isHotelApproved}
                    >
                      {isCurrent ? 'Extend This Plan' : `Choose ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Checkout & Payment Confirmation Modal */}
      {showCheckoutModal && selectedPlan && (
        <div className="hh-modal-backdrop" onClick={closeCheckout}>
          <div
            className="hh-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="hh-modal-header">
              <div>
                <span className="hh-featured-pill">⭐ HallHub Plus Checkout</span>
                <h2>Subscribe to {selectedPlan.name}</h2>
              </div>
              <button
                type="button"
                className="hh-modal-close"
                onClick={closeCheckout}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubscribe} className="hh-modal-body">
              <div className="hh-modal-order-summary">
                <div className="hh-summary-row">
                  <span>Selected Plan:</span>
                  <strong>{selectedPlan.name}</strong>
                </div>
                <div className="hh-summary-row">
                  <span>Promotion Duration:</span>
                  <strong>{selectedPlan.durationDays} Days</strong>
                </div>
                <div className="hh-summary-row hh-summary-total">
                  <span>Total Due:</span>
                  <strong>${selectedPlan.price} USD</strong>
                </div>
              </div>

              <div className="hh-payment-method-selector">
                <label className="hh-form-label">Select Payment Method</label>
                <div className="hh-method-options">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`hh-method-card${
                        paymentMethod === method.id ? ' is-selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <strong>{method.name}</strong>
                        <span>{method.details}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="hh-instructions-box">
                <p>
                  <strong>How to complete payment:</strong> Transfer{' '}
                  <strong>${selectedPlan.price} USD</strong> using{' '}
                  {paymentMethod.toUpperCase()} to the recipient details above.
                  Then enter your transaction confirmation number or sender phone number below.
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: '#8c5932' }}>
                  ℹ️ Subscription status starts in &ldquo;Pending Confirmation&rdquo;
                  and activates immediately upon payment verification.
                </p>
              </div>

              <label className="hh-form-group">
                <span>Payment Reference / Transaction ID / Phone *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-998822 or Zaad 063-XXXXXXX"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </label>

              <label className="hh-form-group">
                <span>Payment Notes (Optional)</span>
                <textarea
                  rows="2"
                  placeholder="Any additional payment details (e.g. sender name)..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </label>

              <div className="hh-modal-actions">
                <button
                  type="button"
                  className="owner-reject-btn"
                  onClick={closeCheckout}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="customer-gold-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Order...' : 'Submit Payment for Confirmation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerPlus;
