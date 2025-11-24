import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import { TextField, Button, Divider } from '@mui/material';
import { users } from '../services/api';
import { toast } from 'react-toastify';
import MFASettings from '../Authentication/MFASettings';
import PasswordConfirmationModal from './PasswordConfirmationModal';

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
    password: ''
  });

  // Generic handler for all fields
  const handleChange = (field) => (event) => {
    setUser((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const fetchUserProfile = async () => {
    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser) {
        console.error('No user found in localStorage');
        toast.error('Please log in again');
        return;
      }

      // If we have a user in localStorage, use that data initially
      setUser({
        firstName: currentUser.firstName || '',
        middleName: currentUser.middleName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        contact: currentUser.contact || '',
        password: '********' // We don't show the actual password
      });

      // Then try to fetch from API
      const response = await users.getProfile();
      if (response && response.data) {
        const userData = response.data;
        setUser(prev => ({
          ...prev,
          firstName: userData.firstName || prev.firstName,
          middleName: userData.middleName || prev.middleName,
          lastName: userData.lastName || prev.lastName,
          email: userData.email || prev.email,
          phone: userData.phone || prev.phone,
          contact: userData.contact || prev.contact
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to update profile from server');
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
      const response = await users.updateProfile({
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        contact: user.contact
      });
      
      if (response && response.data) {
        setUser(prev => ({
          ...prev,
          ...response.data,
          password: '********' // Keep password hidden
        }));
        
        // Update localStorage with new data
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          ...response.data,
          password: storedUser.password // Keep original password in localStorage
        }));

        setEditMode(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  React.useEffect(() => {
    fetchUserProfile();
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
