import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getDashboardPath, saveAuth } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';
import {
  getPendingBooking,
  submitPendingBookingIfAny,
} from '../../utils/pendingBooking';

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingBooking = Boolean(
    location.state?.pendingBooking || getPendingBooking()
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [hotelName, setHotelName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminAvailable, setAdminAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAdminAvailability = async () => {
      try {
        const { data } = await api.get('/api/auth/admin-available');
        if (!cancelled) {
          setAdminAvailable(Boolean(data.adminAvailable));
        }
      } catch {
        if (!cancelled) {
          setAdminAvailable(false);
        }
      }
    };

    loadAdminAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (pendingBooking) {
      setRole('customer');
      return;
    }
    if (!adminAvailable && role === 'admin') {
      setRole('customer');
    }
  }, [adminAvailable, pendingBooking, role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Full name, email, and password are required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (role === 'hotel_owner') {
      if (
        !hotelName.trim() ||
        !city.trim() ||
        !address.trim() ||
        !contactPhone.trim()
      ) {
        setError(
          'Hotel name, city, address, and contact phone are required for hotel owners.'
        );
        return;
      }
    }

    if (role === 'admin' && !adminAvailable) {
      setError('Admin registration is closed.');
      setRole('customer');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      };

      if (role === 'hotel_owner') {
        payload.hotelName = hotelName.trim();
        payload.city = city.trim();
        payload.address = address.trim();
        payload.contactPhone = contactPhone.trim();
        payload.description = description.trim();
      }

      const { data } = await api.post('/api/auth/register', payload);

      saveAuth(data.token, data.user);

      if (data.user?.role === 'admin') {
        setAdminAvailable(false);
      }

      if (data.awaitingApproval) {
        navigate('/owner/dashboard');
        return;
      }

      if (data.user?.role === 'customer') {
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
                'Account created. Please submit the booking again.'
              ),
            },
          });
          return;
        }
      }

      navigate(
        location.state?.from && data.user?.role === 'customer'
          ? location.state.from
          : getDashboardPath(data.user.role)
      );
    } catch (err) {
      const message = getApiError(err, 'Unable to create account right now');
      setError(message);

      if (
        String(message).toLowerCase().includes('admin registration is closed')
      ) {
        setAdminAvailable(false);
        setRole('customer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page">
      <section className="signup-shell">
        <aside className="signup-aside" aria-hidden="true">
          <div className="signup-aside-inner">
            <p className="signup-aside-kicker">HallHub</p>
            <h2>Find and list the best event halls in Hargeisa.</h2>
            <p>
              Create an account to book venues, schedule visits, or register
              your hotel for approval.
            </p>
            <ul>
              <li>Browse verified hotels and halls</li>
              <li>Request bookings in minutes</li>
              <li>Owners manage halls in one place</li>
            </ul>
          </div>
        </aside>

        <div className="signup-panel">
          <Link to="/" className="signup-home-link">
            ← Back to home
          </Link>

          <header className="signup-header">
            <img src="/images/logo.png" alt="HallHub" />
            <div>
              <p className="signup-brand">HallHub</p>
              <h1>Create account</h1>
            </div>
          </header>

          <p className="signup-subtitle">
            {pendingBooking
              ? 'Create a customer account to complete your booking request.'
              : adminAvailable
                ? 'Join as a customer, hotel owner, or create the one-time system admin account.'
                : 'Join as a customer to book halls, or as a hotel owner to list your venue.'}
          </p>

          {error && <p className="auth-error">{error}</p>}

          <form className="signup-form" onSubmit={handleSubmit}>
            {!pendingBooking && (
              <div
                className={`signup-role-toggle${adminAvailable ? ' has-admin' : ''}`}
                role="group"
                aria-label="Account type"
              >
                <button
                  type="button"
                  className={role === 'customer' ? 'is-active' : ''}
                  onClick={() => setRole('customer')}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={role === 'hotel_owner' ? 'is-active' : ''}
                  onClick={() => setRole('hotel_owner')}
                >
                  Hotel Owner
                </button>
                {adminAvailable && (
                  <button
                    type="button"
                    className={role === 'admin' ? 'is-active' : ''}
                    onClick={() => setRole('admin')}
                  >
                    Admin
                  </button>
                )}
              </div>
            )}

            {role === 'admin' && (
              <p className="signup-admin-note">
                This creates the system admin. After this account is registered,
                the Admin option will disappear permanently.
              </p>
            )}

            <div className="signup-grid">
              <label className="signup-full">
                Full Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </label>
            </div>

            {role === 'hotel_owner' && (
              <div className="signup-hotel-block">
                <div className="signup-hotel-head">
                  <p>Hotel details</p>
                  <span>Submitted for admin approval</span>
                </div>

                <div className="signup-grid">
                  <label className="signup-full">
                    Hotel Name
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(event) => setHotelName(event.target.value)}
                      placeholder="e.g. Moole Hotel"
                    />
                  </label>

                  <label>
                    City
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Hargeisa"
                    />
                  </label>

                  <label>
                    Contact Phone
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                      placeholder="+252 63 ..."
                    />
                  </label>

                  <label className="signup-full">
                    Address
                    <input
                      type="text"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street / area"
                    />
                  </label>

                  <label className="signup-full">
                    Description
                    <textarea
                      rows="3"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Briefly describe your hotel and event spaces"
                    />
                  </label>
                </div>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="auth-toggle">
            Already have an account?{' '}
            <Link
              to="/login"
              state={
                pendingBooking
                  ? { from: location.state?.from, pendingBooking: true }
                  : undefined
              }
            >
              Log In
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Signup;
   