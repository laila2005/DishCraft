import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://dishcraft-backend-3tk2.onrender.com'
      : 'http://localhost:5000';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', email: '', message: '' });
      } else {
        setError(data.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error('🔥 Contact form error:', err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-card">
        <h2>📬 Contact Us</h2>
        <p>Have questions, suggestions, or feedback? We'd love to hear from you!</p>

        {submitted ? (
          <div className="contact-success">
            ✅ Message sent successfully! We'll get back to you soon.
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              value={form.message}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            {error && <p className="contact-error">❌ {error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;

