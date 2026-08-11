import React, { useState } from 'react';

import Navbar from '../../components/Navbar';

function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="contact-page">
      <div className="venues-nav-wrap">
        <Navbar />
      </div>

      <section className="contact-banner">
        <div className="contact-banner-inner">
          <h1>Contact Us</h1>
          <p>
            Have a question about venues, visits, or bookings? Send us a message
            and our team will get back to you.
          </p>
        </div>
      </section>

      <section className="contact-content">
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

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send a Message</h2>

          {submitted ? (
            <p className="contact-success">
              Thank you. Your message has been received. We will contact you
              soon.
            </p>
          ) : (
            <>
              <div className="contact-form-row">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
              />

              <textarea
                name="message"
                rows="5"
                placeholder="How can we help you?"
                value={formData.message}
                onChange={handleChange}
                required
              />

              <button type="submit" className="contact-submit-btn">
                Send Message
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

export default Contact;
