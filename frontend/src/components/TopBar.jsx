import React from 'react';


const socialLinks = ['Fb', 'Ig', 'In'];
<div className="top-bar-left">

    <div className="social-links">
  {socialLinks.map((label) => (
    <a href="/" key={label}>
      {label}
    </a>
  ))}
</div>
  <span>+252 63 456 7890</span>
  <span>info@sabrabanquet.com</span>
</div>

function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span>+252 63 456 7890</span>
        <span>info@sabrabanquet.com</span>
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