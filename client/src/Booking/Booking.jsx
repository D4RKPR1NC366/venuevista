import React, { useState, useEffect } from "react";
import api from '../services/api';
// PSGC API endpoints
const PSGC_API = 'https://psgc.gitlab.io/api';
import { useNavigate } from "react-router-dom";
import "./booking.css";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TopBar from '../Home/TopBar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

const Booking = () => {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    eventType: '',
    eventLocation: '',
    eventVenue: '',
    specialRequest: '',
    products: [], // will hold selected products/services
    guestCount: '',
    totalPrice: '',
    province: '',
    city: '',
    barangay: '',
    date: null,
    outsidePH: '',
  });

  const [provinces, setProvinces] = useState([]);
  const [promos, setPromos] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [bookingsPerDay, setBookingsPerDay] = useState({});
  const [eventTypes, setEventTypes] = useState([]);

  // Fetch event types from API on mount
  useEffect(() => {
    api.get('/event-types')
      .then(res => {
        // Map to array of names (strings)
        const types = Array.isArray(res.data)
          ? res.data.map(e => typeof e === 'string' ? e : e.name)
          : [];
        setEventTypes(types);
      })
      .catch(() => setEventTypes([]));
  }, []);
  
  // Helper to check promo status
  const isPromoActive = (promo) => {
    const now = dayjs();
    const start = promo.validFrom ? dayjs(promo.validFrom) : null;
    const end = promo.validUntil ? dayjs(promo.validUntil) : null;
    return start && end && now.isAfter(start) && now.isBefore(end.add(1, 'day'));
  };
  
  // Fetch promos on mount
  useEffect(() => {
    api.get('/promos')
      .then(res => setPromos(res.data))
      .catch(() => setPromos([]));
  }, []);
  
  // Fetch only active bookings (pending and approved) to count bookings per day
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const [pending, approved] = await Promise.all([
          fetch('/api/bookings/pending').then(r => r.json()),
          fetch('/api/bookings/approved').then(r => r.json())
        ]);
        
        // Only count pending and approved bookings, not finished ones
        const activeBookings = [...pending, ...approved];
        const countByDate = {};
        
        activeBookings.forEach(booking => {
          if (booking.date) {
            const dateStr = dayjs(booking.date).format('YYYY-MM-DD');
            countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
          }
        });
        
        setBookingsPerDay(countByDate);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    
    fetchBookings();
  }, []);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState({ provinces: false, cities: false, barangays: false });
  // Load provinces on mount
  useEffect(() => {
    setLoading(l => ({ ...l, provinces: true }));
    fetch(`${PSGC_API}/provinces/`)
      .then(res => res.json())
      .then(data => setProvinces(data))
      .finally(() => setLoading(l => ({ ...l, provinces: false })));
  }, []);

  // Load cities/municipalities when province changes
  useEffect(() => {
    if (form.province) {
      setLoading(l => ({ ...l, cities: true }));
      setCities([]);
      setBarangays([]);
      setForm(f => ({ ...f, city: '', barangay: '' }));
      fetch(`${PSGC_API}/provinces/${form.province}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => setCities(data))
        .finally(() => setLoading(l => ({ ...l, cities: false })));
    } else {
      setCities([]);
      setBarangays([]);
    }
  }, [form.province]);

  // Load barangays when city changes
  useEffect(() => {
    if (form.city) {
      setLoading(l => ({ ...l, barangays: true }));
      setBarangays([]);
      setForm(f => ({ ...f, barangay: '' }));
      fetch(`${PSGC_API}/cities-municipalities/${form.city}/barangays/`)
        .then(res => res.json())
        .then(data => setBarangays(data))
        .finally(() => setLoading(l => ({ ...l, barangays: false })));
    } else {
      setBarangays([]);
    }
  }, [form.city]);

  // On mount, load selected products/services from backend cart (with userEmail)
  React.useEffect(() => {
    // Get userEmail from localStorage user object (same as cart logic)
    let userEmail = null;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      userEmail = user && user.email;
    } catch {}
    if (!userEmail) {
      setForm(f => ({ ...f, products: [] }));
      return;
    }
    fetch(`/api/cart?userEmail=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        // include additionals from cart items along with product
        const products = Array.isArray(data) ? data.map(item => {
          // item.product is the base product, item.additionals may exist
          return { ...(item.product || {}), __cart_additionals: Array.isArray(item.additionals) ? item.additionals : [] };
        }) : [];
        setForm(f => ({ ...f, products }));
      })
      .catch(() => setForm(f => ({ ...f, products: [] })));
  }, []);
  const navigate = useNavigate();

  // TODO: Wire up form state to inputs if needed



  // Compute total price from products and promo
  const computeTotalPrice = () => {
    if (!form.products || !Array.isArray(form.products)) return 0;
    let sum = form.products.reduce((sum, item) => {
      const base = Number(item.price) || 0;
      const adds = Array.isArray(item.__cart_additionals) ? item.__cart_additionals.reduce((a, add) => a + (Number(add.price) || 0), 0) : 0;
      return sum + base + adds;
    }, 0);
    if (selectedPromoId) {
      const promo = promos.find(p => p._id === selectedPromoId);
      if (promo && promo.discountValue) {
        sum = sum - (sum * (promo.discountValue / 100));
      }
    }
    return Math.round(sum);
  };

  // Get event venue as a string from selected location
  const getEventVenue = () => {
    // Find names from codes
    const provinceName = provinces.find(p => p.code === form.province)?.name || '';
    const cityName = cities.find(c => c.code === form.city)?.name || '';
    const barangayName = barangays.find(b => b.code === form.barangay)?.name || '';
    // Only show non-empty parts
    return [barangayName, cityName, provinceName].filter(Boolean).join(', ');
  };

  // Validation: required fields
  const isFormValid = () => {
    return (
      form.date &&
      form.province &&
      form.city &&
      form.barangay &&
      form.eventType &&
      form.guestCount
    );
  };

  const handleNext = () => {
    if (!isFormValid()) {
      // Optionally show a message here
      return;
    }
    // Add computed totalPrice, eventVenue, and promo info to booking object
    const promo = promos.find(p => p._id === selectedPromoId);
    const booking = {
      ...form,
      totalPrice: computeTotalPrice(),
      eventVenue: getEventVenue(),
      outsidePH: form.outsidePH || '',
      promoId: promo ? promo._id : '',
      promoTitle: promo ? promo.title : '',
      promoDiscount: promo ? promo.discountValue : '',
    };
    navigate('/booking-summary', { state: { booking } });
  };

  return (
    <div className="booking-root">
      <TopBar />
      <div className="booking-header">
         <p className="review-title-script booking-title">Book Now</p>
      </div>
      <div className="booking-center-container">
        <div className="booking-main-row" style={{ gap: 0 }}>
          <div className="booking-calendar-box" style={{ width: 300, maxWidth: 300 }}>
            <h3 className="booking-calendar-title">Choose your event date</h3>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={form.date}
                onChange={(newValue) => setForm(f => ({ ...f, date: newValue }))}
                minDate={dayjs().startOf('day')}
                shouldDisableDate={(date) => {
                  const dateStr = dayjs(date).format('YYYY-MM-DD');
                  const count = bookingsPerDay[dateStr] || 0;
                  return count >= 4; // Disable if 4 or more bookings on this date
                }}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                  calendarHeader: { sx: { '& .MuiPickersCalendarHeader-label': { color: '#111' }, '& .MuiPickersArrowSwitcher-button': { color: '#111' } } },
                  year: {
                    sx: {
                      color: '#111 !important',
                      '&.Mui-selected': { color: '#111 !important', backgroundColor: '#eee' },
                      '&.Mui-disabled': { color: '#111 !important', opacity: 0.4 },
                      '&:hover': { backgroundColor: '#000000ff' },
                    }
                  },
                  actionBar: { actions: [] }
                }}
                showToolbar={false}
              />
            </LocalizationProvider>
          </div>
          <div className="booking-form-box" style={{ width: 400, maxWidth: 400 }}>
            <div className="booking-form-row">
              <div className="booking-form-col">
                <div className={`booking-label ${!form.province ? 'booking-label-highlight' : ''}`}>Event Venue</div>
                <div className="booking-field">
                  <FormControl fullWidth size="small" style={{ marginBottom: 12 }}>
                    <InputLabel id="province-label">Province</InputLabel>
                    <Select
                      labelId="province-label"
                      value={form.province} 
                      label="Province"
                      onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                      MenuProps={{ disablePortal: false, style: { zIndex: 2000 } }}
                      disabled={loading.provinces}
                    >
                      <MenuItem value="" style={{ fontWeight: 500, color: '#888', fontSize: 16 }}>Province</MenuItem>
                      {provinces.map(p => (
                        <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" style={{ marginBottom: 12 }} disabled={!form.province || loading.cities}>
                    <InputLabel id="city-label">City/Municipality</InputLabel>
                    <Select
                      labelId="city-label"
                      value={form.city}
                      label="City/Municipality"
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      MenuProps={{ disablePortal: false, style: { zIndex: 2000 } }}
                    >
                      <MenuItem value="" style={{ fontWeight: 500, color: '#888', fontSize: 16 }}>City/Municipality</MenuItem>
                      {cities.map((c, idx) => (
                        <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" disabled={!form.city || loading.barangays}>
                    <InputLabel id="barangay-label">Barangay</InputLabel>
                    <Select
                      labelId="barangay-label"
                      value={form.barangay}
                      label="Barangay"
                      onChange={e => setForm(f => ({ ...f, barangay: e.target.value }))}
                      MenuProps={{ disablePortal: false, style: { zIndex: 2000 } }}
                    >
                      <MenuItem value="" style={{ fontWeight: 500, color: '#888', fontSize: 16 }}>Barangay</MenuItem>
                      {barangays.map((b, idx) => (
                        <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
              <div className="booking-form-col">
                <div className={`booking-label ${!form.eventType ? 'booking-label-highlight' : ''}`}>Event Type</div>
                <div className="booking-field">
                  <FormControl fullWidth size="small">
                    <InputLabel id="event-type-label">Choose Event Type</InputLabel>
                    <Select
                      labelId="event-type-label"
                      label="Event Type"
                      variant="outlined"
                      size="small"
                      value={form.eventType}
                      onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                    >
                      <MenuItem value="">Choose Event Type</MenuItem>
                      {eventTypes.map(type => (
                        <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className={`booking-label booking-label-guest ${!form.guestCount ? 'booking-label-highlight' : ''}`}>Guest Count</div>
                <TextField
                  fullWidth
                  type="number"
                  label="Enter Guest Count"
                  variant="outlined"
                  size="small"
                  value={form.guestCount}
                  onChange={e => setForm(f => ({ ...f, guestCount: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
              </div>
            </div>
           
            <div className="booking-field booking-method-row">
              <FormControl component="fieldset" fullWidth>
                <label className="booking-method-label">Choose your Appointment/ Meeting Method</label>
                <RadioGroup
                  row
                  aria-label="Booking from outside the Philippines?"
                  name="outsidePH"
                  value={form.outsidePH}
                  onChange={e => setForm(f => ({ ...f, outsidePH: e.target.value }))}
                  className="booking-method-radio"
                >
                  <FormControlLabel value="yes" control={<Radio color="primary" />} label="Face to Face" />
                  <FormControlLabel value="no" control={<Radio color="primary" />} label="Virtual/Online" />
                </RadioGroup>
              </FormControl>
            </div>
            {/* Special Request field moved to services card below */}
          </div>
        </div>
        <div className="booking-services-box">
          <div className="booking-services-header">
            <h3 className="booking-services-title">Services and Products Availed</h3>
            {form.products && form.products.length > 0 && (
              <IconButton
                aria-label="Delete all products/services"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all products/services from this list?')) {
                    setForm(f => ({ ...f, products: [] }));
                  }
                }}
                className="booking-delete-all-btn"
                title="Delete all products/services"
                disableFocusRipple
                disableRipple
              >
                <DeleteIcon />
                <span className="booking-delete-all-text">Delete All</span>
              </IconButton>
            )}
          </div>
          {/* Show selected products/services from cart */}
          {form.products && form.products.length > 0 ? (
            <div className="booking-products-list">
              <div className="booking-products-grid">
                {form.products.map((item, idx) => (
                  <div key={idx} className="booking-product-item">
                    {(item.images?.[0] || item.image) && (
                      <img src={item.images?.[0] || item.image} alt={item.title} className="booking-product-img" />
                    )}
                    <div className="booking-product-info">
                      <div className="booking-product-title">{item.title}</div>
                      {item.price && <div className="booking-product-price">PHP {item.price}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {/* New: Selected Additionals Section */}
              <div className="booking-additionals-section">
                <div className="booking-additionals-title">Selected Additionals</div>
                {(() => {
                  // gather all additionals across products
                  const allAdds = [];
                  form.products.forEach((p, i) => {
                    if (Array.isArray(p.__cart_additionals) && p.__cart_additionals.length) {
                      p.__cart_additionals.forEach(add => allAdds.push({ productIndex: i, ...add }));
                    }
                  });
                  if (allAdds.length === 0) return <div className="booking-additionals-empty">No additionals selected.</div>;
                  return (
                    <div>
                      <div className="booking-additionals-grid">
                        {allAdds.map((add, aidx) => (
                          <div key={add._id || add.title || aidx} className="booking-additional-item">
                            <div className="booking-additional-title">{add.title}</div>
                            {add.price ? <div className="booking-additional-price">PHP {add.price}</div> : <div className="booking-additional-price">PHP 0</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="booking-products-empty">No products/services selected yet.</div>
          )}
          <div className="booking-field booking-special-request-row">
            <TextField
              className="booking-special-request"
              fullWidth
              multiline
              minRows={5}
              label="Enter your Special Request"
              placeholder="Type any special requests here (special service, collaboration to other service provider, host and etc."
              variant="outlined"
              size="small"
              value={form.specialRequest}
              onChange={e => setForm(f => ({ ...f, specialRequest: e.target.value }))}
            />
          </div>
        </div>
      </div>
      {/* Confirm Button */}
      <div className="booking-confirm-row">
        <button
          className={`booking-confirm-btn${isFormValid() ? '' : ' booking-confirm-btn-disabled'}`}
          onClick={handleNext}
          disabled={!isFormValid()}
        >
          Confirm
        </button>
        {selectedPromoId && (
          <div className="booking-promo-applied">
            Promo Applied: {promos.find(p => p._id === selectedPromoId)?.title} ({promos.find(p => p._id === selectedPromoId)?.discountValue}% OFF)
          </div>
        )}
      </div>
    </div>
  );

};
export default Booking;
