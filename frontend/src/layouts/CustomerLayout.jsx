import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getAvatarUrl,
  getFirstName,
  getInitials,
  getUser,
} from '../utils/auth';
import api from '../utils/api';
import {
  getNewAppointmentCount,
  markAppointmentsSeen,
} from '../utils/appointmentAlerts';

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 10.5L12 4L20 10.5V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V10.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9.5 20V13H14.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconBrowse = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconBooking = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3.5V7M16 3.5V7M4 10H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconAppointment = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8V12.5L15 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconProfile = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M5 19.2C6.4 16.8 8.9 15.2 12 15.2C15.1 15.2 17.6 16.8 19 19.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M10 7V5.8C10 4.8 10.8 4 11.8 4H18.2C19.2 4 20 4.8 20 5.8V18.2C20 19.2 19.2 20 18.2 20H11.8C10.8 20 10 19.2 10 18.2V17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M4 12H14M4 12L7 9M4 12L7 15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 16L20.5 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const mainNavItems = [
  { label: 'Dashboard', to: '/customer/dashboard', end: true, icon: <IconDashboard /> },
  { label: 'Browse Halls', to: '/hotels', end: false, icon: <IconBrowse /> },
  { label: 'My Bookings', to: '/customer/my-bookings', icon: <IconBooking /> },
  {
    label: 'My Appointments',
    to: '/customer/my-appointments',
    icon: <IconAppointment />,
    badgeKey: 'appointments',
  },
  { label: 'Profile', to: '/customer/profile', icon: <IconProfile /> },
];

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [appointmentAlertCount, setAppointmentAlertCount] = useState(0);
  const appointmentBookingsRef = useRef([]);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    window.addEventListener('auth-changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('auth-changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAppointmentAlerts = async () => {
      try {
        const { data } = await api.get('/api/bookings/my-bookings');
        if (!active) {
          return;
        }

        const bookings = data.bookings || [];
        appointmentBookingsRef.current = bookings;

        if (location.pathname.startsWith('/customer/my-appointments')) {
          markAppointmentsSeen(bookings);
          setAppointmentAlertCount(0);
        } else {
          setAppointmentAlertCount(getNewAppointmentCount(bookings));
        }
      } catch (err) {
        // Keep sidebar usable without alert counts.
      }
    };

    loadAppointmentAlerts();

    const onAlertsChanged = () => {
      setAppointmentAlertCount(
        getNewAppointmentCount(appointmentBookingsRef.current)
      );
    };

    window.addEventListener('appointment-alerts-changed', onAlertsChanged);
    const timer = setInterval(loadAppointmentAlerts, 20000);

    return () => {
      active = false;
      window.removeEventListener('appointment-alerts-changed', onAlertsChanged);
      clearInterval(timer);
    };
  }, [location.pathname]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleAppointmentsClick = () => {
    markAppointmentsSeen(appointmentBookingsRef.current);
    setAppointmentAlertCount(0);
    closeSidebar();
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/hotels?q=${encodeURIComponent(query)}` : '/hotels');
    setSidebarOpen(false);
  };
  const firstName = getFirstName(user?.fullName);
  const fullName = user?.fullName || firstName;
  const initials = getInitials(user?.fullName);
  const avatarSrc = getAvatarUrl(user?.avatarUrl);

  return (
    <div className={`customer-portal customer-portal-v2${sidebarOpen ? ' sidebar-open' : ''}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="customer-sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      )}

      <aside className="customer-sidebar" aria-label="Customer sidebar">
        <div className="customer-sidebar-top">
          <div className="customer-sidebar-header">
            <Link to="/" className="owner-brand" onClick={closeSidebar}>
              <span className="owner-brand-mark">HHF</span>
              <span className="owner-brand-text">
                <span>Hargeisa Hall</span>
                <span>Finder</span>
              </span>
            </Link>
            <button
              type="button"
              className="customer-sidebar-close"
              aria-label="Close sidebar"
              onClick={closeSidebar}
            >
              ×
            </button>
          </div>

          <nav className="customer-sidebar-nav" aria-label="Main navigation">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `customer-side-link${isActive ? ' is-active' : ''}`
                }
                onClick={
                  item.badgeKey === 'appointments'
                    ? handleAppointmentsClick
                    : closeSidebar
                }
              >
                <span className="customer-side-icon">{item.icon}</span>
                <span className="customer-side-label">{item.label}</span>
                {item.badgeKey === 'appointments' &&
                  appointmentAlertCount > 0 && (
                    <span className="owner-nav-badge">
                      {appointmentAlertCount}
                    </span>
                  )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="customer-sidebar-bottom">
          <div className="customer-sidebar-promo">
            <p>Find your perfect event hall</p>
            <Link to="/hotels" className="customer-sidebar-promo-btn" onClick={closeSidebar}>
              Explore Halls
            </Link>
          </div>
          <button
            type="button"
            className="customer-side-link customer-logout-link"
            onClick={handleLogout}
          >
            <span className="customer-side-icon">
              <IconLogout />
            </span>
            <span className="customer-side-label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="customer-shell">
        <header className="customer-topbar">
          <div className="customer-topbar-inner customer-topbar-inner-v2">
            <button
              type="button"
              className="customer-menu-toggle"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>

            <form className="customer-top-search" onSubmit={handleSearch}>
              <span className="customer-top-search-icon" aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search halls, hotels or locations..."
              />
            </form>

            <div className="customer-top-location" aria-label="Location">
              Hargeisa
            </div>

            <Link
              to="/customer/profile"
              className="customer-user-chip customer-user-chip-v2"
              title="Open profile"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={fullName}
                  className="customer-avatar-img"
                />
              ) : (
                <span className="customer-avatar">{initials}</span>
              )}
              <span className="owner-user-meta">
                <span className="customer-profile-name">{fullName}</span>
                <span className="owner-user-role">Customer</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="customer-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CustomerLayout;
