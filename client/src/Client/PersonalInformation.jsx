import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import { TextField, Button, Divider, Switch, FormControlLabel } from '@mui/material';
import { users } from '../services/api';
import { toast } from 'react-toastify';
import MFASettings from '../Authentication/MFASettings';
import PasswordConfirmationModal from './PasswordConfirmationModal';
import LocationSelector from '../components/LocationSelector';

import './personal-information.css';

const PersonalInformation = () => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = React.useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [user, setUser] = React.useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    contact: '',
    password: '',
    role: '',
    isAvailable: true,
    companyName: '',
    eventTypes: [],
    branchContacts: []
  });
  const [availableEventTypes, setAvailableEventTypes] = React.useState([]);

  // Generic handler for all fields
  const handleChange = (field) => (event) => {
    setUser((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile directly from database
      const response = await users.getProfile();
      console.log('Fetched user profile response:', response);
      
      if (response && response.data) {
        const userData = response.data;
        console.log('User data from database:', userData);
        console.log('isAvailable value:', userData.isAvailable, 'Type:', typeof userData.isAvailable);
        
        // Determine user role - if they have companyName, they're a supplier
        const userRole = userData.role || (userData.companyName ? 'supplier' : 'customer');
        
        const newUserState = {
          firstName: userData.firstName || '',
          middleName: userData.middleName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          contact: userData.contact || '',
          password: '********',
          role: userRole,
          isAvailable: userData.isAvailable !== undefined ? userData.isAvailable : true,
          companyName: userData.companyName || '',
          eventTypes: userData.eventTypes || [],
          branchContacts: userData.branchContacts || []
        };
        
        console.log('Setting user state to:', newUserState);
        setUser(newUserState);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile from database');
    }
  };

  const handleAvailabilityToggle = async (newValue) => {
    try {
      console.log('Toggling availability to:', newValue);
      console.log('User email:', user.email);
      
      const response = await fetch('/api/suppliers/availability', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          email: user.email, 
          isAvailable: newValue 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to update availability status');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      toast.success(`You are now ${data.isAvailable ? 'available' : 'unavailable'} for bookings`);
      
      // Refetch profile to ensure data is in sync with database
      await fetchUserProfile();
      console.log('Profile refetched successfully');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability status');
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!user.firstName || !user.lastName || !user.email || !user.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const updateData = {
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        contact: user.contact
      };
      // Add supplier-specific fields if user has companyName (is a supplier)
      if (user.companyName) {
        updateData.companyName = user.companyName;
        updateData.eventTypes = (user.eventTypes || []).map(et => {
          const id = typeof et === 'string' ? et : (et._id ? String(et._id) : et);
          return String(id);
        });
        updateData.branchContacts = user.branchContacts || [];
        console.log('Sending event types:', updateData.eventTypes);
        console.log('Sending branch contacts:', updateData.branchContacts);
      } else {
        // Add customer location fields if user is a customer (no companyName)
        updateData.province = user.location?.province || '';
        updateData.city = user.location?.city || '';
        updateData.barangay = user.location?.barangay || '';
        console.log('Sending customer location:', { province: updateData.province, city: updateData.city, barangay: updateData.barangay });
      }
      console.log('Update data being sent:', updateData);
      const response = await users.updateProfile(updateData);
      console.log('Update response:', response);
      
      if (response && response.data) {
        const userData = response.data;
        const userRole = userData.role || (userData.companyName ? 'supplier' : 'customer');
        
        console.log('Response eventTypes:', userData.eventTypes);
        
        const newUserState = {
          firstName: userData.firstName || '',
          middleName: userData.middleName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          contact: userData.contact || '',
          password: '********',
          role: userRole,
          isAvailable: userData.isAvailable !== undefined ? userData.isAvailable : true,
          companyName: userData.companyName || '',
          eventTypes: userData.eventTypes || [],
          branchContacts: userData.branchContacts || []
        };
        
        console.log('New user state after save:', newUserState);
        setUser(newUserState);

        setEditMode(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  React.useEffect(() => {
    // Fetch available event types first, then fetch user profile
    fetch('/api/event-types')
      .then(res => res.json())
      .then(data => {
        setAvailableEventTypes(data);
        // Fetch profile after event types are loaded
        fetchUserProfile();
      })
      .catch(err => {
        console.error('Failed to fetch event types:', err);
        // Still fetch profile even if event types fail
        fetchUserProfile();
      });
  }, []);

  return (
    <div className="personal-info-page">
      <ClientSidebar />
  <div className="client-main-content client-personal-info" style={{ background: '#fff', border: 'none', boxShadow: 'none', borderRadius: 0 }}>
        <div className="personal-info-header">
          <span className="personal-info-title" style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 18, color: '#333', display: 'block', marginLeft: -25, marginTop: -20 }}>Profile</span>
          <div className="personal-info-buttons" style={{ display: 'flex', gap: '10px' }}>
            {!editMode ? (
              <Button 
                className="personal-info-btn" 
                variant="contained" 
                style={{ 
                  background: '#F3C13A', 
                  color: '#222', 
                  width: 90, 
                  fontWeight: 'bold', 
                  fontSize: 16, 
                  height: 28, 
                  minHeight: 28, 
                  padding: '8px 0', 
                  borderRadius: 8 
                }} 
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  className="personal-info-btn" 
                  variant="contained" 
                  style={{ 
                    background: '#F3C13A', 
                    color: '#222', 
                    width: 90, 
                    fontWeight: 'bold', 
                    fontSize: 16, 
                    height: 28, 
                    minHeight: 28, 
                    padding: '8px 0', 
                    borderRadius: 8 
                  }} 
                  onClick={handleSubmit}
                >
                  Save
                </Button>
                <Button 
                  className="personal-info-btn" 
                  variant="outlined" 
                  style={{ 
                    borderColor: '#F3C13A', 
                    color: '#222', 
                    width: 90, 
                    fontWeight: 'bold', 
                    fontSize: 16, 
                    height: 28, 
                    minHeight: 28, 
                    padding: '8px 0', 
                    borderRadius: 8 
                  }} 
                  onClick={() => {
                    setEditMode(false);
                    fetchUserProfile(); // Reset to original data
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Availability Toggle for Suppliers */}
        {user.role === 'supplier' && (
          <div style={{ 
            background: '#f9f9f9', 
            padding: '16px 20px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            border: '1px solid #e0e0e0'
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={user.isAvailable === true}
                  onChange={(e) => handleAvailabilityToggle(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4CAF50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
              }
              label={
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {user.isAvailable ? 'Available for Bookings' : 'Unavailable for Bookings'}
                </span>
              }
            />
            <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666', marginLeft: '48px' }}>
              {user.isAvailable 
                ? 'You are currently accepting event notifications from admin.' 
                : 'You will not receive event notifications while unavailable.'}
            </div>
          </div>
        )}

        <form className="personal-info-form" noValidate autoComplete="off">
          {!editMode ? (
            <div className="personal-info-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* 2-column grid, each row is a grid with 2 columns: label and value */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 64,
                columnGap: '120px' // extra gap between columns
              }}>
                {/* Column 1 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="firstName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>First Name:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.firstName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="lastName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Last Name:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.lastName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="phone" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Phone Number:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="password" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Password:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>&#8226;&#8226;&#8226;</span>
                  </div>
                  {user.role === 'supplier' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                        <label htmlFor="companyName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Company Name:</label>
                        <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.companyName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                        <label htmlFor="eventTypes" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Event Types:</label>
                        <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>
                          {user.eventTypes && user.eventTypes.length > 0 ? (
                            user.eventTypes.map((et, idx) => {
                              // Extract the ID from the event type (could be string or object)
                              const eventTypeId = typeof et === 'string' ? et : (et._id || et);
                              // Find the matching event type in availableEventTypes
                              const eventTypeObj = availableEventTypes.find(aet => aet._id === eventTypeId);
                              const eventTypeName = eventTypeObj?.name || (typeof et === 'object' && et.name) || 'Unknown';
                              
                              return (
                                <span key={idx} style={{ 
                                  display: 'inline-block', 
                                  background: '#F3C13A', 
                                  color: '#000', 
                                  padding: '4px 12px', 
                                  borderRadius: 4, 
                                  fontSize: '0.9rem',
                                  marginRight: 6,
                                  marginBottom: 4
                                }}>
                                  {eventTypeName}
                                </span>
                              );
                            })
                          ) : 'No event types selected'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                        <label className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Branch Contacts:</label>
                        <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>
                          {user.branchContacts && user.branchContacts.length > 0 ? (
                            user.branchContacts.map((branch) => (
                              <span key={branch} style={{
                                display: 'inline-block',
                                background: '#F3C13A',
                                color: '#000',
                                padding: '4px 12px',
                                borderRadius: 4,
                                fontSize: '0.9rem',
                                marginRight: 6,
                                marginBottom: 4
                              }}>{branch}</span>
                            ))
                          ) : 'No branches selected'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {/* Column 2 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="middleName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Middle Name:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.middleName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="email" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Email address:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="contact" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Contact:</label>
                    <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>{user.contact}</span>
                  </div>
                  {/* Customer Location display */}
                  {user.role === 'customer' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                      <label className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Location:</label>
                      <span className="personal-info-value" style={{ fontWeight: 'normal', fontSize: '1.125rem', textAlign: 'left', marginLeft: 12 }}>
                        {user.location && (user.location.province || user.location.city || user.location.barangay)
                          ? `${user.location.barangay || 'N/A'}, ${user.location.city || 'N/A'}, ${user.location.province || 'N/A'}`
                          : 'No location set'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="personal-info-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 64,
                columnGap: '120px'
              }}>
                {/* Column 1 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="firstName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>First Name:</label>
                    <TextField 
                      id="firstName"
                      className="personal-info-field"
                      value={user.firstName || ''}
                      placeholder="Enter your first name"
                      margin="normal"
                      variant="outlined"
                      size="small"
                      fullWidth
                      onChange={handleChange('firstName')}
                      sx={{
                        marginLeft: 1.5,
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#ffffff',
                          height: '40px',
                          '& input': {
                            padding: '8px 12px',
                            fontSize: '1rem',
                            backgroundColor: '#ffffff',
                          },
                          '& fieldset': {
                            borderColor: '#ccc',
                            borderWidth: '1px',
                          },
                          '&:hover fieldset': {
                            borderColor: '#F3C13A',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F3C13A',
                            borderWidth: '2px',
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="lastName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Last Name:</label>
                    <TextField 
                      id="lastName"
                      className="personal-info-field"
                      value={user.lastName}
                      placeholder="Enter your last name"
                      margin="normal"
                      variant="outlined"
                      size="small"
                      fullWidth
                      onChange={handleChange('lastName')}
                      sx={{
                        marginLeft: 1.5,
                        background: '#fff',
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          height: 40,
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#F3C13A',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F3C13A',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="phone" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Phone Number:</label>
                    <TextField 
                      id="phone"
                      className="personal-info-field"
                      value={user.phone}
                      placeholder="Enter your phone number"
                      margin="normal"
                      variant="outlined"
                      size="small"
                      fullWidth
                      onChange={handleChange('phone')}
                      sx={{
                        marginLeft: 1.5,
                        background: '#fff',
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          height: 40,
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#F3C13A',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F3C13A',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="password" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Password:</label>
                    <Button
                      variant="contained"
                      onClick={() => setShowConfirmationModal(true)}
                      sx={{
                        marginLeft: 1.5,
                        backgroundColor: '#F3C13A',
                        color: '#222',
                        '&:hover': {
                          backgroundColor: '#daa520',
                        },
                        width: '200px'
                      }}
                    >
                      Change Password
                    </Button>
                  </div>
                  {user.role === 'supplier' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                        <label htmlFor="companyName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Company Name:</label>
                        <TextField 
                          id="companyName"
                          className="personal-info-field"
                          value={user.companyName}
                          placeholder="Enter company name"
                          margin="normal"
                          variant="outlined"
                          size="small"
                          fullWidth
                          onChange={handleChange('companyName')}
                          sx={{
                            marginLeft: 1.5,
                            background: '#fff',
                            borderRadius: 2,
                            fontSize: '1.1rem',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              fontSize: '1.1rem',
                              height: 40,
                              '& fieldset': {
                                borderColor: '#ccc',
                              },
                              '&:hover fieldset': {
                                borderColor: '#F3C13A',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#F3C13A',
                                borderWidth: 2,
                              },
                            },
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
                        <label htmlFor="eventTypes" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180, paddingTop: '12px' }}>Event Types:</label>
                        <div style={{ marginLeft: 12, flex: 1 }}>
                          {availableEventTypes.map((eventType) => (
                            <label key={eventType._id} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              marginRight: 16,
                              marginBottom: 8,
                              cursor: 'pointer',
                              fontSize: '1rem'
                            }}>
                              <input
                                type="checkbox"
                                checked={user.eventTypes.some(et => {
                                  const etId = typeof et === 'string' ? et : (et._id ? String(et._id) : et);
                                  return etId === String(eventType._id);
                                })}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setUser(prev => ({
                                    ...prev,
                                    eventTypes: checked
                                      ? [...prev.eventTypes, eventType._id]
                                      : prev.eventTypes.filter(et => {
                                          const etId = typeof et === 'string' ? et : (et._id ? String(et._id) : et);
                                          return etId !== String(eventType._id);
                                        })
                                  }));
                                }}
                                style={{ marginRight: 6, cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                              {eventType.name}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
                        <label className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180, paddingTop: '12px' }}>Branch Contacts:</label>
                        <div style={{ marginLeft: 12, flex: 1 }}>
                          {["Sta. Fe, Nueva Vizcaya", "La Trinidad, Benguet", "Maddela, Quirino"].map(branch => (
                            <label key={branch} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              marginRight: 16,
                              marginBottom: 8,
                              cursor: 'pointer',
                              fontSize: '1rem'
                            }}>
                              <input
                                type="checkbox"
                                checked={user.branchContacts?.includes(branch)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setUser(prev => ({
                                    ...prev,
                                    branchContacts: checked
                                      ? [...(prev.branchContacts || []), branch]
                                      : (prev.branchContacts || []).filter(b => b !== branch)
                                  }));
                                }}
                                style={{ marginRight: 6, cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                              {branch}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Customer Location edit */}
                  {user.role === 'customer' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
                      <label className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180, paddingTop: '12px' }}>Location:</label>
                      <div style={{ marginLeft: 12, flex: 1 }}>
                        <LocationSelector
                          value={user.location}
                          onChange={(newLocation) => setUser(prev => ({ ...prev, location: newLocation }))}
                          disabled={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Column 2 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="middleName" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Middle Name:</label>
                    <TextField 
                      id="middleName"
                      className="personal-info-field"
                      value={user.middleName}
                      placeholder="Enter your middle name"
                      margin="normal"
                      variant="outlined"
                      size="small"
                      fullWidth
                      onChange={handleChange('middleName')}
                      sx={{
                        marginLeft: 1.5,
                        background: '#fff',
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          height: 40,
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#F3C13A',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F3C13A',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="email" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Email address:</label>
                    <TextField 
                      id="email"
                      className="personal-info-field"
                      value={user.email}
                      placeholder="Enter your email"
                      margin="normal"
                      variant="outlined"
                      type="email"
                      size="small"
                      fullWidth
                      onChange={handleChange('email')}
                      sx={{
                        marginLeft: 1.5,
                        background: '#fff',
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          height: 40,
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#F3C13A',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F3C13A',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
                    <label htmlFor="contact" className="personal-info-label" style={{ fontWeight: 'bold', fontSize: '1.125rem', textAlign: 'left', minWidth: 180 }}>Contact:</label>
                    <TextField 
                      id="contact"
                      className="personal-info-field"
                      value={user.contact}
                      placeholder="Enter your contact"
                      margin="normal"
                      variant="outlined"
                      size="small"
                      fullWidth
                      onChange={handleChange('contact')}
                      sx={{
                        marginLeft: 1.5,
                        background: '#fff',
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          height: 40,
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#F3C13A',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F3C13A',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
        
        <Divider sx={{ my: 4 }} />
        
        {/* MFA Settings Section */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <MFASettings />
        </div>

        {/* Password Confirmation Modal */}
        <PasswordConfirmationModal
          open={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onSuccess={() => {
            setShowConfirmationModal(false);
            // Set flag to indicate navigation from client profile
            sessionStorage.setItem('fromClientProfile', 'true');
            navigate('/forgot-password');
          }}
          email={user.email}
        />
      </div>
    </div>
  );
};

export default PersonalInformation;
