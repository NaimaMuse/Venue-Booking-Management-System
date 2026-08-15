import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getAvatarUrl,
  getFirstName,
  getInitials,
  getUser,
} from '../utils/auth';

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconHotels = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 19.5V6.8C4 5.8 4.8 5 5.8 5H14.2C15.2 5 16 5.8 16 6.8V19.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M16 10H19.2C20.2 10 21 10.8 21 11.8V19.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 19.5H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconVenues = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconReports = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 19V11M12 19V5M19 19V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', end: true, icon: <IconDashboard /> },
  { label: 'Hotel Approvals', to: '/admin/hotels', icon: <IconHotels /> },
  { label: 'All Venues', to: '/admin/venues', icon: <IconVenues /> },
  { label: 'Operations', to: '/admin/reports/operations', icon: <IconReports /> },
  { label: 'Revenue', to: '/admin/reports/revenue', icon: <IconReports /> },
  { label: 'Performance', to: '/admin/reports/performance', icon: <IconReports /> },
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
    navigate('/login');
  };

  const firstName = getFirstName(user?.fullName);
  const avatarUrl = getAvatarUrl(user?.avatarUrl);
  const initials = getInitials(user?.fullName);

  return (
    <div className={`customer-portal admin-portal${sidebarOpen ? ' sidebar-open' : ''}`}>
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
              <span className="customer-brand-mark">AD</span>
              <span className="customer-brand-text">Admin Portal</span>
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

          <nav className="customer-sidebar-nav" aria-label="Admin">
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
          <div className="customer-topbar-inner">
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
              <p>Admin portal</p>
              <strong>Welcome, {firstName}</strong>
            </div>
            <div className="customer-user-chip">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="customer-avatar-img" />
              ) : (
                <span className="customer-avatar">{initials}</span>
              )}
              <span className="customer-profile-name">{user?.fullName || 'Admin'}</span>
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
