import React from 'react';

function ContactSection() {
  return (
    <section className="contact-section">
      <h2>Get In Touch</h2>
      <h1>Contact Us</h1>
      <div className="contact-info">
  <article className="contact-info-card">
    <h3>Email</h3>
    <p>info@hargeisahallfinder.com</p>
  </article>

  <article className="contact-info-card">
    <h3>Phone</h3>
    <p>+252 63 456 7890</p>
  </article>

  <article className="contact-info-card">
    <h3>Location</h3>
    <p>Hargeisa, Somaliland</p>
  </article>
</div>
    </section>
  );
}

export default ContactSection;