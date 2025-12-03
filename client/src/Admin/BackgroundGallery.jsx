

import React, { useRef, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './backgroundgallery.css';
import { API_BASE_URL, getImageUrl } from '../utils/apiConfig';

const API_URL = `${API_BASE_URL}/background-images`;

const BackgroundGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch images from DB
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  // Add images to DB
  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve({
          url: ev.target.result,
          name: file.name
        });
        reader.readAsDataURL(file);
      });
    });
    const newImages = await Promise.all(readers);
    setLoading(true);
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: newImages })
    })
      .then(res => res.json())
      .then(added => setImages(prev => [...prev, ...added]))
      .finally(() => setLoading(false));
  };

  // Delete image from DB
  const handleDelete = async (id) => {
    setLoading(true);
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    setImages(prev => prev.filter(img => img._id !== id));
    setLoading(false);
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-dashboard-main">
        <div className="background-gallery">
          <h2>Background Gallery</h2>
          <button
            className="bg-gallery-add-btn"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ marginBottom: 20, background: '#d4af37', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
          >
            Add Pictures
          </button>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAddImages}
          />
          <div className="bg-gallery-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {loading && <p style={{ color: '#888' }}>Loading...</p>}
            {!loading && images.length === 0 && <p style={{ color: '#888' }}>No images added yet.</p>}
            {images.map((img) => (
              <div key={img._id} className="bg-gallery-img-card" style={{ position: 'relative', width: 180, height: 120, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={getImageUrl(img.url)} alt={img.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => handleDelete(img._id)}
                  style={{ position: 'absolute', top: 6, right: 6, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BackgroundGallery;
