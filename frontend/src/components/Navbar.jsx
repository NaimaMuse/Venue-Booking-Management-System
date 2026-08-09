import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'Hotels & Halls', href: '/hotels' },
  { label: 'Services', href: '/#services' },
  { label: 'About Us', href: '/#about' },
  { label: 'Contact Us', href: '/#contact' },
];

function Navbar() {
    
  return (
    <nav>
      <Link to="/#home" className="brand-pill">
        Hargeisa Hall Finder
      </Link>

      <div className="nav-links">
        {navLinks.map((link) => (
          <Link key={link.label} to={link.href} className="nav-link">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;