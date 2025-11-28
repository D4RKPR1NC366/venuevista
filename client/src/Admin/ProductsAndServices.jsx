import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './productsandservices.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SecondProductsAndServices from './SecondProductsAndServices';
import ProductDetailsModal from '../Home/ProductDetailsModal';
import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function ProductsAndServices() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState('');
  const [fields, setFields] = useState([{ label: '' }]);
  const [newEvents, setNewEvents] = useState([]);
  const [editEvents, setEditEvents] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editFields, setEditFields] = useState([{ label: '' }]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  // State for Add Product/Service modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [showAdditionals, setShowAdditionals] = useState(false);
  const [additionals, setAdditionals] = useState([{ title: '', price: '', description: '' }]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // State for products/services added in the selected category
  const PRODUCTS_LOCAL_KEY = 'gd_products_by_category';
  const [products, setProducts] = useState([]);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Edit modal state
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProductIdx, setEditProductIdx] = useState(null);
  const [editProductData, setEditProductData] = useState({ 
    images: [], 
    title: '', 
    price: '', 
    description: '', 
    additionals: [] 
  });


  // Fetch categories from API
  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(res => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Fetch products for selected category from API
  useEffect(() => {
    if (selectedCategory && selectedCategory.title) {
      fetch(`${API_BASE}/products/${encodeURIComponent(selectedCategory.title)}`)
        .then(res => res.json())
        .then(setProducts)
        .catch(() => setProducts([]));
    }
  }, [selectedCategory]);

  const openModal = () => {
    setShowModal(true);
  setNewTitle('');
  setNewImage('');
  setFields([{ label: '' }]);
  setNewEvents([]);
  setEditIdx(null);
  setEditTitle('');
  setEditImage('');
  setEditFields([{ label: '' }]);
  setEditEvents([]);
  };

  const closeModal = () => {
  setShowModal(false);
  setNewTitle('');
  setNewImage('');
  setFields([{ label: '' }]);
  setNewEvents([]);
  setEditIdx(null);
  setEditTitle('');
  setEditImage('');
  setEditFields([{ label: '' }]);
  setEditEvents([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a category title');
      return;
    }
    const newCat = { title: newTitle.trim(), image: newImage, fields: fields.map(f => ({ label: f.label })), events: newEvents };
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const saved = await res.json();
      setCategories([...categories, saved]);
      closeModal();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please check your connection and try again.');
    }
  };

  const handleEdit = (idx) => {
  setEditIdx(idx);
  setEditTitle(categories[idx].title);
  setEditImage(categories[idx].image || '');
  setEditFields(categories[idx].fields && categories[idx].fields.length > 0 ? categories[idx].fields : [{ label: '' }]);
  setEditEvents(categories[idx].events || []);
  setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const catToUpdate = categories[editIdx];
    try {
      const res = await fetch(`${API_BASE}/categories/${catToUpdate._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...catToUpdate, title: editTitle.trim(), image: editImage, fields: editFields.map(f => ({ label: f.label })), events: editEvents }),
      });
      const updatedCat = await res.json();
      setCategories(categories.map((cat, i) => i === editIdx ? updatedCat : cat));
    } catch {}
    closeModal();
  };

  // Handle image upload and preview
  const handleImageChange = (e, isEdit) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditImage(reader.result);
      } else {
        setNewImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // For adding/removing fields in add/edit mode
  const handleAddField = () => {
    if (editIdx !== null) {
      setEditFields([...editFields, { label: '' }]);
    } else {
      setFields([...fields, { label: '' }]);
    }
  };
  const handleFieldChange = (idx, value) => {
    if (editIdx !== null) {
      setEditFields(editFields.map((f, i) => i === idx ? { ...f, label: value } : f));
    } else {
      setFields(fields.map((f, i) => i === idx ? { ...f, label: value } : f));
    }
  };
  const handleRemoveField = (idx) => {
    if (editIdx !== null) {
      if (editFields.length === 1) return;
      setEditFields(editFields.filter((_, i) => i !== idx));
    } else {
      if (fields.length === 1) return;
      setFields(fields.filter((_, i) => i !== idx));
    }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Delete this category? All products/services in this category will also be deleted.')) return;
    const catToDelete = categories[idx];
    try {
      // Delete all products in this category
      await fetch(`${API_BASE}/products/category/${catToDelete.title}`, { method: 'DELETE' });
      // Delete the category itself
      await fetch(`${API_BASE}/categories/${catToDelete._id}`, { method: 'DELETE' });
      setCategories(categories.filter((_, i) => i !== idx));
    } catch {}
  };

  // Navigation logic for category cards
  const handleCategoryClick = (cat, idx) => {
    setSelectedCategory({ ...cat, idx });
  };

  // Handler to open edit modal with product data
  const handleEditProduct = () => {
    if (!selectedProduct) return;
    setEditProductData(selectedProduct);
    setEditProductIdx(products.findIndex(p => p === selectedProduct));
    setShowEditProductModal(true);
    setShowProductDetails(false);
  };

  // Handler to save edited product
  const handleSaveEditProduct = (e) => {
    e.preventDefault();
    if (!editProductData.title.trim() || !editProductData.description.trim() || !editProductData.price.trim()) return;
    const updatedProducts = products.map((p, i) => i === editProductIdx ? editProductData : p);
    setProducts(updatedProducts);
    // Save to localStorage if needed
    const PRODUCTS_LOCAL_KEY = 'gd_products_by_category';
    if (selectedCategory && selectedCategory.title) {
      const all = JSON.parse(localStorage.getItem(PRODUCTS_LOCAL_KEY) || '{}');
      all[selectedCategory.title] = updatedProducts;
      localStorage.setItem(PRODUCTS_LOCAL_KEY, JSON.stringify(all));
    }
    setShowEditProductModal(false);
  };

  return (
    <div className="admin-products-root">
      <Sidebar />
      <div className="admin-products-main">
        <style>{`
          @media (max-width: 768px) {
            .admin-products-root {
              flex-direction: column;
            }
            .admin-products-main {
              padding: 16px !important;
              margin-left: 0 !important;
            }
            .admin-products-title {
              font-size: 24px !important;
            }
            .admin-add-btn {
              min-width: 100px !important;
              font-size: 13px !important;
              height: 36px !important;
              padding: 0 10px !important;
            }
            .redesign-category-list {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
            .redesign-category-card {
              width: 100% !important;
              max-width: 100% !important;
              min-width: unset !important;
              margin: 0 0 16px 0 !important;
            }
            .admin-pns-card {
              width: 100% !important;
              max-width: 100% !important;
              min-width: unset !important;
            }
            .MuiDialog-paper {
              margin: 8px !important;
              max-width: calc(100% - 16px) !important;
              width: calc(100% - 16px) !important;
            }
          }
          @media (max-width: 480px) {
            .admin-products-title {
              font-size: 20px !important;
            }
            .admin-add-btn {
              min-width: 80px !important;
              font-size: 12px !important;
              height: 32px !important;
            }
          }
        `}</style>
        {!selectedCategory ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <h2 className="admin-products-title" style={{ margin: 0, fontWeight: 800, fontSize: 34, color: '#232323', letterSpacing: '-1px' }}>Products & Services</h2>
              <button
                className="admin-add-btn"
                style={{
                  background: '#e6b800',
                  color: '#fff',
                  border: '2px solid #e6b800',
                  borderRadius: 6,
                  height: 38,
                  minWidth: 140,
                  padding: '0 14px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onClick={openModal}
              >
                Add Category
              </button>
            </div>
            <div className="admin-category-list redesign-category-list" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 32,
              justifyContent: 'flex-start',
              width: '100%'
            }}>
              {categories.length === 0 && <div>No categories yet.</div>}
              {categories.map((cat, idx) => (
                <div
                  key={cat.title + idx}
                  className="redesign-category-card"
                  style={{
                    position: 'relative',
                    border: 'none',
                    borderRadius: 0,
                    padding: 0,
                    minWidth: 340,
                    maxWidth: 420,
                    width: 380,
                    background: '#fff',
                    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    overflow: 'hidden',
                    margin: '0 24px 24px 0',
                  }}
                  onClick={() => handleCategoryClick(cat, idx)}
                >
                  {/* Delete IconButton only, top right, like PnSDetails */}
                  <IconButton
                    aria-label="Delete"
                    size="small"
                    onClick={e => { e.stopPropagation(); handleDelete(idx); }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: '#fff',
                      zIndex: 2,
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                    }}
                  >
                    <DeleteIcon style={{ color: '#e53935', fontSize: 24 }} />
                  </IconButton>
                    {/* Edit and Delete IconButtons, top right, like PnSDetails */}
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'flex', gap: 4 }}>
                      <IconButton
                        aria-label="Edit"
                        size="small"
                        onClick={e => { e.stopPropagation(); handleEdit(idx); }}
                        style={{
                          background: '#fff',
                          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                          marginRight: 2,
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e6b800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                      </IconButton>
                      <IconButton
                        aria-label="Delete"
                        size="small"
                        onClick={e => { e.stopPropagation(); handleDelete(idx); }}
                        style={{
                          background: '#fff',
                          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                        }}
                      >
                        <DeleteIcon style={{ color: '#e53935', fontSize: 24 }} />
                      </IconButton>
                    </div>
                  {/* Image flush to top, left, right */}
                  {cat.image ? (
                    <img src={cat.image} alt={cat.title} style={{
                      display: 'block',
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 0,
                      margin: 0,
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
                  {/* Title */}
                  <div style={{ padding: 24, paddingTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 6, textAlign: 'left', width: '100%' }}>{cat.title}</div>
                    {cat.fields && cat.fields.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: '#888', fontWeight: 500, fontSize: 15 }}>
                        {cat.fields.map((f, i) => (
                          <li key={i}>{f.label}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Dialog 
              open={showModal} 
              onClose={closeModal} 
              maxWidth="xs" 
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
              <DialogTitle>{editIdx !== null ? 'Edit' : 'Add'} Category</DialogTitle>
              <form onSubmit={editIdx !== null ? handleUpdate : handleAdd}>
                <DialogContent dividers>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
                    {(editIdx !== null ? editImage : newImage) ? (
                      <img
                        src={editIdx !== null ? editImage : newImage}
                        alt="Category Preview"
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '1px solid #ccc' }}
                      />
                    ) : (
                      <div style={{ width: 120, height: 120, background: '#eee', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid #ccc' }}>
                        No Image
                      </div>
                    )}
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ mb: 1 }}
                    >
                      {editIdx !== null ? 'Edit Picture' : 'Upload Picture'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => handleImageChange(e, editIdx !== null)}
                      />
                    </Button>
                  </div>
                  <TextField
                    label="Category Title"
                    value={editIdx !== null ? editTitle : newTitle}
                    onChange={e => editIdx !== null ? setEditTitle(e.target.value) : setNewTitle(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                  />
                  {/* Event Type Radio Buttons */}
                  <div style={{ margin: '16px 0' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Event Types:</div>
                    {['debut', 'wedding', 'seminar', 'birthday', 'corporate', 'anniversary', 'reunion', 'baptism'].map(type => (
                      <label key={type} style={{ marginRight: 16 }}>
                         <input
                           type="checkbox"
                           value={type}
                           checked={editIdx !== null ? editEvents.includes(type) : newEvents.includes(type)}
                           onChange={e => {
                             if (editIdx !== null) {
                               setEditEvents(ev => e.target.checked ? [...ev, type] : ev.filter(t => t !== type));
                             } else {
                               setNewEvents(ev => e.target.checked ? [...ev, type] : ev.filter(t => t !== type));
                             }
                           }}
                           style={{ background: '#fff', border: '2px solid #222', borderRadius: '4px', width: '18px', height: '18px', marginRight: '4px', outline: 'none', cursor: 'pointer', position: 'relative' }}
                         /> {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    ))}
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button onClick={closeModal} color="secondary">Cancel</Button>
                  <Button type="submit" variant="contained">{editIdx !== null ? 'Update' : 'Add'}</Button>
                </DialogActions>
              </form>
            </Dialog>
          </>
        ) : (
          selectedCategory.idx === 0 || selectedCategory.idx > 0 ? (
            <div style={{ padding: '0px 48px 0 0px', maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h2 style={{ fontWeight: 900, fontSize: 35, margin: 0 }}>
                  {selectedCategory.title}
                </h2>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="admin-back-btn"
                    style={{
                      background: '#e53935',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      height: 38,
                      minWidth: 80,
                      padding: '0 14px',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                  >
                    Back
                  </button>
                <style>{`
                  .admin-back-btn:hover {
                    background: #b71c1c;
                  }
                `}</style>
                  <button
                    style={{
                      background: '#e6b800',
                      color: '#fff',
                      border: '2px solid #e6b800',
                      borderRadius: 6,
                      height: 38,
                      minWidth: 140,
                      padding: '0 14px',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => {
                      // Reset form when opening
                      setProductImages([]);
                      setCurrentImageIndex(0);
                      setProductTitle("");
                      setProductDescription("");
                      setProductPrice("");
                      setAdditionals([{ description: '', price: '' }]);
                      setShowAdditionals(false);
                      setShowProductModal(true);
                    }}
                  >
                    Add Product/Service
                  </button>
                </div>
              </div>
              {/* Product/Service Modal */}
              <Dialog 
                open={showProductModal} 
                onClose={() => {
                  // Reset form when closing via backdrop/escape
                  setProductImages([]);
                  setCurrentImageIndex(0);
                  setProductTitle("");
                  setProductDescription("");
                  setProductPrice("");
                  setAdditionals([{ description: '', price: '' }]);
                  setShowAdditionals(false);
                  setShowProductModal(false);
                }} 
                maxWidth="md" 
                fullWidth
                scroll="paper"
                PaperProps={{
                  sx: {
                    minWidth: '600px',
                    maxWidth: '900px',
                    margin: '16px',
                    maxHeight: '90vh',
                    '@media (max-width: 768px)': {
                      minWidth: 'unset',
                      margin: '8px',
                      maxHeight: '95vh',
                      width: 'calc(100vw - 16px)'
                    },
                    '@media (max-width: 900px) and (max-height: 600px) and (orientation: landscape)': {
                      minWidth: 'unset',
                      margin: '4px',
                      maxHeight: '85vh',
                      width: 'calc(100vw - 8px)'
                    }
                  }
                }}
              >
                <DialogTitle>Add Product/Service</DialogTitle>
                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!productTitle.trim() || !productDescription.trim() || !productPrice.trim()) return;
                  const newProduct = {
                    images: productImages,
                    title: productTitle,
                    description: productDescription,
                    price: productPrice,
                    additionals: showAdditionals ? additionals.filter(a => a.description && a.price) : [],
                    categoryTitle: selectedCategory.title,
                  };
                  try {
                    const res = await fetch(`${API_BASE}/products`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newProduct),
                    });
                    const saved = await res.json();
                    setProducts(prev => [...prev, saved]);
                  } catch {}
                  setShowProductModal(false);
                  setProductImages([]);
                  setCurrentImageIndex(0);
                  setProductImage("");
                  setProductTitle("");
                  setProductDescription("");
                  setProductPrice("");
                  setAdditionals([{ description: '', price: '' }]);
                  setShowAdditionals(false);
                }}>
                  <DialogContent>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
                      {productImages.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            <img
                              src={productImages[currentImageIndex]}
                              alt={`Preview ${currentImageIndex + 1}`}
                              style={{ 
                                width: 200, 
                                height: 200, 
                                objectFit: 'cover', 
                                borderRadius: 8, 
                                border: '1px solid #ccc' 
                              }}
                            />
                            {productImages.length > 1 && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentImageIndex((prev) => 
                                      prev === 0 ? productImages.length - 1 : prev - 1
                                    );
                                  }}
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(255,255,255,0.8)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 36,
                                    height: 36,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: -18
                                  }}
                                >
                                  ←
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentImageIndex((prev) => 
                                      prev === productImages.length - 1 ? 0 : prev + 1
                                    );
                                  }}
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(255,255,255,0.8)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 36,
                                    height: 36,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: -18
                                  }}
                                >
                                  →
                                </button>
                              </>
                            )}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            gap: 8, 
                            marginTop: 8, 
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                          }}>
                            {productImages.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                style={{
                                  width: 50,
                                  height: 50,
                                  border: currentImageIndex === idx ? '2px solid #e6b800' : '1px solid #ccc',
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  cursor: 'pointer'
                                }}
                              >
                                <img
                                  src={img}
                                  alt={`Thumbnail ${idx + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: 8, 
                            marginTop: 8 
                          }}>
                            {productImages.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setProductImages(prev => prev.filter((_, i) => i !== idx));
                                  if (currentImageIndex >= idx) {
                                    setCurrentImageIndex(prev => Math.max(0, prev - 1));
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: '#e53935',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer'
                                }}
                              >
                                Remove {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: 200, height: 200, background: '#eee', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid #ccc' }}>
                          No Images
                        </div>
                      )}
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ mb: 1 }}
                      >
                        Add Picture
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProductImages(prev => [...prev, reader.result]);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </Button>
                    </div>
                    <TextField
                      label="Product/Service Title"
                      value={productTitle}
                      onChange={e => setProductTitle(e.target.value)}
                      fullWidth
                      required
                      margin="normal"
                    />
                    <TextField
                      label="Price"
                      type="number"
                      value={productPrice}
                      onChange={e => setProductPrice(e.target.value)}
                      fullWidth
                      required
                      margin="normal"
                      inputProps={{ min: 0, step: 'any' }}
                    />
                    <TextField
                      label="Description"
                      value={productDescription}
                      onChange={e => setProductDescription(e.target.value)}
                      fullWidth
                      required
                      margin="normal"
                      multiline
                      minRows={3}
                    />
                    <Button
                      variant={showAdditionals ? "contained" : "outlined"}
                      color={showAdditionals ? "primary" : "secondary"}
                      onClick={e => { e.preventDefault(); setShowAdditionals(v => !v); }}
                      sx={{ mt: 2, mb: 1 }}
                    >
                      {showAdditionals ? "Remove Additionals" : "Add Additionals"}
                    </Button>
                    {showAdditionals && (
                      <div style={{ marginTop: 8, marginBottom: 8, overflowX: 'hidden', padding: '0 8px' }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Additionals</div>
                        {additionals.map((add, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, width: '100%' }}>
                            <TextField
                              label="Title"
                              value={add.title}
                              onChange={e => setAdditionals(additionals.map((a, i) => i === idx ? { ...a, title: e.target.value } : a))}
                            />
                            <TextField
                              label="Price"
                              type="number"
                              value={add.price}
                              onChange={e => setAdditionals(additionals.map((a, i) => i === idx ? { ...a, price: e.target.value } : a))}
                              inputProps={{ min: 0, step: 'any' }}
                            />
                            <TextField
                              label="Description"
                              value={add.description}
                              onChange={e => setAdditionals(additionals.map((a, i) => i === idx ? { ...a, description: e.target.value } : a))}
                              multiline
                              minRows={2}
                            />
                          </div>
                        ))}
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAdditionals([...additionals, { title: '', price: '', description: '' }])}>
                          Add Additional
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => {
                      // Reset form when canceling
                      setProductImages([]);
                      setCurrentImageIndex(0);
                      setProductTitle("");
                      setProductDescription("");
                      setProductPrice("");
                      setAdditionals([{ description: '', price: '' }]);
                      setShowAdditionals(false);
                      setShowProductModal(false);
                    }} color="secondary">Cancel</Button>
                    <Button type="submit" variant="contained">Add</Button>
                  </DialogActions>
                </form>
              </Dialog>
              {/* List of added products/services */}
              <div style={{ marginTop: 32 }}>
                {products.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center' }}>No products/services added yet.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }}>
                      {products.map((prod, idx) => (
                        <div
                          key={idx}
                          className="admin-pns-card"
                          style={{
                            position: 'relative',
                            border: 'none',
                            borderRadius: 0,
                            padding: 0,
                            minWidth: 340,
                            maxWidth: 420,
                            background: '#fff',
                            boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            setSelectedProduct(prod);
                            setShowProductDetails(true);
                          }}
                        >
                          <IconButton
                            aria-label="Delete"
                            size="small"
                            onClick={async e => { 
                              e.stopPropagation(); 
                              if (!window.confirm('Delete this product/service?')) return;
                              try {
                                await fetch(`${API_BASE}/products/${prod._id}`, { method: 'DELETE' });
                                setProducts(products.filter((_, i) => i !== idx));
                              } catch (error) {
                                console.error('Error deleting product:', error);
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: '#fff',
                              zIndex: 2,
                            }}
                          >
                            <DeleteIcon style={{ color: '#e53935' }} fontSize="small" />
                          </IconButton>
                          <div style={{ position: 'relative' }}>
                            {prod.images && prod.images.length > 0 ? (
                              <>
                                <img 
                                  src={prod.images[0]} 
                                  alt={prod.title} 
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    height: 220,
                                    objectFit: 'cover',
                                    borderRadius: 0,
                                    margin: 0,
                                  }} 
                                />
                                {prod.images.length > 1 && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    background: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: 12
                                  }}>
                                    +{prod.images.length - 1} more
                                  </div>
                                )}
                              </>
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
                          </div>
                          <div style={{ padding: 24, paddingTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, textAlign: 'left', width: '100%' }}>{prod.title}</div>
                            {prod.price && (
                              <div style={{ textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 15, marginBottom: 4, width: '100%' }}>
                                PHP {prod.price}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    <style>{`
                      .admin-pns-card:hover {
                        box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
                        transform: translateY(-8px);
                      }
                    `}</style>
                    </div>
                    <ProductDetailsModal
                      open={showProductDetails}
                      onClose={() => setShowProductDetails(false)}
                      product={selectedProduct}
                      onEdit={handleEditProduct}
                    />
                    {/* Edit Product Modal */}
                    <Dialog 
                        open={showEditProductModal} 
                        onClose={() => setShowEditProductModal(false)} 
                        maxWidth={false}
                        scroll="paper"
                        PaperProps={{
                          sx: {
                            width: '90vw',
                            maxWidth: '800px',
                            margin: '16px',
                            maxHeight: '90vh',
                            '@media (max-width: 768px)': {
                              width: 'calc(100vw - 16px)',
                              margin: '8px',
                              maxHeight: '95vh'
                            },
                            '@media (max-width: 900px) and (max-height: 600px) and (orientation: landscape)': {
                              width: 'calc(100vw - 8px)',
                              margin: '4px',
                              maxHeight: '85vh'
                            }
                          }
                        }}
                      >
                      <DialogTitle>Edit Product/Service</DialogTitle>
                      <form onSubmit={async e => {
                        e.preventDefault();
                        if (!editProductData.title.trim() || !editProductData.description.trim() || !editProductData.price.trim()) return;
                        
                        // Ensure we have the images array
                        const dataToSave = {
                          ...editProductData,
                          images: editProductData.images || [],
                        };
                        // If there's a legacy image field, convert it to images array
                        if (editProductData.image && !editProductData.images) {
                          dataToSave.images = [editProductData.image];
                          delete dataToSave.image;
                        }

                        try {
                          const res = await fetch(`${API_BASE}/products/${editProductData._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(dataToSave),
                          });
                          const updated = await res.json();
                          setProducts(products.map((p, i) => i === editProductIdx ? updated : p));
                        } catch (error) {
                          console.error('Error updating product:', error);
                        }
                        setShowEditProductModal(false);
                      }}>
                        <DialogContent 
                          dividers
                          sx={{ 
                            padding: '24px !important',
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': {
                              width: '8px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: '#888',
                              borderRadius: '4px'
                            }
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            marginBottom: 24,
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}>
                            {editProductData.images?.length > 0 ? (
                              <div style={{ width: '100%', marginBottom: 16, padding: '0 16px' }}>
                                <div style={{ 
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                  justifyContent: 'flex-start',
                                  alignItems: 'center',
                                  width: '100%',
                                  maxWidth: '100%',
                                  boxSizing: 'border-box'
                                }}>
                                  {editProductData.images.map((img, idx) => (
                                    <div 
                                      key={idx}
                                      style={{
                                        position: 'relative',
                                        width: 120,
                                        height: 120,
                                        overflow: 'hidden',
                                        backgroundColor: '#f5f5f5'
                                      }}
                                    >
                                      <img
                                        src={img}
                                        alt={`Preview ${idx + 1}`}
                                        style={{ 
                                          width: 'auto', 
                                          height: 'auto', 
                                          maxWidth: '100%',
                                          maxHeight: '100%',
                                          objectFit: 'contain', 
                                          borderRadius: 8,
                                          border: '1px solid #ccc',
                                          position: 'absolute',
                                          top: '50%',
                                          left: '50%',
                                          transform: 'translate(-50%, -50%)'
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          setEditProductData({
                                            ...editProductData,
                                            images: editProductData.images.filter((_, i) => i !== idx)
                                          });
                                        }}
                                        style={{
                                          position: 'absolute',
                                          top: -8,
                                          right: -8,
                                          width: 24,
                                          height: 24,
                                          borderRadius: '50%',
                                          background: '#e53935',
                                          color: 'white',
                                          border: 'none',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '18px',
                                          lineHeight: 1
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ width: 120, height: 120, background: '#eee', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid #ccc' }}>
                                No Images
                              </div>
                            )}
                            <Button
                              variant="outlined"
                              component="label"
                              sx={{ mb: 1 }}
                            >
                              Add Picture
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditProductData({ 
                                      ...editProductData, 
                                      images: [...(editProductData.images || []), reader.result]
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </Button>
                          </div>
                          <TextField
                            label="Product/Service Title"
                            value={editProductData.title}
                            onChange={e => setEditProductData({ ...editProductData, title: e.target.value })}
                            fullWidth
                            required
                            margin="normal"
                          />
                          <TextField
                            label="Price"
                            type="number"
                            value={editProductData.price}
                            onChange={e => setEditProductData({ ...editProductData, price: e.target.value })}
                            fullWidth
                            required
                            margin="normal"
                            inputProps={{ min: 0, step: 'any' }}
                          />
                          <TextField
                            label="Description"
                            value={editProductData.description}
                            onChange={e => setEditProductData({ ...editProductData, description: e.target.value })}
                            fullWidth
                            required
                            margin="normal"
                            multiline
                            minRows={3}
                          />
                          {/* Additionals Section */}
                          <div style={{ marginTop: 16, width: '100%' }}>
                            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '1.1rem' }}>Additionals</div>
                            {(editProductData.additionals || []).map((add, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
                                <TextField
                                  label="Title"
                                  value={add.title || ''}
                                  onChange={e => {
                                    const updated = [...(editProductData.additionals || [])];
                                    updated[idx] = { ...updated[idx], title: e.target.value };
                                    setEditProductData({ ...editProductData, additionals: updated });
                                  }}
                                  fullWidth
                                  size="small"
                                />
                                <TextField
                                  label="Price"
                                  type="number"
                                  value={add.price || ''}
                                  onChange={e => {
                                    const updated = [...(editProductData.additionals || [])];
                                    updated[idx] = { ...updated[idx], price: e.target.value };
                                    setEditProductData({ ...editProductData, additionals: updated });
                                  }}
                                  fullWidth
                                  size="small"
                                  inputProps={{ min: 0, step: 'any' }}
                                />
                                <TextField
                                  label="Description"
                                  value={add.description || ''}
                                  onChange={e => {
                                    const updated = [...(editProductData.additionals || [])];
                                    updated[idx] = { ...updated[idx], description: e.target.value };
                                    setEditProductData({ ...editProductData, additionals: updated });
                                  }}
                                  fullWidth
                                  size="small"
                                  multiline
                                  minRows={2}
                                />
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => {
                                    const updated = (editProductData.additionals || []).filter((_, i) => i !== idx);
                                    setEditProductData({ ...editProductData, additionals: updated });
                                  }}
                                  sx={{ alignSelf: 'flex-start' }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const updated = [...(editProductData.additionals || []), { title: '', price: '', description: '' }];
                                setEditProductData({ ...editProductData, additionals: updated });
                              }}
                              sx={{ mt: 1 }}
                            >
                              Add Additional
                            </Button>
                          </div>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setShowEditProductModal(false)} color="secondary">Cancel</Button>
                          <Button type="submit" variant="contained">Save</Button>
                        </DialogActions>
                      </form>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          ) : (
            <SecondProductsAndServices category={selectedCategory} onBack={() => setSelectedCategory(null)} />
          )
        )}
      </div>
    </div>
  );
}
