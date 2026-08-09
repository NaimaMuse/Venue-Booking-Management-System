import React from 'react';

function AboutUs() {
  return (
    <section className="about-section">
      <div className="about-inner">
        <div className="about-gallery">
          <img
            src="/about01.png"
            alt="Decorated banquet hall"
            className="about-gallery-img about-gallery-top"
          />

          <img
            src="/about03.png"
            alt="Round banquet table setup"
            className="about-gallery-img about-gallery-side"
          />

          <img
            src="/about02.png"
            alt="Stage seating with floral décor"
            className="about-gallery-img about-gallery-bottom"
          />
        </div>
      </div>
    </section>
  );
}

export default AboutUs;