import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Reusable Navbar Component
 * Preserves the original styling, logo, navigation links, and adds dynamic glass scroll effect.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollTo = (id) => (e) => {
    if (location.pathname === '/' || location.pathname === '/landing') {
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav id="nav" className={scrolled ? 'scrolled' : ''}>
      <Link to="/landing" className="nav-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="nav-hex">G</div>
        <span>Gameunity</span>
      </Link>

      <div className="nav-links">
        <a className="nav-link" href="#features" onClick={handleScrollTo('features')}>
          Features
        </a>
        <a className="nav-link" href="#how" onClick={handleScrollTo('how')}>
          How It Works
        </a>
        <Link className="nav-link" to="/discovery">
          Discover
        </Link>
        <Link className="nav-link" to="/pricing">
          Pricing
        </Link>
      </div>

      <div className="nav-r">
        <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>
          Sign in
        </Link>
        <Link to="/login" className="btn-cta" style={{ textDecoration: 'none' }}>
          Start free &#8594;
        </Link>
      </div>
    </nav>
  );
}
