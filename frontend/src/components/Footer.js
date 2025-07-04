import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <img src={require('../assets/logo.png')} alt="DishCraft Logo" className="footer-logo" />
      <span>© {new Date().getFullYear()} DishCraft. All rights reserved.</span>
      <span className="footer-links">
        <a href="/" className="footer-link">Home</a>
        <a href="/about" className="footer-link">About</a>
        <a href="/contact" className="footer-link">Contact</a>
      </span>
    </div>
  </footer>
);

export default Footer;
