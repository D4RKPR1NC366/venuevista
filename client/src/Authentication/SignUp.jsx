import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  MenuItem,
  FormGroup,
  Select,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import LocationSelector from "../components/LocationSelector";

import { useLocation } from "react-router-dom";

const SignUp = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const accountType = params.get("type") || "customer";
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "user",
    companyName: "",
    agree: false,
    eventTypes: [],
    location: { province: "", city: "", barangay: "" },
    branchContacts: []
  });
  const [type, setType] = useState(accountType);
  const [availableEventTypes, setAvailableEventTypes] = useState([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setType(accountType);
    if (accountType === "supplier") {
      setForm((prev) => ({ ...prev, role: undefined, companyName: "" }));
      // Fetch available event types
      fetch('/api/event-types')
        .then(res => res.json())
        .then(data => setAvailableEventTypes(data))
        .catch(err => console.error('Failed to fetch event types:', err));
    } else {
      setForm((prev) => ({ ...prev, role: accountType, companyName: undefined }));
    }
  }, [accountType]);

  // Restore form data if coming back from policy page
  useEffect(() => {
    if (location.state?.formData) {
      setForm(location.state.formData);
    }
    if (location.state?.agreeChecked) {
      setForm(prev => ({ ...prev, agree: true }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm({ ...form, [name]: inputType === "checkbox" ? checked : value });
  };

  const handleLocationChange = (newLocation) => {
    setForm({ ...form, location: newLocation });
  };

  const handleBranchContactChange = (branch) => {
    const currentBranches = form.branchContacts || [];
    if (currentBranches.includes(branch)) {
      setForm({ ...form, branchContacts: currentBranches.filter(b => b !== branch) });
    } else {
      setForm({ ...form, branchContacts: [...currentBranches, branch] });
    }
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset error state
    setError("");

    // Validate required fields
    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      password: "Password"
    };

    if (type === "supplier") {
      requiredFields.companyName = "Company Name";
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!form[field]?.trim()) {
        setError(`${label} is required`);
        return;
      }
    }

    // Validate name fields (letters and spaces only)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(form.firstName.trim())) {
      setError("First name should only contain letters");
      return;
    }
    if (!nameRegex.test(form.lastName.trim())) {
      setError("Last name should only contain letters");
      return;
    }
    if (form.middleName && !nameRegex.test(form.middleName.trim())) {
      setError("Middle name should only contain letters");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate phone number (Philippine format: 11 digits starting with 09)
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      setError("Phone number must be 11 digits starting with 09 (e.g., 09123456789)");
      return;
    }

    // Validate password strength
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    // Validate terms agreement
    if (!form.agree) {
      setError("Please agree to the terms and policy");
      return;
    }

    // Show privacy modal instead of submitting directly
    setShowPrivacyModal(true);
  };

  const handlePrivacyAccept = async () => {
    if (!privacyAccepted) {
      setError("Please accept the Data Privacy policy to continue");
      return;
    }

    setShowPrivacyModal(false);
    setLoading(true);
    try {
      // Clean and prepare payload
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password
      };

      let endpoint = '';
      if (type === "supplier") {
        payload.companyName = form.companyName.trim();
        payload.eventTypes = form.eventTypes;
        payload.branchContacts = form.branchContacts;
        endpoint = '/api/auth/register-supplier';
      } else {
        payload.province = form.location.province;
        payload.city = form.location.city;
        payload.barangay = form.location.barangay;
        endpoint = '/api/auth/register-customer';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message from server (includes pending approval for suppliers)
        window.alert(data.message || 'Sign up successful! Please log in.');
        navigate('/login');
      } else {
        // Show specific error from server
        setError(data.error || data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-container">
      <Box className="auth-panel">
        <Box className="auth-form-panel">
          <Paper elevation={0} className="auth-form">
            <img
              src="/goldustlogo1.png"
              alt="Goldust Logo"
              style={{ width: '80px', marginBottom: '12px', display: 'block', marginLeft: 0 }}
            />
            <Typography variant="h5" align="left" gutterBottom className="auth-title">
              {type === 'supplier' ? 'Supplier Sign Up' : 'Customer Sign Up'}
            </Typography>
            {error && (
              <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            )}
            <form onSubmit={handleSubmit}>
              <Box className="auth-signup-grid">
                <TextField
                  label="First Name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  required
                  className="auth-input"
                />
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  required
                  className="auth-input"
                />
                <TextField
                  label="Middle Name"
                  name="middleName"
                  value={form.middleName}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  className="auth-input"
                />
                <TextField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  required
                  className="auth-input"
                />
                {type === 'supplier' ? (
                  <>
                    <TextField
                      label="Company Name"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      fullWidth
                      margin="dense"
                      required
                      className="auth-input"
                    />
                    <FormControl fullWidth margin="dense" className="auth-input">
                      <InputLabel>Event Types You Offer</InputLabel>
                      <Select
                        multiple
                        name="eventTypes"
                        value={form.eventTypes}
                        onChange={handleChange}
                        input={<OutlinedInput label="Event Types You Offer" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const eventType = availableEventTypes.find(et => et._id === value);
                              return <Chip key={value} label={eventType?.name || value} size="small" />;
                            })}
                          </Box>
                        )}
                      >
                        {availableEventTypes.map((eventType) => (
                          <MenuItem key={eventType._id} value={eventType._id}>
                            {eventType.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ gridColumn: '1 / -1', mt: 1, mb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Supplier Branch Contact (Select branches you can service):
                      </Typography>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={form.branchContacts.includes("Sta. Fe, Nueva Vizcaya")}
                              onChange={() => handleBranchContactChange("Sta. Fe, Nueva Vizcaya")}
                            />
                          }
                          label="Sta. Fe, Nueva Vizcaya"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={form.branchContacts.includes("La Trinidad, Benguet")}
                              onChange={() => handleBranchContactChange("La Trinidad, Benguet")}
                            />
                          }
                          label="La Trinidad, Benguet"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={form.branchContacts.includes("Maddela, Quirino")}
                              onChange={() => handleBranchContactChange("Maddela, Quirino")}
                            />
                          }
                          label="Maddela, Quirino"
                        />
                      </FormGroup>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Customer Location:
                    </Typography>
                    <LocationSelector
                      value={form.location}
                      onChange={handleLocationChange}
                    />
                  </Box>
                )}
                {type === 'admin' ? (
                  <FormControl fullWidth margin="dense" className="auth-input">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      label="Role"
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                ) : null}
                <TextField
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  required
                  className={`auth-input${type !== 'supplier' ? ' auth-input-span' : ''}`}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  required
                  className="auth-input"
                />
                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  margin="dense"
                  required
                  className="auth-input"
                />
              </Box>
              <FormGroup className="auth-checkbox-group">
                <FormControlLabel
                  control={<Checkbox name="agree" checked={form.agree} onChange={handleChange} required />}
                  label={
                    <span>
                      I agree to the{' '}
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/policy', {
                            state: {
                              fromSignUp: true,
                              signUpData: form,
                              accountType: type
                            }
                          });
                        }}
                        style={{ color: '#e6b800', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        terms & policy
                      </span>
                    </span>
                  }
                />
              </FormGroup>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                className="auth-btn"
              >
                Sign up
              </Button>
              <Typography align="center" className="auth-link-row">
                Have an account?{' '}
                <Link to="/login" className="auth-link-login">
                  Log in
                </Link>
              </Typography>
            </form>
          </Paper>
        </Box>
        <Box className="auth-side-panel">
         
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Welcome to Venuevista</Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>by Goldust Creations</Typography>
        </Box>
      </Box>

      {/* Data Privacy Modal */}
      <Dialog 
        open={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#e6b800', color: '#000', fontWeight: 600 }}>
          Data Privacy Notice
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Republic Act No. 10173 - Data Privacy Act of 2012
          </Typography>
          
          <Typography variant="body1" paragraph>
            By signing up for Venuevista, you consent to the collection and processing of your personal information in accordance with the Data Privacy Act of 2012.
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Information We Collect:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Personal identification (Name, Email, Phone Number)</li>
            {type === 'supplier' && <li>Business information (Company Name, Event Types)</li>}
            <li>Account credentials (Password - encrypted)</li>
            <li>Usage data and preferences</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How We Use Your Information:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>To create and manage your account</li>
            <li>To facilitate bookings and event management</li>
            <li>To communicate important updates and notifications</li>
            <li>To improve our services</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Your Rights:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate information</li>
            <li>Right to request deletion of your data</li>
            <li>Right to object to processing of your data</li>
          </Typography>

          <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
            Your information will be stored securely and will not be shared with third parties without your consent, except as required by law.
          </Typography>

          <FormControlLabel
            control={
              <Checkbox 
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                sx={{ 
                  color: '#e6b800',
                  '&.Mui-checked': { color: '#e6b800' }
                }}
              />
            }
            label={
              <Typography variant="body2">
                I have read and accept the Data Privacy policy and consent to the collection and processing of my personal information.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setShowPrivacyModal(false);
              setPrivacyAccepted(false);
            }}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePrivacyAccept}
            variant="contained"
            disabled={!privacyAccepted}
            sx={{ 
              backgroundColor: '#e6b800',
              '&:hover': { backgroundColor: '#cc9f00' },
              '&:disabled': { backgroundColor: '#ccc' }
            }}
          >
            Accept & Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignUp;