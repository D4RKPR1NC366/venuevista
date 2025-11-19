

import React, { useEffect, useState, useRef } from "react";
import TopBar from "./TopBar";
import "./home.css";
import "../Authentication/auth.css";
import { useNavigate } from "react-router-dom";
import api from '../services/api';




const Home = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [eventType, setEventType] = useState('all');
  const [bgImages, setBgImages] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0); // no longer used for scrolling
  const [userReviews, setUserReviews] = useState([]);
  const reviewsContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch reviews from backend
    api.get('/reviews')
      .then(res => setUserReviews(res.data))
      .catch(() => setUserReviews([]));
  }, []);

  // Filter categories by event type
  useEffect(() => {
    if (eventType === 'all') {
      setFilteredCategories(categories);
    } else {
      setFilteredCategories(categories.filter(cat => {
        // Assume each category has an 'events' array property listing applicable event types
        return Array.isArray(cat.events) && cat.events.includes(eventType);
      }));
    }
  }, [categories, eventType]);

  const allReviews = userReviews;

  useEffect(() => {
    // Fetch categories from API
    api.get('/categories')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));

    // Scroll to services if ?scroll=services is in the URL
    if (window.location.search.includes('scroll=services')) {
      setTimeout(() => {
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    // Fetch background images from backend
    api.get('/background-images')
      .then(res => {
        const imgs = res.data;
        setBgImages(Array.isArray(imgs) ? imgs.map(img => img.url) : []);
        setBgIndex(0);
      })
      .catch(() => {
        setBgImages([]);
        setBgIndex(0);
      });
  }, []);

  // Slideshow effect
  React.useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setBgIndex(idx => (idx + 1) % bgImages.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [bgImages]);

  const bgImage = bgImages.length > 0 ? bgImages[bgIndex] : null;

  return (
    <div className="home-root">
      <TopBar />
      <section
        className="home-hero"
        style={bgImage ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.7s ease',
          minHeight: '90vh',
        } : { minHeight: '100vh' }}
      >
        <div className="home-hero-overlay" style={{ background: 'rgba(0,0,0,0.12)' }}>
          <h1 className="home-hero-title">ONE STOP SHOP</h1>
        </div>
        {bgImages.length > 1 && (
          <div className="home-hero-dots">
            {bgImages.map((_, idx) => (
              <button
                key={idx}
                className={`home-hero-dot${bgIndex === idx ? ' active' : ''}`}
                onClick={() => setBgIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>
      <section className="home-services" id="services">
        <h2 className="home-services-title">SERVICES</h2>
        <div className="home-services-filter-row" style={{ marginBottom: '1rem' }}>
          <label htmlFor="eventType" style={{ marginRight: '0.5rem' }}>Filter by Event:</label>
          <select
            id="eventType"
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', background: '#fff', color: '#222', border: '1px solid #ccc' }}
          >
            <option value="all">All Events</option>
            <option value="debut">Debut</option>
            <option value="wedding">Wedding</option>
            <option value="seminar">Seminar</option>
            <option value="birthday">Birthday</option>
            <option value="corporate">Corporate</option>
            <option value="anniversary">Anniversary</option>
            <option value="reunion">Reunion</option>
            <option value="baptism">Baptism</option>
          </select>
        </div>
        <div className="home-services-grid">
          {filteredCategories.length === 0 && <div>No services for this event.</div>}
          {Array.from({ length: Math.ceil(filteredCategories.length / 3) }).map((_, rowIdx) => (
            <div className="home-services-row" key={rowIdx}>
              {filteredCategories.slice(rowIdx * 3, rowIdx * 3 + 3).map((cat, idx) => (
                <div
                  key={cat.title + (rowIdx * 3 + idx)}
                  className="home-service-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/pns-details', { state: { category: cat } })}
                >
                  {cat.image ? (
                    <div className="home-service-img-wrapper">
                      <img src={cat.image} alt={cat.title} className="home-service-img" />
                      <div className="home-service-title-overlay">
                        {cat.title}
                      </div>
                    </div>
                  ) : (
                    <div className="home-service-img-wrapper">
                      <span className="home-service-title-overlay">{cat.title}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      {/* Review Section */}
      <section className="home-reviews-section">
        <div className="home-reviews-header-row">
          <h2 className="home-reviews-title">Customer Reviews</h2>
          <button className="home-reviews-see-more" onClick={() => navigate('/reviews')}>See more</button>
        </div>
        <div className="home-reviews-carousel-wrapper">
          <button
            className="home-reviews-arrow left"
            onClick={() => {
              if (reviewsContainerRef.current) {
                reviewsContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
              }
            }}
            aria-label="Scroll left"
          >&#8592;</button>
          <div className="home-reviews-carousel" ref={reviewsContainerRef} style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
            {allReviews.map((review, idx) => (
              <div className="home-review-card" key={idx}>
                <div className="home-review-header">
                  <span className="home-review-name">{review.name}</span>
                  <span className="home-review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <div className="home-review-date-source">
                  <span className="home-review-date">{review.date}</span>
                  <span className="home-review-source">Review from {review.source}</span>
                </div>
                <span className="home-review-comment" title={review.comment}>{review.comment}</span>
              </div>
            ))}
          </div>
          <button
            className="home-reviews-arrow right"
            onClick={() => {
              if (reviewsContainerRef.current) {
                reviewsContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
              }
            }}
            aria-label="Scroll right"
          >&#8594;</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
