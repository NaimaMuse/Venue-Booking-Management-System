import React from 'react';

function AboutUs() {
  return (
    <section className="about-section" id="about">
      <div className="about-bg" aria-hidden="true" />

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

        <div className="about-content">
          <span className="about-label">About Us</span>
          <h2>We Want To Give You The Best Services</h2>
          <p className="about-copy">
            HallHub helps customers discover approved banquet halls,
            compare capacity and pricing, and schedule venue visits before
            confirming an event date — while hotel owners list and manage their
            venues with confidence.
          </p>

          <div className="about-features">
            <article className="about-feature">
              <img
                src="/about-icon01.png"
                alt=""
                className="about-feature-icon"
              />
              <div>
                <h3>Guaranteed Results</h3>
                <p>
                  Every venue is admin-verified so you only browse approved
                  halls with clear details.
                </p>
              </div>
            </article>

            <article className="about-feature">
              <img
                src="/about-icon02.png"
                alt=""
                className="about-feature-icon"
              />
              <div>
                <h3>Quality Services</h3>
                <p>
                  Inspect halls in person, request bookings online, and plan
                  events with transparent pricing.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutUs;
