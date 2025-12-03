
import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ProductDetailsModal from './ProductDetailsModal';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import { API_BASE_URL } from '../utils/apiConfig';


const API_BASE = API_BASE_URL;

const CART_LOCAL_KEY = 'gd_event_cart';

export default function PnSDetails() {
  // Add to cart handler
  // Additionals modal state
  const [additionalsOpen, setAdditionalsOpen] = useState(false);
  const [additionalsList, setAdditionalsList] = useState([]); // fetched additionals
  const [selectedAdditionals, setSelectedAdditionals] = useState([]);
  const [pendingProduct, setPendingProduct] = useState(null);

  // Open additionals modal when user clicks add to cart
  async function handleAddToCart(product) {
    // Check if product is available
    if (product.available === false) {
      alert('This product/service is currently unavailable and cannot be added to cart.');
      return;
    }
    setPendingProduct(product);
    // Fetch additionals for this product (simulate or from API)
    // For demo, assume product.additionals or fetch from API
    let additionals = [];
    if (product && product._id) {
      try {
        const res = await fetch(`${API_BASE}/products/${product._id}/additionals`);
        if (res.ok) {
          additionals = await res.json();
        }
      } catch {}
    }
    // fallback: check if product.additionals exists
    if (!additionals.length && Array.isArray(product.additionals)) {
      additionals = product.additionals;
    }
    setAdditionalsList(additionals);
    setSelectedAdditionals([]);
    setAdditionalsOpen(true);
  }

  // Actually add to cart with additionals
  async function confirmAddToCart() {
    let userEmail = null;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      userEmail = user && user.email;
    } catch {}
    if (!userEmail) {
      alert('You must be logged in to add to cart.');
      setAdditionalsOpen(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/cart?userEmail=${encodeURIComponent(userEmail)}`);
      const cart = await res.json();
      const exists = Array.isArray(cart) && cart.some(item => item.product && item.product.title === pendingProduct.title);
      if (exists) {
        alert('This product is already in your cart.');
        setAdditionalsOpen(false);
        return;
      }
      // Remove additionals from product if present, send as top-level field
      const { additionals, ...productWithoutAdditionals } = pendingProduct || {};
      await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productWithoutAdditionals, userEmail, additionals: selectedAdditionals })
      });
      // Optionally show a success message
    } catch (err) {
      // Optionally show an error message
    }
    setAdditionalsOpen(false);
  }

  function handleAdditionalToggle(additional) {
    setSelectedAdditionals(prev => {
      if (prev.some(a => a._id ? a._id === additional._id : a.title === additional.title)) {
        return prev.filter(a => (a._id ? a._id !== additional._id : a.title !== additional.title));
      } else {
        return [...prev, additional];
      }
    });
  }
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Try to get category from location.state or from query param
    let cat = '';
    let categoryProducts = [];
    if (location.state && location.state.category) {
      cat = location.state.category.title || '';
      // Use the filtered products passed from Home.jsx (already filtered by branch)
      categoryProducts = location.state.category.products || [];
      setCategoryTitle(cat);
      setProducts(Array.isArray(categoryProducts) ? categoryProducts : []);
    } else {
      // fallback: try to get from URL (e.g. /pns-details?category=we)
      const params = new URLSearchParams(window.location.search);
      cat = params.get('category') || '';
      setCategoryTitle(cat);
      if (cat) {
        // Fetch products for this category from API (no branch filter applied)
        fetch(`${API_BASE}/products/${encodeURIComponent(cat)}`)
          .then(res => res.json())
          .then(data => setProducts(Array.isArray(data) ? data : []))
          .catch(() => setProducts([]));
      } else {
        setProducts([]);
      }
    }
  }, [location]);

  return (
    <>
      <TopBar />
      <div style={{ padding: 40, maxWidth: 1400, margin: '120px auto 40px', width: '100%' }}>
        {categoryTitle && (
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 32, marginBottom: 32 }}>
            {categoryTitle}
          </h2>
        )}
        {products.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', fontSize: 18 }}>No products/services available.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32, justifyItems: 'center' }}>
            {products.map((prod, idx) => (
              <div
                key={idx}
                className="pns-card"
                style={{
                  border: 'none',
                  borderRadius: 8,
                  padding: 0,
                  width: '100%',
                  maxWidth: 380,
                  background: '#fff',
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  overflow: 'hidden',
                }}
                onClick={() => { setSelectedProduct(prod); setModalOpen(true); }}
              >
      <style>{`
        .pns-card:hover {
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
          transform: translateY(-8px);
        }
      `}</style>
                <div style={{ position: 'relative' }}>
                  {(prod.images?.[0] || prod.image) ? (
                    <img src={prod.images?.[0] || prod.image} alt={prod.title} style={{
                      display: 'block',
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 0,
                      margin: 0,
                      filter: prod.available === false ? 'grayscale(50%) brightness(0.7)' : 'none'
                    }} />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: 220,
                      background: '#eee',
                      borderRadius: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888'
                    }}>No Image</div>
                  )}
                  {prod.available === false && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: 2,
                      textTransform: 'uppercase'
                    }}>
                      Unavailable
                    </div>
                  )}
                </div>
                  <div style={{ padding: 24, paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, textAlign: 'left', width: '100%' }}>{prod.title}</div>
                        {prod.price && (
                          <div style={{ textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 15, marginBottom: 8, width: '100%' }}>
                            PHP {prod.price}
                          </div>
                        )}
                        {/* Branch availability indicator */}
                        {prod.branches && prod.branches.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {prod.branches.map((branch, branchIdx) => (
                              <span 
                                key={branchIdx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 10px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: '#fff',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  borderRadius: 12,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                                }}
                              >
                                <span style={{ marginRight: 4 }}>📍</span>
                                {branch.replace(', ', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <IconButton
                        aria-label="add to cart"
                        onClick={e => { e.stopPropagation(); handleAddToCart(prod); }}
                        style={{ marginLeft: '8px', color: 'orange' }}
                        disabled={prod.available === false}
                      >
                        <AddShoppingCartIcon style={{ color: prod.available === false ? '#ccc' : 'orange' }} />
                      </IconButton>
                    </div>
                </div>
              </div>
            ))}
            <ProductDetailsModal open={modalOpen} onClose={() => setModalOpen(false)} product={selectedProduct} />
            {/* Additionals Modal */}
            <Dialog 
              open={additionalsOpen} 
              onClose={() => setAdditionalsOpen(false)}
              scroll="paper"
              PaperProps={{
                sx: {
                  maxHeight: '90vh',
                  margin: '16px',
                  '@media (max-width: 768px)': {
                    margin: '8px',
                    maxHeight: '95vh',
                    width: 'calc(100vw - 16px)'
                  },
                  '@media (max-width: 900px) and (max-height: 600px) and (orientation: landscape)': {
                    margin: '4px',
                    maxHeight: '85vh',
                    width: 'calc(100vw - 8px)'
                  }
                }
              }}
            >
              <DialogTitle>Add Additionals?</DialogTitle>
              <DialogContent dividers>
                {additionalsList.length === 0 ? (
                  <div style={{ color: '#888', fontSize: 16 }}>No additionals available for this product.</div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 12 }}>Select any additionals you want to add:</div>
                    {additionalsList.map((add, idx) => (
                      <FormControlLabel
                        key={add._id || add.title || idx}
                        control={
                          <Checkbox
                            checked={selectedAdditionals.some(a => (a._id ? a._id === add._id : a.title === add.title))}
                            onChange={() => handleAdditionalToggle(add)}
                          />
                        }
                        label={<span>{add.title} {add.price ? `- PHP ${add.price}` : ''}</span>}
                      />
                    ))}
                  </div>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setAdditionalsOpen(false)} color="secondary">Cancel</Button>
                <Button onClick={confirmAddToCart} color="primary" variant="contained">Add to Cart</Button>
              </DialogActions>
            </Dialog>
          </div>
        )}
      </div>
    </>
  );
}
