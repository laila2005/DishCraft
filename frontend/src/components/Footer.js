import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logo from '../assets/logo.png';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      {/* Logo with fallback text in case image fails */}
      <div className="footer-logo">
        <img
          src={logo}
          alt="DishCraft Logo"
          style={{ height: '48px', verticalAlign: 'middle' }}
        />
      </div>

      {/* Links */}
      <div className="footer-links">
        <a href="/" className="footer-link">Home</a>
        <Link to="/about" className="footer-link">About</Link>
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
