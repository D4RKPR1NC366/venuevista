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
  InputLabel
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

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
  });
  const [type, setType] = useState(accountType);
  const navigate = useNavigate();

  useEffect(() => {
    setType(accountType);
    if (accountType === "supplier") {
      setForm((prev) => ({ ...prev, role: undefined, companyName: "" }));
    } else {
      setForm((prev) => ({ ...prev, role: accountType, companyName: undefined }));
    }
  }, [accountType]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm({ ...form, [name]: inputType === "checkbox" ? checked : value });
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error state
    setError("");

    // Validate passwords
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    // Validate terms agreement
    if (!form.agree) {
      setError("Please agree to the terms and policy");
      return;
    }

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
        endpoint = 'http://localhost:5051/api/auth/register-supplier';
      } else {
        endpoint = 'http://localhost:5051/api/auth/register-customer';
      }

      console.log('Attempting registration with:', {
        ...payload,
        password: '[HIDDEN]'
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        window.alert('Sign up successful! Please log in.');
        navigate('/login');
      } else {
        // Show specific error from server
        setError(data.error || data.message || 'Registration failed');
        console.error('Registration failed:', data);
      }
    } catch (error) {
      console.error('Registration error:', error);
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
                ) : null}
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
                  label={<span>I agree to the <a href="#">terms & policy</a></span>}
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Welcome to Goldust Creations</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;