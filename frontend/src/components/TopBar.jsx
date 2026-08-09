import React from 'react';

const socialLinks = ['Fb', 'Ig', 'In'];

function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="social-icons">
          {socialLinks.map((label) => (
            <a key={label} href="/" className="social-icon" aria-label={label}>
              {label}
            </a>
          ))}
        </div>
        <span className="top-contact">+252 63 456 7890</span>
        <span className="top-contact">info@sabrabanquet.com</span>
      </div>

      <div className="top-bar-right">
        <select className="location-select" defaultValue="Hargeisa">
          <option value="Hargeisa">Hargeisa</option>
          <option value="Berbera">Berbera</option>
          <option value="Borama">Borama</option>
        </select>

        <div className="auth-links">
          <a href="/">Log In</a>
          <span>|</span>
          <a href="/">Sign Up</a>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
