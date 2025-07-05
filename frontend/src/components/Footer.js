import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      {/* Logo with fallback text in case image fails */}
      <div className="footer-logo">
        <img
          src={require('../assets/logo.png')}
          alt="DishCraft Logo"
          style={{ height: '40px', verticalAlign: 'middle' }}
        />
      </div>

      {/* Links */}
      <div className="footer-links">
        <a href="/" className="footer-link">Home</a>
        <a href="/about" className="footer-link">About</a>
        <a href="/contact" className="footer-link">Contact</a>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} DishCraft. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
