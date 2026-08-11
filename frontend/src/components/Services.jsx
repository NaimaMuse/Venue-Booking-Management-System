import React from 'react';

const services = [
  {
    title: 'Browse Verified Halls',
    description: 'Explore approved halls with transparent pricing & capacities.',
    image: '/banner01.png',
  },
  {
    title: 'Schedule Hall Visit',
    description: 'Book an on-site physical inspection before paying.',
    image: '/banner02.png',
  },
  {
    title: 'Instant Booking Requests',
    description: 'Reserve your event date directly with hotel owners online.',
    image: '/banner03.png',
  },
  {
    title: 'Hotel Owner Portal',
    description: 'Register your hotel and list your halls to reach customers.',
    image: '/banner.png',
  },
];

function Services() {
  return (
    <section className="services-section" id="services">
      <div className="section-header">
        <span className="section-label">Platform Features</span>
        <h2>Our Services</h2>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <article key={service.title} className="service-card">
            <img src={service.image} alt={service.title} className="service-image" />
            <div className="service-body">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export default Services;
