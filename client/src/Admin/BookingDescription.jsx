import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Paper, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';
import './booking-description.css';

export default function BookingDescription({ open, onClose, booking, onSave }) {
    // Contract picture state
    const [contractPreview, setContractPreview] = React.useState(booking?.contractPicture || '');
    const contractInputRef = React.useRef(null);

    // Update contract preview when booking changes
    React.useEffect(() => {
      setContractPreview(booking?.contractPicture || '');
    }, [booking]);

    // Handle contract picture upload
    const handleContractUpload = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          setContractPreview(base64);
          setEditData(prev => ({ ...prev, contractPicture: base64 }));
        };
        reader.readAsDataURL(file);
      }
    };

    // Remove contract picture
    const handleRemoveContract = () => {
      setContractPreview('');
      setEditData(prev => ({ ...prev, contractPicture: '' }));
      if (contractInputRef.current) contractInputRef.current.value = '';
    };
  const [promos, setPromos] = React.useState([]);
  const [editData, setEditData] = React.useState(booking || {});
  const [isEditing, setIsEditing] = React.useState(false);
  const [provinces, setProvinces] = React.useState([]);
  const [cities, setCities] = React.useState([]);
  const [barangays, setBarangays] = React.useState([]);
  const [venueDropdown, setVenueDropdown] = React.useState({ province: '', city: '', barangay: '' });
  const [loading, setLoading] = React.useState({ provinces: false, cities: false, barangays: false });
  const [paymentDetails, setPaymentDetails] = React.useState({
    modeOfPayment: '',
    discountType: '',
    subTotal: 0,
    discount: 0,
    finalTotal: 0
  });
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = React.useState(false);
  const [paymentDetailsForm, setPaymentDetailsForm] = React.useState({
    paymentStatus: '',
    amountPaid: '',
    paymentDate: '',
    transactionReference: '',
    paymentProof: '',
    paymentNotes: ''
  });
  const [paymentProofPreview, setPaymentProofPreview] = React.useState('');
  const paymentProofInputRef = React.useRef(null);
  const [eventTypes, setEventTypes] = React.useState([]);
  const paymentModes = ['Cash', 'Bank Transfer', 'GCash'];
  const paymentStatuses = ['Pending', 'Partially Paid', 'Fully Paid', 'Refunded'];
  
  // Product search and management
  const [showProductSearch, setShowProductSearch] = React.useState(false);
  const [availableProducts, setAvailableProducts] = React.useState([]);
  const [productSearchTerm, setProductSearchTerm] = React.useState('');
  const [selectedProductDetail, setSelectedProductDetail] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [categories, setCategories] = React.useState([]);

  // PSGC API endpoints
  const PSGC_API = 'https://psgc.gitlab.io/api';

  // Load provinces on mount
  React.useEffect(() => {
    setLoading(l => ({ ...l, provinces: true }));
    fetch(`${PSGC_API}/provinces/`)
      .then(res => res.json())
      .then(data => setProvinces(data))
      .finally(() => setLoading(l => ({ ...l, provinces: false })))
      .catch(console.error);
  }, []);

  // Load all promos from the database for the dropdown
  React.useEffect(() => {
    api.get('/promos')
      .then(res => setPromos(res.data))
      .catch(() => setPromos([]));
  }, []);

  // Load event types from the API
  React.useEffect(() => {
    api.get('/event-types')
      .then(res => {
        let types = Array.isArray(res.data) ? res.data : [];
        if (types.length && typeof types[0] === 'object' && types[0].name) {
          types = types.map(t => t.name);
        }
        setEventTypes(types);
      })
      .catch(() => setEventTypes([]));
  }, []);

  // Load categories on mount
  React.useEffect(() => {
    api.get('/categories')
      .then(res => {
        console.log('Categories loaded:', res.data);
        setCategories(res.data || []);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      });
  }, []);
  
  // Load products when category is selected
  React.useEffect(() => {
    if (selectedCategory && selectedCategory.title) {
      console.log('Fetching products for category:', selectedCategory.title);
      fetch(`/api/products/${encodeURIComponent(selectedCategory.title)}`)
        .then(res => res.json())
        .then(products => {
          console.log('Products loaded for category:', products);
          setAvailableProducts(products || []);
        })
        .catch(err => {
          console.error('Failed to fetch products:', err);
          setAvailableProducts([]);
        });
    } else {
      setAvailableProducts([]);
    }
  }, [selectedCategory]);

  // Handle booking data updates - reset everything when booking changes
  React.useEffect(() => {
    if (booking) {
      // Reset edit mode when switching bookings
      setIsEditing(false);
      
      // Find matching promo by title if promoTitle exists but promoId doesn't
      let matchedPromoId = booking.promoId || '';
      let promoTitle = booking.promoTitle || '';
      let discountType = booking.discountType || '';
      
      if (booking.promoTitle && promos.length > 0) {
        const matchedPromo = promos.find(p => p.title === booking.promoTitle);
        
        // Check if promo exists and is still valid
        if (matchedPromo) {
          const now = new Date();
          const start = matchedPromo.validFrom ? new Date(matchedPromo.validFrom) : null;
          const end = matchedPromo.validUntil ? new Date(matchedPromo.validUntil) : null;
          
          // If promo is expired, clear it
          if (start && end && (now < start || now > end)) {
            console.log('Promo expired, clearing:', matchedPromo.title);
            matchedPromoId = '';
            promoTitle = '';
            discountType = '';
          } else {
            matchedPromoId = matchedPromo._id;
          }
        } else {
          // Promo not found in database, clear it
          matchedPromoId = '';
          promoTitle = '';
          discountType = '';
        }
      }
      
      // Reset edit data to the new booking with promo fields mapped
      setEditData({
        ...booking,
        promoId: matchedPromoId,
        promoTitle: promoTitle,
        discountType: discountType
      });
      
      // Initialize payment details from booking data
      setPaymentDetails(prev => ({
        ...prev,
        modeOfPayment: booking.paymentMode || '',
        discountType: booking.discountType || '',
        subTotal: booking.subTotal || 0,
        discount: booking.discount || 0,
        finalTotal: booking.totalPrice || 0
      }));

      // Initialize payment details form if booking has payment details
      if (booking.paymentDetails) {
        setPaymentDetailsForm({
          paymentStatus: booking.paymentDetails.paymentStatus || '',
          amountPaid: booking.paymentDetails.amountPaid || '',
          paymentDate: booking.paymentDetails.paymentDate || '',
          transactionReference: booking.paymentDetails.transactionReference || '',
          paymentProof: booking.paymentDetails.paymentProof || '',
          paymentNotes: booking.paymentDetails.paymentNotes || ''
        });
        setPaymentProofPreview(booking.paymentDetails.paymentProof || '');
      } else {
        // Reset payment details form if no payment details exist
        setPaymentDetailsForm({
          paymentStatus: '',
          amountPaid: '',
          paymentDate: '',
          transactionReference: '',
          paymentProof: '',
          paymentNotes: ''
        });
        setPaymentProofPreview('');
      }
      
      // Reset venue dropdown
      setVenueDropdown({ province: '', city: '', barangay: '' });
    }
  }, [booking, promos]);

  // Handle payment proof file upload
  const handlePaymentProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        setPaymentProofPreview(base64);
        setPaymentDetailsForm(prev => ({ ...prev, paymentProof: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove payment proof
  const handleRemovePaymentProof = () => {
    setPaymentProofPreview('');
    setPaymentDetailsForm(prev => ({ ...prev, paymentProof: '' }));
    if (paymentProofInputRef.current) {
      paymentProofInputRef.current.value = '';
    }
  };

  // Effect to log state changes (for debugging)
  React.useEffect(() => {
    console.log('Current editData:', editData);
    console.log('Is editing:', isEditing);
    console.log('Formatted date for input:', formatDateForInput(editData.date));
  }, [editData, isEditing]);

  // Auto-recalculate total price when products change
  React.useEffect(() => {
    if (isEditing && editData.products) {
      const totals = calculateTotal(editData.products, null, editData.discountType || '');
      setEditData(prev => ({
        ...prev,
        subTotal: totals.subTotal,
        totalPrice: totals.finalTotal,
        discount: totals.discount
      }));
    }
  }, [editData.products?.length, isEditing]);

  // Load cities when province changes
  React.useEffect(() => {
    if (venueDropdown.province) {
      setLoading(l => ({ ...l, cities: true }));
      setCities([]);
      setBarangays([]);
      setVenueDropdown(prev => ({ ...prev, city: '', barangay: '' }));
      fetch(`${PSGC_API}/provinces/${venueDropdown.province}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => setCities(data))
        .finally(() => setLoading(l => ({ ...l, cities: false })));
    }
  }, [venueDropdown.province]);

  // Load barangays when city changes
  React.useEffect(() => {
    if (venueDropdown.city) {
      setLoading(l => ({ ...l, barangays: true }));
      setBarangays([]);
      setVenueDropdown(prev => ({ ...prev, barangay: '' }));
      fetch(`${PSGC_API}/cities-municipalities/${venueDropdown.city}/barangays/`)
        .then(res => res.json())
        .then(data => setBarangays(data))
        .finally(() => setLoading(l => ({ ...l, barangays: false })));
    }
  }, [venueDropdown.city]);

  // Parse and set initial venue data when editing starts
  React.useEffect(() => {
    if (isEditing && editData.eventVenue) {
      // Try to parse venue string: "Barangay, City/Municipality, Province"
      const parts = editData.eventVenue.split(',').map(s => s.trim());
      
      if (parts.length >= 3) {
        // First, find the province
        const province = provinces.find(p => p.name === parts[2]);
        if (province) {
          setVenueDropdown(prev => ({ ...prev, province: province.code }));
          
          // Load cities for this province
          fetch(`${PSGC_API}/provinces/${province.code}/cities-municipalities/`)
            .then(res => res.json())
            .then(cityData => {
              setCities(cityData);
              const city = cityData.find(c => c.name === parts[1]);
              if (city) {
                setVenueDropdown(prev => ({ ...prev, city: city.code }));
                
                // Load barangays for this city
                fetch(`${PSGC_API}/cities-municipalities/${city.code}/barangays/`)
                  .then(res => res.json())
                  .then(barangayData => {
                    setBarangays(barangayData);
                    const barangay = barangayData.find(b => b.name === parts[0]);
                    if (barangay) {
                      setVenueDropdown(prev => ({ ...prev, barangay: barangay.code }));
                    }
                  });
              }
            });
        }
      }
    }
  }, [isEditing, editData.eventVenue, provinces]);

  // Handle dropdown changes
  const handleVenueChange = (field) => (e) => {
    const value = e.target.value;
    setVenueDropdown(prev => ({ ...prev, [field]: value }));
    
    // Get the display names for the selected values
    const province = provinces.find(p => p.code === venueDropdown.province)?.name || venueDropdown.province;
    const city = cities.find(c => c.code === venueDropdown.city)?.name || venueDropdown.city;
    const barangay = barangays.find(b => b.code === value)?.name || value;

    // Update eventVenue string in editData based on what's selected
    let parts = [];
    if (field === 'province') {
      const provinceName = provinces.find(p => p.code === value)?.name || value;
      parts = [venueDropdown.barangay, venueDropdown.city, provinceName].filter(Boolean);
    } else if (field === 'city') {
      const cityName = cities.find(c => c.code === value)?.name || value;
      parts = [venueDropdown.barangay, cityName, province].filter(Boolean);
    } else {
      const barangayName = barangays.find(b => b.code === value)?.name || value;
      parts = [barangayName, city, province].filter(Boolean);
    }

    const newVenue = parts.join(', ');
    setEditData({ ...editData, eventVenue: newVenue });
  };

  const handleEventTypeChange = (e) => {
    setEditData({ ...editData, eventType: e.target.value });
  };

  const calculateTotal = (products, additionals, discountType) => {
    // Calculate products total
    const productsTotal = products?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0;
    
    // Calculate additionals total
    const additionalsTotal = products?.reduce((sum, product) => {
      const productAdditionals = product.__cart_additionals || product.additionals || [];
      return sum + productAdditionals.reduce((addSum, add) => addSum + (Number(add.price) || 0), 0);
    }, 0) || 0;

    const subTotal = productsTotal + additionalsTotal;
    // Parse discount percentage from discountType (supports any percentage value)
    const discountPercentage = discountType ? (Number(discountType) / 100) : 0;
    const discountAmount = subTotal * discountPercentage;
    const finalTotal = subTotal - discountAmount;

    return {
      subTotal,
      discount: discountAmount,
      finalTotal
    };
  };

  const handlePaymentModalSubmit = () => {
    const totals = calculateTotal(editData.products, null, paymentDetails.discountType);
    setPaymentDetails(prev => ({
      ...prev,
      ...totals
    }));
    setEditData(prev => ({
      ...prev,
      totalPrice: totals.finalTotal,
      paymentMode: paymentDetails.modeOfPayment,
      discount: totals.discount,
      discountType: paymentDetails.discountType
    }));
    setShowPaymentModal(false);
  };

  // Helper to parse date considering different formats
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    
    // If the date is already in DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      // Note: month - 1 because JavaScript months are 0-based
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    
    // For ISO format or other formats, use standard parsing
    return new Date(dateStr);
  };

  // Helper for date formatting to ensure consistent DD/MM/YYYY format
  const formatDate = (date) => {
    if (!date) return '';
    const d = parseDateString(date);
    if (!d || isNaN(d)) return '';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper to format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = parseDateString(date);
    if (!d || isNaN(d)) return '';
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (field) => (e) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handlePaymentDetailsSubmit = async () => {
    try {
      const response = await api.put(`/bookings/${booking._id}`, {
        ...editData,
        paymentDetails: paymentDetailsForm
      });
      
      if (response.status === 200) {
        alert('Payment details saved successfully!');
        setShowPaymentDetailsModal(false);
        // Update the local state
        setEditData(prev => ({
          ...prev,
          paymentDetails: paymentDetailsForm
        }));
        // Notify parent to refresh
        if (onSave) onSave();
      }
    } catch (err) {
      console.error('Error saving payment details:', err);
      alert('Failed to save payment details. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      // Ensure we have an ID to work with
      const bookingId = editData._id || editData.id;
      if (!bookingId) {
        throw new Error('No booking ID found');
      }

      // Parse and format the date properly without timezone issues
      let formattedDate;
      if (editData.date) {
        // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD (no timezone conversion)
        if (editData.date.includes('/')) {
          const [day, month, year] = editData.date.split('/').map(Number);
          // Store as YYYY-MM-DD string to avoid timezone issues
          formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        } else if (editData.date.includes('-')) {
          // Already in YYYY-MM-DD format
          formattedDate = editData.date;
        } else {
          // Try to parse and convert to YYYY-MM-DD
          const dateObj = new Date(editData.date);
          if (!isNaN(dateObj)) {
            const year = dateObj.getFullYear();
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          }
        }
      }

      // Recalculate totals based on current products and discount
      const totals = calculateTotal(editData.products, null, editData.discountType || '');

      // Prepare the data for saving
      const dataToSave = {
        ...editData,
        eventVenue: editData.eventVenue || `${editData.barangayValue || ''}, ${editData.cityValue || ''}, ${editData.provinceValue || ''}`.trim(),
        province: editData.province || '',
        city: editData.city || '',
        barangay: editData.barangay || '',
        branchLocation: editData.branchLocation || '',
        theme: editData.theme || '',
        date: formattedDate || editData.date,
        // Payment related fields
        paymentMode: editData.paymentMode || '',
        discountType: editData.discountType ? editData.discountType : '',
        discount: totals.discount || 0,
        subTotal: totals.subTotal || 0,
        totalPrice: totals.finalTotal || 0,
        // Promo fields - explicitly set empty strings to clear database fields
        promoId: editData.promoId ? editData.promoId : '',
        promoTitle: editData.promoTitle ? editData.promoTitle : '',
        // Ensure other fields have fallback values
        name: editData.name || '',
        contact: editData.contact || '',
        email: editData.email || '',
        eventType: editData.eventType || '',
        guestCount: editData.guestCount || 0,
        products: editData.products || [],
        suppliers: editData.suppliers || [],
        specialRequest: editData.specialRequest || '',
        outsidePH: editData.outsidePH || '',
        contractPicture: editData.contractPicture || '' // Always include contractPicture
      };

      console.log('Saving booking:', dataToSave);

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        
        // Deep merge the updated data with current state
        const mergedData = {
          ...editData,
          ...updatedBooking,
          // Preserve payment-related data
          paymentMode: dataToSave.paymentMode,
          discountType: dataToSave.discountType,
          discount: dataToSave.discount,
          subTotal: dataToSave.subTotal,
          totalPrice: dataToSave.totalPrice,
          // Preserve promo fields (use what we sent, not what came back)
          promoId: dataToSave.promoId,
          promoTitle: dataToSave.promoTitle,
          // Preserve other important data
          eventVenue: updatedBooking.eventVenue || editData.eventVenue,
          products: updatedBooking.products || editData.products,
        };

        // Update payment details state
        setPaymentDetails(prev => ({
          ...prev,
          modeOfPayment: mergedData.paymentMode,
          discountType: mergedData.discountType,
          discount: mergedData.discount,
          subTotal: mergedData.subTotal,
          finalTotal: mergedData.totalPrice
        }));

        // Update our local state
        setEditData(mergedData);
        
        // Exit edit mode
        setIsEditing(false);

        // Notify parent to refresh
        if (onSave) onSave();

        // Show success message
        alert('Changes saved successfully!');
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Save error response:', errorData);
        alert(errorData?.message || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving changes. Please try again.');
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperComponent={Paper}
      maxWidth={false}
      fullWidth={false}
      scroll="paper"
      className="booking-description-modal"
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
      <DialogTitle sx={{ m: 0, pt: 2, pb: 2, pl: 4, pr: 2, fontWeight: 800, fontSize: 26, letterSpacing: 1, color: '#222', textAlign: 'left', position: 'relative' }}>
        Booking Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
  <div style={{ padding: 32, background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)', borderRadius: 24, minWidth: 900 }}>
          {/* Booker & Event Info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, marginBottom: 40, background: '#fedb71', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 32, minWidth: 800 }}>
            <div style={{ minWidth: 320, flex: 2 }}>
              {isEditing ? (
                <>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Name:</span>
                    <input style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.name || ''} onChange={handleChange('name')} />
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Contact Number:</span>
                    <input style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.contact || ''} onChange={handleChange('contact')} />
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Email Address:</span>
                    <input style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.email || ''} onChange={handleChange('email')} />
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Payment Mode:</span>
                    <select
                      style={{ 
                        marginLeft: 8, 
                        color: '#222', 
                        fontSize: 15, 
                        borderRadius: 4, 
                        border: '1px solid #ccc', 
                        padding: '2px 8px', 
                        background: '#fff'
                      }}
                      value={editData.paymentMode || ''}
                      onChange={(e) => {
                        setEditData(prev => ({ ...prev, paymentMode: e.target.value }));
                      }}
                    >
                      <option value="">Select Payment Mode</option>
                      {paymentModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Promo:</span>
                    <select
                      style={{
                        marginLeft: 8,
                        color: '#222',
                        fontSize: 15,
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        padding: '2px 8px',
                        background: '#fff'
                      }}
                      value={editData.promoId || ''}
                      onChange={e => {
                        const promoId = e.target.value;
                        const selectedPromo = promos.find(p => p._id === promoId);
                        let discountType = '';
                        let discount = 0;
                        let totalPrice = 0;
                        if (selectedPromo) {
                          discountType = selectedPromo.discountValue?.toString() || '';
                          const totals = calculateTotal(editData.products, null, discountType);
                          discount = totals.discount;
                          totalPrice = totals.finalTotal;
                        } else {
                          // If no promo, recalculate with no discount and clear all promo fields
                          const totals = calculateTotal(editData.products, null, '');
                          discount = totals.discount;
                          totalPrice = totals.finalTotal;
                          discountType = ''; // Explicitly clear
                        }
                        setEditData(prev => ({
                          ...prev,
                          promoId: promoId || '', // Ensure empty string, not undefined
                          promoTitle: selectedPromo ? selectedPromo.title : '',
                          discountType: discountType || '', // Ensure empty string
                          discount,
                          totalPrice
                        }));
                      }}
                    >
                      <option value="">No Promo</option>
                      {promos.filter(promo => {
                        const now = new Date();
                        const start = promo.validFrom ? new Date(promo.validFrom) : null;
                        const end = promo.validUntil ? new Date(promo.validUntil) : null;
                        return start && end && now >= start && now <= end;
                      }).map(promo => (
                        <option key={promo._id} value={promo._id}>{promo.title} ({promo.discountValue}% OFF)</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Total Price:</span>
                    <input 
                      style={{ 
                        marginLeft: 8, 
                        color: '#222', 
                        fontSize: 15, 
                        borderRadius: 4, 
                        border: '1px solid #ccc', 
                        padding: '2px 8px', 
                        background: '#f5f5f5', 
                        cursor: 'not-allowed' 
                      }} 
                      value={`PHP ${editData.totalPrice || ''}`} 
                      readOnly 
                    />
                  </div>
                  {editData.discount > 0 && (
                    <div style={{ marginBottom: 10, fontSize: 15 }}>
                      <span style={{ fontWeight: 700, color: '#000000ff' }}>Discount Amount:</span>
                      <span style={{ marginLeft: 8, color: '#e53935' }}>- PHP {editData.discount}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Name:</span> <span style={{ color: '#222' }}>{editData.name || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Contact Number:</span> <span style={{ color: '#222' }}>{editData.contact || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Email Address:</span> <span style={{ color: '#222' }}>{editData.email || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Payment Mode:</span> <span style={{ color: '#222' }}>{editData.paymentMode || 'Not set'}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Sub Total:</span> <span style={{ color: '#222' }}>PHP {editData.subTotal || editData.totalPrice || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Promo:</span>
                    <span style={{ color: '#222' }}>
                      {isEditing
                        ? null
                        : (editData.promoTitle ? editData.promoTitle : '')}
                    </span>
                  </div>
                  {editData.discount > 0 && (
                    <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Discount Amount:</span> <span style={{ color: '#e53935' }}>- PHP {editData.discount}</span></div>
                  )}
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Total Price:</span> <span style={{ color: '#222', fontWeight: 'bold' }}>PHP {editData.totalPrice || ''}</span></div>
                  
                  {editData.suppliers && editData.suppliers.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '2px solid #e6b800', paddingTop: 15 }}>
                      <div style={{ marginBottom: 10, fontSize: 16, fontWeight: 700, color: '#e6b800' }}>Assigned Suppliers:</div>
                      {editData.suppliers.map((supplier, idx) => (
                        <div key={supplier._id || idx} style={{ marginBottom: 8, fontSize: 14, paddingLeft: 10 }}>
                          <div style={{ color: '#222' }}>
                            <span style={{ fontWeight: 600 }}>{supplier.companyName || 'N/A'}</span>
                          </div>
                          <div style={{ color: '#666', fontSize: 13 }}>
                            Email: {supplier.email || 'N/A'} | Phone: {supplier.phone || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ minWidth: 320, flex: 3 }}>
              {isEditing ? (
                <>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Event Type:</span>
                    <select style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.eventType || ''} onChange={handleEventTypeChange}>
                      <option value="">Select Event Type</option>
                      {eventTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Event Date:</span>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={parseDateString(editData.date)}
                        format="dd/MM/yyyy"
                        onChange={(newDate) => {
                          if (newDate) {
                            const day = newDate.getDate().toString().padStart(2, '0');
                            const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
                            const year = newDate.getFullYear();
                            const formattedDate = `${day}/${month}/${year}`;
                            setEditData(prev => ({ ...prev, date: formattedDate }));
                          }
                        }}
                        sx={{
                          marginLeft: 1,
                          '& .MuiInputBase-root': {
                            height: '32px',
                            fontSize: '15px',
                            backgroundColor: 'transparent',
                            '& fieldset': {
                              borderColor: '#ccc',
                            },
                            '&:hover fieldset': {
                              borderColor: '#fedb71',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#fedb71',
                            }
                          },
                          '& .MuiInputBase-input': {
                            padding: '4px 8px',
                            color: '#222',
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Appointment Method:</span>
                    <select 
                      style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }}
                      value={editData.outsidePH || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, outsidePH: e.target.value }))}
                    >
                      <option value="">Select Method</option>
                      <option value="yes">Face to Face</option>
                      <option value="no">Virtual/Online</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Event Venue:</span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <select 
                        style={{ color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} 
                        value={venueDropdown.province} 
                        onChange={handleVenueChange('province')}
                        disabled={loading.provinces}
                      >
                        <option value="">Province</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                      <select 
                        style={{ color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} 
                        value={venueDropdown.city} 
                        onChange={handleVenueChange('city')}
                        disabled={!venueDropdown.province || loading.cities}
                      >
                        <option value="">City/Municipality</option>
                        {cities.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                      <select 
                        style={{ color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} 
                        value={venueDropdown.barangay} 
                        onChange={handleVenueChange('barangay')}
                        disabled={!venueDropdown.city || loading.barangays}
                      >
                        <option value="">Barangay</option>
                        {barangays.map(b => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Guest Count:</span>
                    <input style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.guestCount || ''} onChange={handleChange('guestCount')} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Event Type:</span> <span style={{ color: '#222' }}>{editData.eventType || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Event Date:</span> <span style={{ color: '#222' }}>{formatDate(editData.date)}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Event Venue:</span> <span style={{ color: '#222' }}>{editData.eventVenue || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Branch Location:</span> <span style={{ color: '#222' }}>{editData.branchLocation || 'Not specified'}</span></div>
                  {editData.theme && <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Theme:</span> <span style={{ color: '#222' }}>{editData.theme}</span></div>}
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Guest Count:</span> <span style={{ color: '#222' }}>{editData.guestCount || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Appointment Method:</span> <span style={{ color: '#222' }}>{editData.outsidePH === 'yes' ? 'Face to Face' : editData.outsidePH === 'no' ? 'Virtual/Online' : 'Not specified'}</span></div>
                </>
              )}
            </div>
          </div>
          {/* Assigned Suppliers Section */}
          {editData.suppliers && editData.suppliers.length > 0 && (
            <div style={{ marginBottom: 40, background: '#fff3cd', borderRadius: 12, padding: 20, border: '2px solid #F3C13A' }}>
              <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 14, color: '#222' }}>
                Assigned Suppliers
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {editData.suppliers.map((supplier, idx) => (
                  <div key={supplier._id || idx} style={{
                    background: 'white',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#222' }}>
                      {supplier.companyName || 'N/A'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 3 }}>
                      📧 {supplier.email || 'N/A'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      📞 {supplier.phone || 'N/A'}
                    </div>
                    {supplier.branchContacts && supplier.branchContacts.length > 0 && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                        📍 {supplier.branchContacts.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services and Products Availed */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 14, color: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Services and Products Availed
              {isEditing && (
                <button
                  onClick={() => setShowProductSearch(true)}
                  style={{ background: '#F3C13A', color: '#222', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                >
                  + Add Product/Service
                </button>
              )}
            </div>
            {(editData.products && editData.products.length > 0) ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {editData.products.map((item, idx) => (
                  <div key={idx} style={{
                    background: '#fedb71',
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedProductDetail(item)}
                  >
                    {item.image && (
                      <img src={item.image} alt={item.title} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{item.title}</div>
                      {item.price && <div style={{ color: '#222', fontWeight: 300, fontSize: 14 }}>PHP {item.price}</div>}
                    </div>
                    {isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = editData.products.filter((_, i) => i !== idx);
                          setEditData({ ...editData, products: updated });
                        }}
                        style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', marginLeft: 8 }}
                        title="Delete"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#fedb71', marginBottom: 16, fontSize: 15 }}>No products/services selected.</div>
            )}
          </div>
          {/* Selected Additionals (admin view) */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12, color: '#222' }}>Selected Additionals</div>
            {editData.products && editData.products.length > 0 ? (
              (() => {
                const allAdds = [];
                editData.products.forEach(p => {
                  const adds = p.__cart_additionals || p.additionals || [];
                  if (Array.isArray(adds)) adds.forEach(a => allAdds.push(a));
                });
                if (allAdds.length === 0) return <div style={{ color: '#222' }}>No additionals selected.</div>;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {allAdds.map((add, idx) => (
                      <div key={add._id || add.title || idx} style={{ background: '#fff', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                        <div style={{ fontWeight: 700 }}>{add.title}</div>
                        <div style={{ color: '#222' }}>PHP {add.price ? add.price : 0}</div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div style={{ color: '#222' }}>No additionals selected.</div>
            )}
          </div>
          {/* Special Request */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: '#222' }}>Special Request</div>
            {isEditing ? (
              <textarea
                className="booking-special-request"
                style={{ width: '100%', minHeight: 100, fontFamily: 'inherit', fontSize: '1rem', padding: 12, borderRadius: 10, border: '1px solid #fedb71', resize: 'vertical', background: 'transparent', color: '#222', boxShadow: '0 2px 8px rgba(33,150,243,0.04)' }}
                value={editData.specialRequest || ''}
                onChange={handleChange('specialRequest')}
              />
            ) : (
              <div style={{ color: '#222', background: '#fff', borderRadius: 10, padding: 12, minHeight: 100, border: '1px solid #fedb71' }}>{editData.specialRequest || ''}</div>
            )}
          </div>

          {/* Payment Details Display */}
          {editData.paymentDetails && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12, color: '#222' }}>Payment Details</div>
              <div style={{ 
                background: '#e8f5e9', 
                borderRadius: 12, 
                padding: 20,
                border: '2px solid #4CAF50',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 4 }}>Payment Status</div>
                    <div style={{ 
                      fontWeight: 800, 
                      fontSize: 16, 
                      color: editData.paymentDetails.paymentStatus === 'Fully Paid' ? '#4CAF50' : 
                             editData.paymentDetails.paymentStatus === 'Partially Paid' ? '#FF9800' : 
                             editData.paymentDetails.paymentStatus === 'Refunded' ? '#e53935' : '#666'
                    }}>
                      {editData.paymentDetails.paymentStatus}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 4 }}>Amount Paid</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#222' }}>PHP {editData.paymentDetails.amountPaid}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 4 }}>Payment Date</div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>{editData.paymentDetails.paymentDate}</div>
                  </div>
                  {editData.paymentDetails.transactionReference && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 4 }}>Transaction Reference</div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#222', wordBreak: 'break-all' }}>{editData.paymentDetails.transactionReference}</div>
                    </div>
                  )}
                </div>
                {editData.paymentDetails.paymentProof && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 8 }}>Payment Proof</div>
                    <img 
                      src={editData.paymentDetails.paymentProof} 
                      alt="Payment Proof" 
                      style={{ 
                        maxWidth: '300px', 
                        maxHeight: '200px', 
                        borderRadius: 8, 
                        border: '2px solid #ddd',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                )}
                {editData.paymentDetails.paymentNotes && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 4 }}>Additional Notes</div>
                    <div style={{ fontSize: 15, color: '#222', fontStyle: 'italic' }}>{editData.paymentDetails.paymentNotes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contract Picture Upload (optional) */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12, color: '#222' }}>Contract Picture (optional)</div>
            {isEditing ? (
              <>
                <input
                  ref={contractInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleContractUpload}
                />
                {contractPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                    <img
                      src={contractPreview}
                      alt="Contract Preview"
                      style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: 8, border: '2px solid #ccc', objectFit: 'contain', display: 'block' }}
                    />
                    <button
                      onClick={handleRemoveContract}
                      style={{ position: 'absolute', top: 8, right: 8, background: '#e53935', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    >×</button>
                  </div>
                ) : (
                  <button
                    onClick={() => contractInputRef.current?.click()}
                    style={{ padding: '10px 20px', borderRadius: 8, border: '2px dashed #ccc', background: '#f9f9f9', cursor: 'pointer', fontSize: 15, color: '#666', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                  >📎 Upload Contract Picture</button>
                )}
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Upload signed contract, agreement, or related document (image only)</div>
              </>
            ) : (
              contractPreview ? (
                <img
                  src={contractPreview}
                  alt="Contract Preview"
                  style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: 8, border: '2px solid #ccc', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ color: '#888', fontSize: 15 }}>No contract picture uploaded.</div>
              )
            )}
          </div>

          {/* Edit/Save/Cancel/Payment Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 12, alignItems: 'center' }}>
            {isEditing && (
              <button 
                onClick={() => setShowPaymentDetailsModal(true)} 
                style={{ 
                  background: '#4CAF50', 
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: 16, 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '10px 32px', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginRight: 'auto'
                }}
              >
                Add Payment Details
              </button>
            )}
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    // Reset with proper promoId matching
                    let matchedPromoId = booking.promoId || '';
                    if (booking.promoTitle && !booking.promoId && promos.length > 0) {
                      const matchedPromo = promos.find(p => p.title === booking.promoTitle);
                      if (matchedPromo) matchedPromoId = matchedPromo._id;
                    }
                    setEditData({
                      ...booking,
                      promoId: matchedPromoId,
                      promoTitle: booking.promoTitle || '',
                      discountType: booking.discountType || ''
                    });
                  }} 
                  style={{ 
                    background: '#fff', 
                    color: '#222', 
                    fontWeight: 700, 
                    fontSize: 16, 
                    border: '2px solid #fedb71', 
                    borderRadius: 8, 
                    padding: '8px 32px', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  Cancel
                </button>
                {/* Removed Add Payment Details button since it's integrated in edit mode */}
                {false && (
                  <Dialog
                    open={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    scroll="paper"
                    PaperProps={{
                      style: {
                        borderRadius: 16,
                        padding: 24,
                        minWidth: 400
                      },
                      sx: {
                        maxHeight: '90vh',
                        margin: '16px',
                        '@media (max-width: 768px)': {
                          margin: '8px',
                          maxHeight: '95vh',
                          width: 'calc(100vw - 16px)',
                          minWidth: 'unset'
                        },
                        '@media (max-width: 900px) and (max-height: 600px) and (orientation: landscape)': {
                          margin: '4px',
                          maxHeight: '85vh',
                          width: 'calc(100vw - 8px)',
                          minWidth: 'unset'
                        }
                      }
                    }}
                  >
                    <DialogTitle sx={{ pb: 2, fontWeight: 800, fontSize: 24, color: '#222' }}>
                      Payment Details
                    </DialogTitle>
                    <DialogContent dividers>
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Mode of Payment</div>
                        <select
                          value={paymentDetails.modeOfPayment}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, modeOfPayment: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #fedb71',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <option value="">Select Payment Mode</option>
                          {paymentModes.map(mode => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Discount</div>
                        <select
                          value={paymentDetails.discountType}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, discountType: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #fedb71',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <option value="">No Discount</option>
                          <option value="10">10% Discount</option>
                          <option value="20">20% Discount</option>
                        </select>
                      </div>

                      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>Order Summary</div>
                        
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Products/Services:</div>
                          {editData.products?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span>{item.title}</span>
                              <span>PHP {item.price || 0}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Additionals:</div>
                          {editData.products?.map(product => (
                            (product.__cart_additionals || product.additionals || []).map((add, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span>{add.title}</span>
                                <span>PHP {add.price || 0}</span>
                              </div>
                            ))
                          ))}
                        </div>

                        {(() => {
                          const totals = calculateTotal(editData.products, null, paymentDetails.discountType);
                          return (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600 }}>
                                <span>Subtotal:</span>
                                <span>PHP {totals.subTotal}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#e53935', fontWeight: 600 }}>
                                <span>Discount:</span>
                                <span>- PHP {totals.discount}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, fontSize: 18 }}>
                                <span>Total:</span>
                                <span>PHP {totals.finalTotal}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button
                          onClick={() => setShowPaymentModal(false)}
                          style={{
                            padding: '8px 24px',
                            borderRadius: 8,
                            border: '1px solid #fedb71',
                            background: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePaymentModalSubmit}
                          style={{
                            padding: '8px 24px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#fedb71',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {/* Payment Details Modal */}
                <Dialog
                  open={showPaymentDetailsModal}
                  onClose={() => setShowPaymentDetailsModal(false)}
                  scroll="paper"
                  PaperProps={{
                    style: {
                      borderRadius: 16,
                      padding: 24,
                      minWidth: 500
                    },
                    sx: {
                      maxHeight: '90vh',
                      margin: '16px',
                      '@media (max-width: 768px)': {
                        margin: '8px',
                        maxHeight: '95vh',
                        width: 'calc(100vw - 16px)',
                        minWidth: 'unset'
                      },
                      '@media (max-width: 900px) and (max-height: 600px) and (orientation: landscape)': {
                        margin: '4px',
                        maxHeight: '85vh',
                        width: 'calc(100vw - 8px)',
                        minWidth: 'unset'
                      }
                    }
                  }}
                >
                  <DialogTitle sx={{ pb: 2, fontWeight: 800, fontSize: 24, color: '#222' }}>
                    Payment Details
                    <IconButton
                      aria-label="close"
                      onClick={() => setShowPaymentDetailsModal(false)}
                      sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent dividers>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
                      {/* Payment Status */}
                      <div>
                        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#222' }}>
                          Payment Status <span style={{ color: '#e53935' }}>*</span>
                        </label>
                        <select
                          value={paymentDetailsForm.paymentStatus}
                          onChange={(e) => setPaymentDetailsForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222'
                          }}
                        >
                          <option value="">Select Status</option>
                          {paymentStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      {/* Amount Paid */}
                      <div>
                        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#222' }}>
                          Amount Paid (PHP) <span style={{ color: '#e53935' }}>*</span>
                        </label>
                        <input
                          type="number"
                          value={paymentDetailsForm.amountPaid}
                          onChange={(e) => setPaymentDetailsForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222'
                          }}
                        />
                        {editData.totalPrice && (
                          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                            Total booking amount: PHP {editData.totalPrice}
                          </div>
                        )}
                      </div>

                      {/* Payment Date */}
                      <div>
                        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#222' }}>
                          Payment Date <span style={{ color: '#e53935' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={paymentDetailsForm.paymentDate}
                          onChange={(e) => setPaymentDetailsForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222'
                          }}
                        />
                      </div>

                      {/* Transaction Reference */}
                      <div>
                        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#222' }}>
                          Transaction Reference Number
                        </label>
                        <input
                          type="text"
                          value={paymentDetailsForm.transactionReference}
                          onChange={(e) => setPaymentDetailsForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                          placeholder="e.g., TXN123456789, GCash Ref#, Bank Transfer#"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222'
                          }}
                        />
                      </div>

                      {/* Payment Proof Upload */}
                      <div>
                        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#222' }}>
                          Payment Proof (Receipt/Screenshot)
                        </label>
                        <input
                          ref={paymentProofInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePaymentProofUpload}
                          style={{ display: 'none' }}
                        />
                        {paymentProofPreview ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                              src={paymentProofPreview}
                              alt="Payment Proof Preview"
                              style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                                borderRadius: 8,
                                border: '2px solid #ccc',
                                objectFit: 'contain',
                                display: 'block'
                              }}
                            />
                            <button
                              onClick={handleRemovePaymentProof}
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: '#e53935',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                cursor: 'pointer',
                                fontSize: 18,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => paymentProofInputRef.current?.click()}
                            style={{
                              padding: '10px 20px',
                              borderRadius: 8,
                              border: '2px dashed #ccc',
                              background: '#f9f9f9',
                              cursor: 'pointer',
                              fontSize: 15,
                              color: '#666',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            📎 Upload Payment Proof
                          </button>
                        )}
                        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                          Upload receipt, bank transfer screenshot, or proof of payment
                        </div>
                      </div>

                      {/* Payment Notes */}
                      <div>
                        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#222' }}>
                          Additional Notes
                        </label>
                        <textarea
                          value={paymentDetailsForm.paymentNotes}
                          onChange={(e) => setPaymentDetailsForm(prev => ({ ...prev, paymentNotes: e.target.value }))}
                          placeholder="Any additional payment information..."
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            fontSize: 15,
                            background: '#fff',
                            color: '#222',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      {/* Display current payment details if exists */}
                      {editData.paymentDetails && (
                        <div style={{ 
                          background: '#f5f5f5', 
                          padding: 16, 
                          borderRadius: 8,
                          border: '1px solid #ddd'
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 12, color: '#222' }}>Current Payment Details:</div>
                          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>
                            <div><strong>Status:</strong> {editData.paymentDetails.paymentStatus}</div>
                            <div><strong>Amount Paid:</strong> PHP {editData.paymentDetails.amountPaid}</div>
                            <div><strong>Date:</strong> {editData.paymentDetails.paymentDate}</div>
                            {editData.paymentDetails.transactionReference && (
                              <div><strong>Reference:</strong> {editData.paymentDetails.transactionReference}</div>
                            )}
                            {editData.paymentDetails.paymentNotes && (
                              <div><strong>Notes:</strong> {editData.paymentDetails.paymentNotes}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                      <button
                        onClick={() => setShowPaymentDetailsModal(false)}
                        style={{
                          padding: '10px 28px',
                          borderRadius: 8,
                          border: '1px solid #ccc',
                          background: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 15
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePaymentDetailsSubmit}
                        disabled={!paymentDetailsForm.paymentStatus || !paymentDetailsForm.amountPaid || !paymentDetailsForm.paymentDate}
                        style={{
                          padding: '10px 28px',
                          borderRadius: 8,
                          border: 'none',
                          background: (!paymentDetailsForm.paymentStatus || !paymentDetailsForm.amountPaid || !paymentDetailsForm.paymentDate) ? '#ccc' : '#4CAF50',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: (!paymentDetailsForm.paymentStatus || !paymentDetailsForm.amountPaid || !paymentDetailsForm.paymentDate) ? 'not-allowed' : 'pointer',
                          fontSize: 15
                        }}
                      >
                        Save Payment Details
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <button 
                  onClick={handleSave} 
                  style={{ 
                    background: '#fedb71', 
                    color: '#222', 
                    fontWeight: 700, 
                    fontSize: 16, 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '10px 32px', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
                  }}
                >
                  Save
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                style={{ 
                  background: '#fedb71', 
                  color: '#222', 
                  fontWeight: 700, 
                  fontSize: 16, 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '10px 32px', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
                }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Product Search Modal */}
      <Dialog open={showProductSearch} onClose={() => { setShowProductSearch(false); setSelectedCategory(null); setProductSearchTerm(''); }} maxWidth="lg" fullWidth>
        <DialogTitle style={{ background: '#F3C13A', color: '#222', fontWeight: 700 }}>
          {selectedCategory ? `${selectedCategory.name || 'Products'} - Products & Services` : 'Select Category'}
          <IconButton onClick={() => { setShowProductSearch(false); setSelectedCategory(null); setProductSearchTerm(''); }} style={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ padding: 24, background: '#fafafa', minHeight: 500 }}>
          {!selectedCategory ? (
            /* Category Selection - Grid Layout */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {categories.map((category) => {
                console.log('Rendering category:', category);
                return (
                <div
                  key={category._id}
                  onClick={() => {
                    console.log('Selected category:', category);
                    console.log('Available products:', availableProducts);
                    console.log('Products for this category:', availableProducts.filter(p => p.category === category._id));
                    setSelectedCategory(category);
                  }}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '2px solid #e0e0e0',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F3C13A';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(243,193,58,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  {category.image && (
                    <img src={category.image} alt={category.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#222', marginBottom: 8 }}>{category.name}</div>
                    {category.description && (
                      <div style={{ color: '#666', fontSize: 14, lineHeight: 1.4 }}>{category.description}</div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            /* Product Selection - Grid Layout */
            <>
              <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={() => { setSelectedCategory(null); setProductSearchTerm(''); }}
                  style={{
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  ← Back
                </button>
                <input
                  type="text"
                  placeholder="Search products/services..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    fontSize: '15px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    background: 'white'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, maxHeight: 450, overflowY: 'auto', paddingRight: 8 }}>
                {availableProducts
                  .filter(p => p.title?.toLowerCase().includes(productSearchTerm.toLowerCase()))
                  .map((product) => (
                    <div
                      key={product._id}
                      onClick={() => {
                        const newProduct = {
                          image: product.image,
                          title: product.title,
                          price: product.price,
                          description: product.description || '',
                          additionals: product.additionals || []
                        };
                        setEditData(prev => ({
                          ...prev,
                          products: [...(prev.products || []), newProduct]
                        }));
                        setShowProductSearch(false);
                        setSelectedCategory(null);
                        setProductSearchTerm('');
                      }}
                      style={{
                        background: 'white',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid #e0e0e0',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#F3C13A';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(243,193,58,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                      }}
                    >
                      {product.image && (
                        <img src={product.image} alt={product.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#222', minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</div>
                        <div style={{ color: '#F3C13A', fontSize: 16, fontWeight: 700 }}>₱{product.price}</div>
                      </div>
                    </div>
                  ))}
              </div>
              {availableProducts.filter(p => p.title?.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 16 }}>
                  {productSearchTerm ? `No products found matching "${productSearchTerm}"` : 'No products available in this category'}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProductDetail} onClose={() => setSelectedProductDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle style={{ background: '#F3C13A', color: '#222', fontWeight: 700 }}>
          Product/Service Details
          <IconButton onClick={() => setSelectedProductDetail(null)} style={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ padding: 20, background: 'white' }}>
          {selectedProductDetail && (
            <>
              {selectedProductDetail.image && (
                <img src={selectedProductDetail.image} alt={selectedProductDetail.title} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
              )}
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: '#222' }}>{selectedProductDetail.title}</div>
              <div style={{ fontSize: 18, color: '#F3C13A', fontWeight: 600, marginBottom: 16 }}>PHP {selectedProductDetail.price}</div>
              {selectedProductDetail.description && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#222' }}>Description:</div>
                  <div style={{ color: '#666', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedProductDetail.description}</div>
                </div>
              )}
              {selectedProductDetail.additionals && selectedProductDetail.additionals.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#222' }}>Additional Options:</div>
                  {selectedProductDetail.additionals.map((add, idx) => (
                    <div key={idx} style={{ padding: '8px', background: '#f5f5f5', borderRadius: 6, marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>{add.title}</div>
                      <div style={{ fontSize: 14, color: '#F3C13A', fontWeight: 600 }}>PHP {add.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
