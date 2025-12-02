import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import TopBar from './TopBar';
import './EventCart.css';

const API_BASE = '/api';

const EventCart = () => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let userEmail = null;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      userEmail = user && user.email;
    } catch {}
    if (!userEmail) {
      setCart([]);
      return;
    }
    fetch(`${API_BASE}/cart?userEmail=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => setCart(Array.isArray(data) ? data : []))
      .catch(() => setCart([]));
  }, []);

  const handleDelete = async (idxToDelete) => {
    const item = cart[idxToDelete];
    if (!item || !item._id) return;
    let userEmail = null;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      userEmail = user && user.email;
    } catch {}
    if (!userEmail) return;
    try {
      await fetch(`${API_BASE}/cart/${item._id}?userEmail=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
      setCart(cart.filter((_, idx) => idx !== idxToDelete));
    } catch {}
  };

  return (
    <>
      <TopBar />
      <div className="event-cart-root">
        <h2 className="event-cart-title">Event Cart</h2>
        <div className="event-cart-main">
          {/* Left: Cart Items */}
          <div className="event-cart-items">
            {cart.length === 0 ? (
              <p>Your selected events and services will appear here.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="event-cart-item" style={{ 
                  opacity: item.product?.available === false ? 0.6 : 1,
                  border: item.product?.available === false ? '2px solid #ff4444' : undefined
                }}>
                  {item.product && item.product.image && (
                    <img src={item.product.image} alt={item.product.title} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="event-cart-item-title">
                      {item.product ? item.product.title : ''}
                      {item.product?.available === false && (
                        <span style={{ 
                          color: '#ff4444', 
                          fontWeight: 700, 
                          marginLeft: 8,
                          fontSize: '0.85em'
                        }}>
                          (UNAVAILABLE)
                        </span>
                      )}
                    </div>
                    {item.product && item.product.price && <div className="event-cart-item-price">PHP {item.product.price}</div>}
                    {/* Show additionals if any */}
                    {Array.isArray(item.additionals) && item.additionals.length > 0 && (
                      <div style={{ marginTop: 8, marginLeft: 8 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: '#888' }}>Additionals:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {item.additionals.map((add, aidx) => (
                            <li key={add._id || add.title || aidx} style={{ fontSize: 14, color: '#555' }}>
                              {add.title} {add.price ? <span style={{ color: '#888' }}>- PHP {add.price}</span> : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <IconButton aria-label="delete" onClick={() => handleDelete(idx)} style={{ color: 'red' }}>
                    <DeleteIcon />
                  </IconButton>
                </div>
              ))
            )}
          </div>
          {/* Right: Summary */}
          <div className="event-cart-summary">
            <div className="event-cart-summary-title">Summary</div>
            <div className="event-cart-summary-list">
              {cart.length === 0 ? (
                <div className="event-cart-summary-row" style={{ color: '#888' }}>
                  <span>No items in cart.</span>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div className="event-cart-summary-row">
                      <span>{item.product ? item.product.title : ''}</span>
                      <span style={{ fontWeight: 600 }}>PHP {item.product && item.product.price ? item.product.price : 0}</span>
                    </div>
                    {/* Additionals in summary */}
                    {Array.isArray(item.additionals) && item.additionals.length > 0 && item.additionals.map((add, aidx) => (
                      <div key={add._id || add.title || aidx} className="event-cart-summary-row" style={{ paddingLeft: 18, fontSize: 14, color: '#555' }}>
                        <span>+ {add.title}</span>
                        <span>PHP {add.price ? add.price : 0}</span>
                      </div>
                    ))}
                  </React.Fragment>
                ))
              )}
            </div>
            <div className="event-cart-summary-total">
              <span>Total</span>
              <span>PHP {cart.reduce((sum, item) => {
                let base = parseFloat(item.product && item.product.price) || 0;
                let adds = Array.isArray(item.additionals) ? item.additionals.reduce((a, add) => a + (parseFloat(add.price) || 0), 0) : 0;
                return sum + base + adds;
              }, 0)}</span>
            </div>
            <button
              className="event-cart-book-btn"
              disabled={cart.length === 0 || cart.some(item => item.product?.available === false)}
              onClick={() => {
                // Check for unavailable items before proceeding
                const unavailableItems = cart.filter(item => item.product?.available === false);
                if (unavailableItems.length > 0) {
                  alert('Please remove unavailable items from your cart before booking.');
                  return;
                }
                localStorage.setItem('gd_booking_selected_products', JSON.stringify(cart.map(item => item.product)));
                window.location.href = '/booking';
              }}
              style={{
                opacity: cart.some(item => item.product?.available === false) ? 0.5 : 1,
                cursor: cart.some(item => item.product?.available === false) ? 'not-allowed' : 'pointer'
              }}
            >
              Book Now
            </button>
            {cart.some(item => item.product?.available === false) && (
              <div style={{ 
                marginTop: 12, 
                padding: 12, 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: 4,
                fontSize: 14,
                color: '#856404'
              }}>
                ⚠️ Some items in your cart are unavailable. Please remove them before booking.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EventCart;
