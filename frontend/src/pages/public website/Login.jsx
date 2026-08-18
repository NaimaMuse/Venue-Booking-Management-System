import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getDashboardPath, saveAuth } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';
import { submitPendingBookingIfAny } from '../../utils/pendingBooking';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      saveAuth(data.token, data.user);

      if (data.user.role === 'customer') {
        try {
          const submitted = await submitPendingBookingIfAny(api);
          if (submitted) {
            navigate('/customer/my-bookings', {
              state: { toast: 'Booking request submitted successfully.' },
            });
            return;
          }
        } catch (bookingErr) {
          navigate(location.state?.from || '/customer/my-bookings', {
            state: {
              toast: getApiError(
                bookingErr,
                'Signed in. Please submit the booking again.'
              ),
            },
          });
          return;
        }
      }

      const redirectTo =
        location.state?.from && data.user.role === 'customer'
          ? location.state.from
          : getDashboardPath(data.user.role);

      navigate(redirectTo);
    } catch (err) {
      setError(getApiError(err, 'Unable to login right now'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-wrap">
        <div className="auth-card">
          <div className="auth-brand">
            <img src="/images/logo.png" alt="HallHub" />
            <div>
              <p className="auth-brand-name">HallHub</p>
              <h1>Welcome Back</h1>
            </div>
          </div>

          <p className="auth-subtitle">
            Sign in to manage bookings, schedule visits, or access your dashboard.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-toggle">
            Don&apos;t have an account?{' '}
            <Link to="/signup" state={location.state}>
              Sign Up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
