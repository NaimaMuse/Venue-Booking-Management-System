import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getFirstName,
  getInitials,
  getUser,
} from '../utils/auth';
import api from '../utils/api';
import OwnerApprovalGate from '../components/OwnerApprovalGate';

const IconOverview = () => (
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
      d="M4 19V8.5L12 4L20 8.5V19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 19V13H15V19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconHalls = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 10H20V19H4V10Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M8 10V7H16V10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4 14H20" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconBookings = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3.5V7M16 3.5V7M4 10H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconReports = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 19V5M5 19H19M5 19L10 12L13.5 15.5L19 8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  { label: 'Overview', to: '/owner/dashboard', end: true, icon: <IconOverview /> },
  { label: 'My Hotel Profile', to: '/owner/hotel-profile', icon: <IconHotel /> },
  { label: 'Manage Halls', to: '/owner/halls', end: true, icon: <IconHalls /> },
  { label: 'Booking Requests', to: '/owner/bookings', icon: <IconBookings />, badgeKey: 'pending' },
  { label: 'Hotel Report', to: '/owner/reports', icon: <IconReports /> },
];

function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

    const loadSidebarData = async () => {
      try {
        const bookingsResult = await api
          .get('/api/bookings/owner-requests')
          .catch((err) => err);

        if (!active) {
          return;
        }

        if (!(bookingsResult instanceof Error || bookingsResult.isAxiosError)) {
          const bookings = bookingsResult.data?.bookings || [];
          setPendingCount(bookings.filter((b) => b.status === 'pending').length);
        }
      } catch (err) {
        // Sidebar can still render without booking meta.
      }
    };

    loadSidebarData();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);
  const firstName = getFirstName(user?.fullName);
  const initials = getInitials(user?.fullName);

  return (
    <OwnerApprovalGate>
      <div className={`customer-portal owner-portal${sidebarOpen ? ' sidebar-open' : ''}`}>
        {sidebarOpen && (
          <button
            type="button"
            className="customer-sidebar-backdrop"
            aria-label="Close menu"
            onClick={closeSidebar}
          />
        )}

        <aside className="customer-sidebar" aria-label="Owner sidebar">
          <div className="customer-sidebar-top">
            <div className="customer-sidebar-header owner-sidebar-header">
              <Link
                to="/owner/dashboard"
                className="owner-brand"
                onClick={closeSidebar}
                title="Hargeisa Hall Finder"
              >
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

            <nav className="customer-sidebar-nav" aria-label="Owner navigation">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => {
                    const hallsActive =
                      item.to === '/owner/halls' &&
                      location.pathname.startsWith('/owner/halls');
                    return `customer-side-link${isActive || hallsActive ? ' is-active' : ''}`;
                  }}
                  onClick={closeSidebar}
                >
                  <span className="customer-side-icon">{item.icon}</span>
                  <span className="customer-side-label">{item.label}</span>
                  {item.badgeKey === 'pending' && pendingCount > 0 && (
                    <span className="owner-nav-badge">{pendingCount}</span>
                  )}
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

              <div className="customer-topbar-title owner-topbar-welcome">
                <strong>Welcome back, {firstName}</strong>
              </div>

              <div className="customer-user-chip owner-user-chip">
                <span className="customer-avatar">{initials}</span>
                <span className="owner-user-meta">
                  <span className="customer-profile-name">{firstName}</span>
                  <span className="owner-user-role">Hotel Owner</span>
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
