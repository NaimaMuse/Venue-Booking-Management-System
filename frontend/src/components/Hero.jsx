import React from 'react';
import { Link } from 'react-router-dom';

import Navbar from './Navbar';

const mosaicCards = [
  {
    image: '/banner01.png',
    alt: 'Luxury banquet dining hall',
    title: 'Grand Banquet Hall',
    text: 'Spacious seating and elegant décor for large wedding celebrations.',
  },
  {
    image: '/banner02.png',
    alt: 'Venue entrance archway',
    title: 'Elegant Entrances',
    text: 'Welcome your guests with a beautiful and memorable first impression.',
  },
  {
    image: '/banner.png',
    alt: 'Event hall interior',
    title: 'Approved Luxury Halls',
    text: 'Browse verified halls with clear capacity and transparent pricing.',
  },
  {
    image: '/banner03.png',
    alt: 'Decorated reception hall',
    title: 'Inspect Before You Book',
    text: 'Schedule an on-site visit to inspect the hall in person before confirming your event date.',
  },
];

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-overlay" />

      <div className="hero-top">
        <Navbar />
      </div>

      <div className="hero-inner">
        <div className="hero-content">
          <h1 className="hero-title">Hargeisa Hall Finder</h1>
          <p className="hero-subtitle">
            Search hotels, see every hall under them, and book with clear
            capacity and pricing — or schedule a visit before you confirm.
          </p>

          <div className="hero-actions">
            <Link to="/hotels" className="cta-btn">
              Explore Hotels &amp; Halls
            </Link>

            <Link to="/#services" className="cta-btn cta-btn-video">
              <span>Our Services</span>
              <span className="cta-video-icon" aria-hidden="true">
                ▶
              </span>
            </Link>
          </div>
        </div>

        <div className="hero-mosaic">
          {mosaicCards.map((card) => (
            <article key={card.title} className="mosaic-card">
              <img src={card.image} alt={card.alt} />
              <div className="mosaic-hover">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
