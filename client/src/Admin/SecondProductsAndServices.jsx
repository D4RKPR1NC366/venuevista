
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function SecondProductsAndServices(props) {
  // If navigated via route, get category from location.state
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const category = location.state?.category || props.category;

  if (!category) {
    // If no category data, go back to products-services
    navigate('/admin/products-services');
    return null;
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <button onClick={() => navigate('/admin/products-services')} style={{ marginBottom: 24, background: '#e6b800', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Back</button>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px 0 rgba(60,60,60,0.10)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 300
      }}>
        <img
          src={category.image}
          alt={category.title}
          style={{ width: 120, height: 120, maxWidth: 120, maxHeight: 120, objectFit: 'contain', borderRadius: 8, marginBottom: 16, border: '1px solid #ccc', display: 'block', background: '#fff' }}
        />
        <h2 style={{ fontWeight: 700, fontSize: 28, margin: 0 }}>{category.title}</h2>
        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <button style={{ background: '#e6b800', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            Add Subcategory
          </button>
          <button style={{ background: '#fff', color: '#e6b800', border: '2px solid #e6b800', borderRadius: 6, padding: '12px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            Add Product/Services
          </button>
        </div>
      </div>
    </div>
  );
}
