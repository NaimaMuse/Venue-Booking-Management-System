import React, { useState } from 'react';

import Navbar from '../components/Navbar';

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
    <>
      <section className="contact-banner">
        <div className="contact-banner-inner">
          <h1>Contact Us</h1>
          <p>
            Have a question about venues, visits, or bookings? Send us a
            message and our team will get back to you.
          </p>
        </div>
      </section>

      <section className="contact-content"></section>