import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import OwnerApprovalGate from '../components/OwnerApprovalGate';
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

const IconHotel = () => (
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

const IconHall = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconBooking = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3.5V6.5M16 3.5V6.5M4.5 10H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconReports = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 19V11M12 19V5M19 19V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const navItems = [
  { label: 'Dashboard', to: '/owner/dashboard', end: true, icon: <IconDashboard /> },
  { label: 'Hotel Profile', to: '/owner/hotel-profile', icon: <IconHotel /> },
  { label: 'Halls', to: '/owner/halls', icon: <IconHall /> },
  { label: 'Bookings', to: '/owner/bookings', icon: <IconBooking /> },
  { label: 'Reports', to: '/owner/reports', icon: <IconReports /> },
];

function OwnerLayout() {
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
    <OwnerApprovalGate>
      <div className={`customer-portal owner-portal${sidebarOpen ? ' sidebar-open' : ''}`}>
        <button
          type="button"
          className="customer-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />

        <aside className="customer-sidebar">
          <div className="customer-sidebar-top">
            <div className="customer-sidebar-header owner-sidebar-header">
              <Link to="/" className="owner-brand">
                <span className="owner-brand-mark">HH</span>
                <span className="owner-brand-text">
                  <span>Owner</span>
                  <span>Portal</span>
                </span>
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

            <nav className="customer-sidebar-nav" aria-label="Owner">
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
              <div className="customer-topbar-title owner-topbar-welcome">
                <p>Hotel owner</p>
                <strong>Hello, {firstName}</strong>
              </div>
              <div className="customer-user-chip owner-user-chip">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="customer-avatar-img" />
                ) : (
                  <span className="customer-avatar">{initials}</span>
                )}
                <span className="owner-user-meta">
                  <span className="customer-profile-name">{user?.fullName || 'Owner'}</span>
                  <span className="owner-user-role">Hotel owner</span>
                </span>
              </div>
            </div>
          </header>

          <main className="customer-main">
            <Outlet />
          </main>
        </div>
      </div>
    </OwnerApprovalGate>
  );
}

export default OwnerLayout;
