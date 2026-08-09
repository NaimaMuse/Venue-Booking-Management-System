import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getDashboardPath,
  getUser,
} from '../utils/auth';

const navLinks = [
  { label: 'Home', href: '/#home', hash: 'home' },
  { label: 'Hotels & Halls', href: '/hotels', hash: null },
  { label: 'Services', href: '/#services', hash: 'services' },
  { label: 'About Us', href: '/#about', hash: 'about' },
  { label: 'Contact Us', href: '/#contact', hash: 'contact' },
];

function Navbar() {
    const location = useLocation();
const navigate = useNavigate();
const [user, setUser] = useState(() => getUser());

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
  setUser(null);
  navigate('/login');
};

const handleSectionClick = (event, link) => {
  if (!link.hash) {
    return;
  }

  if (location.pathname !== '/') {
    return;
  }

  event.preventDefault();

  navigate(link.href, { replace: false });

  const element = document.getElementById(link.hash);

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } else if (link.hash === 'home') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
};
    
  return (
    <nav>
      <Link to="/#home" className="brand-pill">
        Hargeisa Hall Finder
      </Link>

      <div className="nav-links">
        {navLinks.map((link) => {
  const isActive = link.hash ? location.pathname === '/' &&
      (location.hash === `#${link.hash}` ||
        (link.hash === 'home' &&
          (!location.hash || location.hash === '#home')))
    : location.pathname === link.href ||
      location.pathname.startsWith(`${link.href}/`);

  return (
    <Link
      key={link.label}
      to={link.href}
      className={`nav-link${isActive ? ' active' : ''}`}
      onClick={(event) => handleSectionClick(event, link)}
    >
      {link.label}
    </Link>
  );
})}
   
      </div>
      {user ? (
  <div className="nav-auth-box">
    <Link
      to={getDashboardPath(user.role)}
      className="nav-profile-btn"
      aria-label="Open dashboard"
      title="Open dashboard"
    >
      Profile
    </Link>

    <button
      type="button"
      className="nav-logout-btn"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
) : location.pathname === '/login' ||
  location.pathname === '/signup' ? null : (
  <Link to="/login" className="nav-contact-btn">
    Sign In / Register
  </Link>
)}
    </nav>
  );
}

export default Navbar;