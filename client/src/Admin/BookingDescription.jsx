
import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './booking-description.css';

export default function BookingDescription({ open, onClose, booking }) {
  const [editData, setEditData] = React.useState(booking || {});
  const [isEditing, setIsEditing] = React.useState(false);
  const [locations, setLocations] = React.useState([]);
  const [venueDropdown, setVenueDropdown] = React.useState({ province: '', city: '', barangay: '' });
  const eventTypes = ['Birthday', 'Wedding', 'Corporate', 'Anniversary', 'Other'];

  React.useEffect(() => {
    // Load locations from local JSON
    import('../data/ph_locations.json').then(mod => setLocations(mod.default || mod));
  }, []);

  React.useEffect(() => {
    setEditData(booking || {});
    setIsEditing(false);
  }, [booking]);

  // Update venueDropdown when editData changes (for edit mode)
  React.useEffect(() => {
    if (isEditing && editData.eventVenue) {
      // Try to parse venue string: "General Prim East, Bangar, La Union"
      const parts = editData.eventVenue.split(',').map(s => s.trim());
      setVenueDropdown({
        barangay: parts[0] || '',
        city: parts[1] || '',
        province: parts[2] || '',
      });
    }
  }, [isEditing, editData.eventVenue]);

  // Handle dropdown changes
  const handleVenueChange = (field) => (e) => {
    const value = e.target.value;
    setVenueDropdown(prev => ({ ...prev, [field]: value }));
    // Update eventVenue string in editData
    let newVenue = '';
    if (field === 'province') {
      newVenue = `${venueDropdown.barangay}, ${venueDropdown.city}, ${value}`;
    } else if (field === 'city') {
      newVenue = `${venueDropdown.barangay}, ${value}, ${venueDropdown.province}`;
    } else {
      newVenue = `${value}, ${venueDropdown.city}, ${venueDropdown.province}`;
    }
    setEditData({ ...editData, eventVenue: newVenue });
  };

  const handleEventTypeChange = (e) => {
    setEditData({ ...editData, eventType: e.target.value });
  };

  // Helper for date formatting
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      // Try to format ISO string
      const d = new Date(date);
      return isNaN(d) ? date : d.toLocaleDateString();
    }
    if (date.$d) return new Date(date.$d).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const handleChange = (field) => (e) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleSave = async () => {
    try {
      // Replace URL with your actual backend endpoint
      const response = await fetch(`/api/bookings/${editData._id || editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        setIsEditing(false);
        onClose();
      } else {
        alert('Failed to save changes');
      }
    } catch (err) {
      alert('Error saving changes');
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
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Total Price:</span>
                    <input style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.totalPrice || ''} onChange={handleChange('totalPrice')} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Name:</span> <span style={{ color: '#222' }}>{editData.name || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Contact Number:</span> <span style={{ color: '#222' }}>{editData.contact || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Email Address:</span> <span style={{ color: '#222' }}>{editData.email || ''}</span></div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}><span style={{ fontWeight: 700, color: '#000000ff' }}>Total Price:</span> <span style={{ color: '#222' }}>PHP {editData.totalPrice || ''}</span></div>
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
                    <input type="date" style={{ marginLeft: 8, color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={editData.date ? (editData.date.length === 10 ? editData.date : new Date(editData.date).toISOString().slice(0,10)) : ''} onChange={handleChange('date')} />
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 15 }}>
                    <span style={{ fontWeight: 700, color: '#000000ff' }}>Event Venue:</span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <select style={{ color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={venueDropdown.province} onChange={handleVenueChange('province')}>
                        <option value="">Province</option>
                        {locations.map(loc => (
                          <option key={loc.province_name} value={loc.province_name}>{loc.province_name}</option>
                        ))}
                      </select>
                      <select style={{ color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={venueDropdown.city} onChange={handleVenueChange('city')}>
                        <option value="">City/Municipality</option>
                        {locations
                          .filter(l => Array.isArray(l.municipalities))
                          .flatMap(l => l.municipalities)
                          .filter(m => m && m.municipality_name)
                          .map(m => (
                            <option key={m.municipality_name} value={m.municipality_name}>{m.municipality_name}</option>
                          ))}
                      </select>
                      <select style={{ color: '#222', fontSize: 15, borderRadius: 4, border: '1px solid #ccc', padding: '2px 8px', background: 'transparent' }} value={venueDropdown.barangay} onChange={handleVenueChange('barangay')}>
                        <option value="">Barangay</option>
                        {locations
                          .filter(l => Array.isArray(l.municipalities))
                          .flatMap(l => l.municipalities)
                          .filter(m => Array.isArray(m.barangays))
                          .flatMap(m => m.barangays)
                          .filter(b => b)
                          .map(b => (
                            <option key={b} value={b}>{b}</option>
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
          {/* Edit/Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
            {isEditing ? (
              <button onClick={handleSave} style={{ background: '#fedb71', color: '#222', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 8, padding: '10px 32px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                Save
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} style={{ background: '#fedb71', color: '#222', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 8, padding: '10px 32px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                Edit
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
