
import React, { useEffect, useState } from "react";
import TopBar from "./TopBar";
import "./home.css";

const API_BASE = "/api";

const Gallery = () => {
  const [images, setImages] = useState([]);
  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const res = await fetch(`${API_BASE}/gallery`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      setImages([]);
    }
  }

  return (
    <>
      <TopBar />
      <div className="gallery-page" style={{ padding: '16px', minHeight: '80vh', marginTop: '120px', maxWidth: '1300px', marginLeft: 'auto', marginRight: 'auto' }}>
        <p className="review-title-script" style={{ textAlign: 'center', marginBottom: '32px', color: '#000000ff', letterSpacing: 2 }}>
          Goldust Gallery
        </p>
        <p className="review-title-script" style={{ textAlign: 'center', marginBottom: '32px', fontSize: '1.5rem', color: '#fff', textShadow: '1px 1px 8px #222' }}>
          Everything you need for your event, all in one place.
        </p>
        <div className="gallery-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center' }}>
          {images.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>No images yet.</div>
          ) : (
            images.map(img => (
              <img key={img._id || img.url} src={img.url} alt={img.name || "Gallery"} style={{ width: '380px', height: '260px', borderRadius: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', objectFit: 'cover' }} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Gallery;
