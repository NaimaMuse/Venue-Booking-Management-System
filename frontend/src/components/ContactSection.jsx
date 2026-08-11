import React, { useState } from 'react';

function ContactSection() {
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
    <section className="contact-section home-contact-section" id="contact">
      <div className="section-header">
        <span className="section-label">Get In Touch</span>
        <h2>Contact Us</h2>
      </div>

      <div className="contact-content home-contact-content">
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
                placeholder="How can we help?"
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
      </div>
    </section>
  );
}

export default ContactSection;
