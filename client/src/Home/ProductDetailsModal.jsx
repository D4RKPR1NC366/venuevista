import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export default function ProductDetailsModal({ open, onClose, product, onEdit }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  if (!product) return null;

  // Extract fields
  const { image, title, price, description, additionals } = product;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
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
      <DialogContent dividers style={{ background: '#f3f3f1', padding: 0 }}>
        {/* Images Carousel */}
        <div style={{ width: '100%', height: 400, background: '#fff', position: 'relative', overflow: 'hidden' }}>
          {((product.images && product.images.length > 0) || image) ? (
            <>
              <img 
                src={product.images ? product.images[currentImageIndex || 0] : image} 
                alt={title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block'
                }} 
              />
              
              {/* Dot Navigation */}
              {product.images && product.images.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 10,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '8px 16px',
                  borderRadius: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: 2
                }}>
                  {product.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: currentImageIndex === idx ? '#e6b800' : '#ccc',
                        cursor: 'pointer',
                        transition: 'background 0.3s'
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#888'
            }}>
              No Images Available
            </div>
          )}
        </div>
        {/* Title, Price, Description Row */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 1100, padding: '32px 32px 0 32px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 32 }}>
              {/* Title & Price */}
              <div style={{ flex: '1 1 260px', minWidth: 260, maxWidth: 340, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 32, marginBottom: 8, color: '#3d4636', letterSpacing: 1 }}>{title}</div>
                {price && <div style={{ color: '#888', fontWeight: 700, fontSize: 20, marginBottom: 24, letterSpacing: 1 }}>PHP {price}</div>}
              </div>
            </div>
            {/* Description contents without card */}
            {description && (
              <ul style={{ margin: '32px 0 0 0', paddingLeft: 18, fontSize: 17, color: '#222', width: '100%' }}>
                {description.split(/\n|\r|•|\d+\./).filter(Boolean).map((line, idx) => (
                  <li key={idx}>{line.trim()}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Additionals Section */}
        {additionals && Array.isArray(additionals) && additionals.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 1100, padding: '48px 32px 32px 32px', boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1, marginBottom: 16, color: '#222' }}>ADDITIONAL</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {additionals.map((add, idx) => (
                  <div key={idx} style={{ background: '#fff', borderRadius: 8, padding: 20, minWidth: 220, flex: '1 1 220px', boxShadow: '0 2px 8px #0001' }}>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{add.title || add.category || ''} {add.price ? <span style={{ color: '#888', fontWeight: 400, fontSize: 15 }}>PHP {add.price}</span> : null}</div>
                    {add.description && (
                      <div style={{ fontSize: 14, color: '#444', marginBottom: 8, whiteSpace: 'pre-line' }}>{add.description}</div>
                    )}
                    {add.items && Array.isArray(add.items) ? (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {add.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        {onEdit && (
          <Button onClick={onEdit} color="primary" style={{ fontWeight: 600 }}>Edit</Button>
        )}
        <Button onClick={onClose} color="secondary" style={{ color: '#b06fa7', fontWeight: 600 }}>CLOSE</Button>
      </DialogActions>
    </Dialog>
  );
}
