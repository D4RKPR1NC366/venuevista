

import React, { useEffect, useState } from "react";
import "./topbar.css";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link } from 'react-router-dom';


const API_BASE = '/api';

const TopBar = () => {
  const [expanded, setExpanded] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY === 0) {
            setExpanded(true);
          } else if (window.scrollY > 10) {
            setExpanded(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // set initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Fetch cart count for the logged-in user
    let intervalId;
    async function updateCartCount() {
      let userEmail = null;
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        userEmail = user && user.email;
      } catch {}
      if (!userEmail) {
        setCartCount(0);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/cart?userEmail=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        setCartCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setCartCount(0);
      }
    }
    updateCartCount();
    intervalId = setInterval(updateCartCount, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Get user from localStorage (outside of useEffect)
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {}
  // Only show name for customer role
  const isCustomer = user && user.firstName && user.lastName && (!user.role || user.role === 'customer' || user.role === 'user');
  const isAdmin = user && user.role === 'admin';

  return (
    <header className={`topbar${expanded ? " topbar-expanded" : ""}`}>
      <div className="topbar-logo">GOLDUST CREATIONS</div>

      <nav className="topbar-center" style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <a href="/" className="topbar-link">Home</a>
        <a href="/?scroll=services" className="topbar-link">Services</a>
        <a href="/gallery" className="topbar-link">Gallery</a>
        <a href="/booking" className="topbar-link">Book Now</a>
        <a href="/policy" className="topbar-link">Policy</a>
        <a href="/reviews" className="topbar-link">Reviews</a>
      </nav>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href="/event-cart" className="topbar-link" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <ShoppingCartIcon style={{ fontSize: 22, color: '#ff133aff' }} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -10,
              right: -6,
              color: 'white',
              background: 'transparent',
              fontSize: 18,
              fontWeight: 500,
              zIndex: 1,
              padding: 0,
              boxShadow: 'none',
            }}>{cartCount}</span>
          )}
        </a>
        {isAdmin ? (
          <Link to="/admin/dashboard" className="topbar-link" style={{ cursor: 'pointer' }}>Admin Dashboard</Link>
        ) : isCustomer ? (
          <Link to="/client/profile" className="topbar-link" style={{ cursor: 'pointer' }}>{user.firstName} {user.lastName}</Link>
        ) : (
          <Link to="/signup" className="topbar-link">Sign up</Link>
        )}
      </div>
    </header>
  );
}

export default TopBar;
