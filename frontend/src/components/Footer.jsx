import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h3>HallHub</h3>
          <p>
            Discover hotels and banquet halls in Hargeisa, compare capacity and
            pricing, and schedule hall visits before you book.
          </p>
          <div className="footer-socials">
            <a href="/" aria-label="Facebook">
              Fb
            </a>
            <a href="/" aria-label="Twitter">
              X
            </a>
            <a href="/" aria-label="Instagram">
              Ig
            </a>
            <a href="/" aria-label="LinkedIn">
              In
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Event Services</h4>
          <ul>
            <li>
              <Link to="/#venues">Weddings &amp; Receptions</Link>
            </li>
            <li>
              <Link to="/#venues">Corporate Events</Link>
            </li>
            <li>
              <Link to="/#services">Our Services</Link>
            </li>
            <li>
              <Link to="/#about">About Us</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Support &amp; Information</h4>
          <ul>
            <li>
              <Link to="/hotels">Browse Hotels &amp; Halls</Link>
            </li>
            <li>
              <Link to="/#contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/#contact">Booking Help</Link>
            </li>
            <li>
              <Link to="/login">Sign In</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact Us</h4>
          <ul className="footer-contact-list">
            <li>
              <span className="footer-icon" aria-hidden="true">
                ☎
              </span>
              <span>+252 63 456 7890</span>
            </li>
            <li>
              <span className="footer-icon" aria-hidden="true">
                ✉
              </span>
              <span>info@hargeisahallfinder.com</span>
            </li>
            <li>
              <span className="footer-icon" aria-hidden="true">
                ⌂
              </span>
              <span>Hargeisa, Somaliland</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
