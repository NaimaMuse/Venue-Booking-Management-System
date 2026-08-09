import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
  const isActive = link.hash
    ? location.pathname === '/' &&
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
    </nav>
  );
}

export default Navbar;