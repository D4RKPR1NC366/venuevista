
import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Paper, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import './booking-description.css';

export default function BookingDescription({ open, onClose, booking }) {
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
  const eventTypes = ['Birthday', 'Wedding', 'Corporate', 'Anniversary', 'Other'];
  const paymentModes = ['Cash', 'Bank Transfer', 'GCash'];

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

  // Handle booking data updates
  React.useEffect(() => {
    if (booking) {
      // Initialize payment details from booking data
      setPaymentDetails(prev => ({
        ...prev,
        modeOfPayment: booking.paymentMode || '',
        discountType: booking.discountType || '',
        subTotal: booking.subTotal || 0,
        discount: booking.discount || 0,
        finalTotal: booking.totalPrice || 0
      }));

      setEditData(prev => ({
        ...prev,
        ...booking,
        date: formatDate(booking.date),
        eventVenue: booking.eventVenue || prev.eventVenue,
        products: booking.products || prev.products,
        paymentMode: booking.paymentMode || prev.paymentMode,
        discountType: booking.discountType || prev.discountType,
        discount: booking.discount || prev.discount,
        totalPrice: booking.totalPrice || prev.totalPrice
      }));
    }
  }, [booking]);

  // Effect to log state changes (for debugging)
  React.useEffect(() => {
    console.log('Current editData:', editData);
    console.log('Is editing:', isEditing);
    console.log('Formatted date for input:', formatDateForInput(editData.date));
  }, [editData, isEditing]);

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
    const discountPercentage = discountType === '10' ? 0.10 : discountType === '20' ? 0.20 : 0;
    const discountAmount = subTotal * discountPercentage;
    const finalTotal = subTotal - discountAmount;

    return {
      subTotal,
      discount: discountAmount,
      finalTotal
    };
  };

  const handlePaymentDetailsSubmit = () => {
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

  const handleSave = async () => {
    try {
      // Ensure we have an ID to work with
      const bookingId = editData._id || editData.id;
      if (!bookingId) {
        throw new Error('No booking ID found');
      }

      // Parse and format the date properly
      let formattedDate;
      if (editData.date) {
        // If date is in DD/MM/YYYY format, parse it correctly
        if (editData.date.includes('/')) {
          const [day, month, year] = editData.date.split('/').map(Number);
          const dateObj = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid timezone issues
          formattedDate = dateObj.toISOString();
        } else {
          // Try to parse as is if it's in a different format
          const dateObj = new Date(editData.date);
          if (!isNaN(dateObj)) {
            formattedDate = dateObj.toISOString();
          }
        }
      }

      // Recalculate totals based on current products and discount
      const totals = calculateTotal(editData.products, null, editData.discountType || '');

      // Prepare the data for saving
      const dataToSave = {
        ...editData,
        eventVenue: editData.eventVenue || `${editData.barangayValue || ''}, ${editData.cityValue || ''}, ${editData.provinceValue || ''}`.trim(),
        date: formattedDate || editData.date,
        // Payment related fields
        paymentMode: editData.paymentMode || '',
        discountType: editData.discountType || '',
        discount: totals.discount || 0,
        subTotal: totals.subTotal || 0,
        totalPrice: totals.finalTotal || 0,
        // Ensure other fields have fallback values
        name: editData.name || '',
        contact: editData.contact || '',
        email: editData.email || '',
        eventType: editData.eventType || '',
        guestCount: editData.guestCount || 0,
        products: editData.products || [],
        specialRequest: editData.specialRequest || '',
        outsidePH: editData.outsidePH || ''
      };

      console.log('Saving booking:', dataToSave);

      const response = await fetch(`http://localhost:5051/api/bookings/${bookingId}`, {
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

        // Force the parent to update with the latest data
        if (onClose) {
          // Pass the updated data back
          onClose(mergedData);
        }

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
      className="booking-description-modal"
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
      <DialogContent>
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
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Discount:</span>
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
                      value={editData.discountType || ''}
                      onChange={(e) => {
                        const discountType = e.target.value;
                        const totals = calculateTotal(editData.products, null, discountType);
                        setEditData(prev => ({
                          ...prev,
                          discountType,
                          discount: totals.discount,
                          totalPrice: totals.finalTotal
                        }));
                      }}
                    >
                      <option value="">No Discount</option>
                      <option value="10">10% Discount</option>
                      <option value="20">20% Discount</option>
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
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Discount Applied:</span> <span style={{ color: '#222' }}>{editData.discountType ? `${editData.discountType}%` : 'None'}</span></div>
                  {editData.discount > 0 && (
                    <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Discount Amount:</span> <span style={{ color: '#e53935' }}>- PHP {editData.discount}</span></div>
                  )}
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Total Price:</span> <span style={{ color: '#222', fontWeight: 'bold' }}>PHP {editData.totalPrice || ''}</span></div>
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
                        <option key={type} value={type}>{type}</option>
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
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Guest Count:</span> <span style={{ color: '#222' }}>{editData.guestCount || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Appointment Method:</span> <span style={{ color: '#222' }}>{editData.outsidePH === 'yes' ? 'Face to Face' : editData.outsidePH === 'no' ? 'Virtual/Online' : 'Not specified'}</span></div>
                </>
              )}
            </div>
          </div>
          {/* Services and Products Availed */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 14, color: '#222' }}>Services and Products Availed</div>
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    {item.image && (
                      <img src={item.image} alt={item.title} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{item.title}</div>
                      {item.price && <div style={{ color: '#222', fontWeight: 300, fontSize: 14 }}>PHP {item.price}</div>}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => {
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
          {/* Edit/Save/Cancel/Payment Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 12, alignItems: 'center' }}>
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(booking || {}); // Reset changes
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
                    PaperProps={{
                      style: {
                        borderRadius: 16,
                        padding: 24,
                        minWidth: 400
                      }
                    }}
                  >
                    <DialogTitle sx={{ pb: 2, fontWeight: 800, fontSize: 24, color: '#222' }}>
                      Payment Details
                    </DialogTitle>
                    <DialogContent>
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
                          onClick={handlePaymentDetailsSubmit}
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
    </Dialog>
  );
}
