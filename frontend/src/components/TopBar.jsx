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
    </div>
  );
}

export default TopBar;