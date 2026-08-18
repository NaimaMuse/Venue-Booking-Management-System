import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getAvatarUrl,
  getFirstName,
  getInitials,
  getUser,
} from '../utils/auth';

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 10.5L12 4L20 10.5V20H14.5V14H9.5V20H4V10.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3.5V7M16 3.5V7M4 10H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconVisit = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 21s-6.5-5.2-6.5-10A6.5 6.5 0 0 1 12 4.5a6.5 6.5 0 0 1 6.5 6.5c0 4.8-6.5 10-6.5 10Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M5.5 19.5c1.4-3.2 3.7-4.8 6.5-4.8s5.1 1.6 6.5 4.8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const navItems = [
  { label: 'Overview', to: '/customer/dashboard', end: true, icon: <IconHome /> },
  { label: 'My Bookings', to: '/customer/my-bookings', icon: <IconCalendar /> },
  { label: 'Appointments', to: '/customer/my-appointments', icon: <IconVisit /> },
  { label: 'Profile', to: '/customer/profile', icon: <IconUser /> },
];

function CustomerLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    window.addEventListener('auth-changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('auth-changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const firstName = getFirstName(user?.fullName);
  const avatarUrl = getAvatarUrl(user?.avatarUrl);
  const initials = getInitials(user?.fullName);

  return (
    <div className={`customer-portal customer-portal-v2${sidebarOpen ? ' sidebar-open' : ''}`}>
      <button
        type="button"
        className="customer-sidebar-backdrop"
        aria-label="Close menu"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="customer-sidebar">
        <div className="customer-sidebar-top">
          <div className="customer-sidebar-header">
            <Link to="/" className="customer-brand customer-brand-full">
              <span className="customer-brand-mark">HH</span>
              <span className="customer-brand-text">HallHub</span>
            </Link>
            <button
              type="button"
              className="customer-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav className="customer-sidebar-nav" aria-label="Customer">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `customer-side-link${isActive ? ' is-active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className="customer-side-icon">{item.icon}</span>
                <span className="customer-side-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="customer-sidebar-bottom">
          <div className="customer-sidebar-promo">
            <p>Find a hall for your next event.</p>
            <Link to="/hotels" className="customer-sidebar-promo-btn">
              Browse halls
            </Link>
          </div>
          <button
            type="button"
            className="customer-side-link customer-logout-link"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="customer-shell">
        <header className="customer-topbar">
          <div className="customer-topbar-inner customer-topbar-inner-v2">
            <button
              type="button"
              className="customer-menu-toggle"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="customer-topbar-title">
              <p>Customer portal</p>
              <strong>Welcome, {firstName}</strong>
            </div>
            <Link to="/customer/profile" className="customer-user-chip">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="customer-avatar-img" />
              ) : (
                <span className="customer-avatar">{initials}</span>
              )}
              <span className="customer-profile-name">{user?.fullName || 'Customer'}</span>
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
