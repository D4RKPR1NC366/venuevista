

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
  const promosContainerRef = useRef(null);
  const [activePromos, setActivePromos] = useState([]);
  const navigate = useNavigate();
  // Fetch active promos
  useEffect(() => {
    api.get('/promos')
      .then(res => {
        const now = new Date();
        const promos = Array.isArray(res.data) ? res.data.filter(promo => {
          const start = promo.validFrom ? new Date(promo.validFrom) : null;
          const end = promo.validUntil ? new Date(promo.validUntil) : null;
          return start && end && now >= start && now <= end;
        }) : [];
        setActivePromos(promos);
      })
      .catch(() => setActivePromos([]));
  }, []);

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

  // Calculate review summary
  const totalReviews = allReviews.length;
  const avgRating = totalReviews > 0 ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews) : 0;

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
          <h2 className="home-hero-title" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '3rem', color: '#fff', textAlign: 'center', margin: 0 }}>
            One Stop Shop
          </h2>
          <p className="home-hero-title" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.2rem', color: '#fff', textAlign: 'center', margin: 0 }}>
             Everything you need for your event, all in one place.
          </p>
        
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
      {/* Active Promos Section - moved above Services */}
      <section className="home-promos-section" style={{ marginTop: '3.5rem', marginBottom: '2rem' }}>
        <div className="home-promos-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="home-promos-title" style={{ fontSize: '3rem', fontWeight: 500, textAlign: 'center', margin: 0 }}>Promos</h2>
        </div>
        <div className="home-promos-carousel-wrapper" style={{ position: 'relative', margin: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {activePromos.length * 260 > window.innerWidth && (
            <button
              className="home-promos-arrow left"
              style={{
                background: '#fff',
                color: '#e91e63',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                position: 'relative',
                marginRight: 12,
                boxShadow: 'none',
                cursor: 'pointer',
                zIndex: 2
              }}
              onClick={() => {
                if (promosContainerRef.current) {
                  promosContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                }
              }}
              aria-label="Scroll left"
            >&#8592;</button>
          )}
          <div className="home-promos-carousel" ref={promosContainerRef} style={{
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            display: 'flex',
            gap: '1.5rem',
            padding: '1rem 0',
            margin: '0 12px',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}>
            {activePromos.length === 0 && <div style={{ color: '#888' }}>No active promos.</div>}
            {activePromos.map((promo, idx) => (
              <div
                key={promo._id || idx}
                className="home-promo-card"
                style={{
                  minWidth: 320,
                  maxWidth: 320,
                  background: 'linear-gradient(135deg, #ffb3b3 0%, #ff69b4 100%)',
                  borderRadius: 16,
                  boxShadow: 'none',
                  padding: '2rem 1.5rem',
                  color: '#222',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  margin: '0 12px',
                  transition: 'transform 0.2s cubic-bezier(.4,2,.3,1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{promo.title}</div>
                <div style={{ fontWeight: 900, color: '#d32f2f', fontSize: '2.7rem', marginBottom: '0.7rem', letterSpacing: '-1px' }}>{promo.discountValue}% OFF</div>
                <div style={{ fontSize: '1.08rem', marginBottom: '0.7rem' }}>{promo.description}</div>
                <div style={{ fontSize: '1rem', color: '#555' }}>
                  {promo.validUntil ? `Until: ${promo.validUntil.slice(0, 10)}` : ''}
                </div>
              </div>
            ))}
          </div>
          {activePromos.length * 260 > window.innerWidth && (
            <button
              className="home-promos-arrow right"
              style={{
                background: '#fff',
                color: '#e91e63',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                position: 'relative',
                marginLeft: 12,
                boxShadow: 'none',
                cursor: 'pointer',
                zIndex: 2
              }}
              onClick={() => {
                if (promosContainerRef.current) {
                  promosContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                }
              }}
              aria-label="Scroll right"
            >&#8594;</button>
          )}
        </div>
      </section>

      <section className="home-services" id="services" style={{ background: '#ffffffff', padding: '2rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="home-services-title" style={{ color: 'black', fontSize: '3rem', fontWeight: 500, textAlign: 'center', margin: 0 }}>Products and Services</h2>
        </div>
        <div className="home-services-filter-row" style={{ marginBottom: '1rem' }}>
          <label htmlFor="eventType" style={{ marginRight: '0.5rem' }}>Filter by Event:</label>
          <select
            id="eventType"
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', background: '#fff', color: '#222', border: '1px solid #ccc' }}
          >
            <option value="all">All Events</option>
            <option value="anniversary">Anniversary</option>
            <option value="baptism">Baptism</option>
            <option value="birthday">Birthday</option>
            <option value="debut">Debut</option>
            <option value="corporate">Corporate</option>
            <option value="reunion">Reunion</option>
            <option value="seminar">Seminar</option>
            <option value="wedding">Wedding</option>
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
        <div className="home-reviews-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h2 className="home-reviews-title" style={{ fontSize: '3rem', fontWeight: 500, margin: 0, textAlign: 'center' }}>Customer Reviews</h2>
          <span style={{ fontSize: '1.1rem', color: '#d4af37', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', marginBottom: '6px' }}>
            {avgRating.toFixed(1)}
            <span style={{ color: '#d4af37', fontSize: '1.2em', marginLeft: '2px' }}>★</span>
            <span style={{ color: '#444', fontWeight: 500, fontSize: '1rem', marginLeft: '8px' }}>{totalReviews} reviews</span>
          </span>
          <button className="home-reviews-see-more" style={{ alignSelf: 'flex-end' }} onClick={() => navigate('/reviews')}>See more</button>
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
