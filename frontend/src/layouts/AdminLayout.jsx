import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getFirstName,
  getInitials,
  getUser,
} from '../utils/auth';

const IconOverview = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconApprovals = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9 12.5L11 14.5L15.5 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconVenues = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 19V8.5L12 4L20 8.5V19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 19V13H15V19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconReports = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 19V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 19V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 19V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconRevenue = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 7V17M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5C13.4 7.5 14.5 8.3 14.5 9.4C14.5 10.6 13.3 11.2 12 11.2C10.7 11.2 9.5 11.8 9.5 13C9.5 14.2 10.6 15 12 15C13.4 15 14.5 14.1 14.5 13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconGrowth = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 16L9 11L13 14L20 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 7H20V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconWebsite = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4.5 12H19.5M12 4C14.2 6.3 15.3 9 15.3 12C15.3 15 14.2 17.7 12 20C9.8 17.7 8.7 15 8.7 12C8.7 9 9.8 6.3 12 4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
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

const mainNavItems = [
  { label: 'Overview', to: '/admin/dashboard', end: true, icon: <IconOverview /> },
  { label: 'Pending Approvals', to: '/admin/hotels', icon: <IconApprovals /> },
  { label: 'All Venues', to: '/admin/venues', icon: <IconVenues /> },
  { label: 'Operations Reports', to: '/admin/reports/operations', icon: <IconReports /> },
  { label: 'Revenue Reports', to: '/admin/reports/revenue', icon: <IconRevenue /> },
  { label: 'Performance Reports', to: '/admin/reports/performance', icon: <IconGrowth /> },
];

function AdminLayout() {
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

  const closeSidebar = () => setSidebarOpen(false);
  const firstName = getFirstName(user?.fullName);
  const initials = getInitials(user?.fullName);

  return (
    <div className={`customer-portal admin-portal${sidebarOpen ? ' sidebar-open' : ''}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="customer-sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      )}

      <aside className="customer-sidebar" aria-label="Admin sidebar">
        <div className="customer-sidebar-top">
          <div className="customer-sidebar-header">
            <Link to="/" className="customer-brand" onClick={closeSidebar}>
              <span className="customer-brand-mark">HH</span>
              <span className="customer-brand-text">HallHub Admin</span>
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

          <nav className="customer-sidebar-nav" aria-label="Admin navigation">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `customer-side-link${isActive ? ' is-active' : ''}`
                }
                onClick={closeSidebar}
              >
                <span className="customer-side-icon">{item.icon}</span>
                <span className="customer-side-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="customer-sidebar-bottom">
          <Link to="/" className="customer-side-link" onClick={closeSidebar}>
            <span className="customer-side-icon">
              <IconWebsite />
            </span>
            <span className="customer-side-label">Website</span>
          </Link>
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
          <div className="customer-topbar-inner">
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

            <div className="customer-topbar-title">
              <p>Super Admin</p>
              <strong>{firstName}</strong>
            </div>

            <div className="customer-user-chip">
              <span className="customer-avatar">{initials}</span>
              <span className="customer-profile-name">{firstName}</span>
            </div>
          </div>
        </header>

        <main className="customer-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
