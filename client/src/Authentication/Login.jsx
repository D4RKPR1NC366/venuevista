import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  FormGroup
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import SignUpModal from "./SignUpModal";
import ForgotPasswordFlow from "./ForgotPasswordFlow";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';

const Login = () => {
  const [form, setForm] = useState({ emailOrPhone: "", password: "" });
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [mfaCode, setMFACode] = useState("");
  const [tempUserData, setTempUserData] = useState(null);
  const [loginType, setLoginType] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginAttempt = async (endpoint, credentials) => {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  };

  const tryLogin = async (type) => {
    try {
      // If we have tempUserData and mfaCode, use those for MFA verification
      if (tempUserData && mfaCode) {
        const credentials = {
          email: tempUserData.email,
          password: tempUserData.password,
          mfaCode
        };

        const data = await loginAttempt(`login-${tempUserData.type}`, credentials);

        if (data.requireMFA) {
          return { success: false, requireMFA: true };
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        return { success: true };
      }

      const credentials = {
        email: form.emailOrPhone,
        password: form.password
      };

      const data = await loginAttempt(`login-${type}`, credentials);

      if (data.requireMFA) {
        setTempUserData({ type, email: form.emailOrPhone, password: form.password });
        setLoginType(type);
        setShowMFADialog(true);
        return { success: false, requireMFA: true };
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.user.email);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.emailOrPhone.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password is not empty
      if (!form.password || form.password.length < 1) {
        throw new Error('Password is required');
      }

      // Check for hardcoded admin credentials
      if (
        form.emailOrPhone === 'truegoldustadmin@gmail.com' &&
        form.password === 'admin123'
      ) {
        // Save admin info with a token
        localStorage.setItem('user', JSON.stringify({
          email: 'truegoldustadmin@gmail.com',
          role: 'admin',
          firstName: 'Goldust',
          lastName: 'Admin'
        }));
        localStorage.setItem('token', 'admin-hardcoded-token');
        localStorage.setItem('userEmail', 'truegoldustadmin@gmail.com');
        navigate('/admin/dashboard');
        return;
      }

      // Get the login type from localStorage or default to customer
      const savedLoginType = localStorage.getItem('lastLoginType') || 'customer';
      console.log('Attempting login as:', savedLoginType);
      
      // Try the saved type first
      const loginResult = await tryLogin(savedLoginType);
      if (loginResult.success) {
        localStorage.setItem('lastLoginType', savedLoginType);
        navigate('/');
        return;
      }
      if (loginResult.requireMFA) return;
      
      // If that fails, try the other type
      const otherType = savedLoginType === 'customer' ? 'supplier' : 'customer';
      const otherResult = await tryLogin(otherType);
      if (otherResult.success) {
        localStorage.setItem('lastLoginType', otherType);
        navigate('/');
        return;
      }
      if (otherResult.requireMFA) return;

      // If both failed and no MFA required, show error
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
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
              Welcome
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                name="emailOrPhone"
                value={form.emailOrPhone}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
                className="auth-input"
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
              <Box className="auth-form-row">
                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label={<span className="auth-checkbox-label">Remember me</span>}
                  />
                </FormGroup>
                <span className="auth-link-forgot" style={{ cursor: 'pointer' }} onClick={() => navigate('/forgot-password')}>
                  Forgot your password?
                </span>
              </Box>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                className="auth-btn"
              >
                Log in
              </Button>
              <Typography align="center" className="auth-link-row">
                Don't have an account?{' '}
                <span
                  className="auth-link-signup"
                  onClick={() => setShowSignUpModal(true)}
                >
                  Sign Up
                </span>
              </Typography>
              {showSignUpModal && (
                <SignUpModal
                  open={showSignUpModal}
                  onClose={() => setShowSignUpModal(false)}
                  onSelect={(type) => {
                    setShowSignUpModal(false);
                    navigate(`/signup?type=${type}`);
                  }}
                />
              )}
            </form>
          </Paper>
        </Box>
        <Box className="auth-side-panel">
          
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Welcome to Venuevista</Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>by Goldust Creations</Typography>
        </Box>
      </Box>

      {/* MFA Dialog */}
      <Dialog 
        open={showMFADialog} 
        onClose={() => setShowMFADialog(false)}
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
        <DialogTitle>Two-Factor Authentication Required</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter the verification code sent to your email.
          </Typography>
          <TextField
            autoFocus
            label="Verification Code"
            fullWidth
            value={mfaCode}
            onChange={(e) => setMFACode(e.target.value)}
            sx={{ mt: 1 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowMFADialog(false);
            setMFACode('');
            setTempUserData(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              // Only try the login type that triggered MFA
              if (loginType) {
                const result = await tryLogin(loginType);
                if (result.success) {
                  setShowMFADialog(false);
                  setMFACode('');
                  setTempUserData(null);
                  setLoginType(null);
                  navigate('/');
                } else {
                  setError('Invalid verification code');
                }
              }
            }}
            sx={{ 
              backgroundColor: '#F7C04A',
              color: '#111',
              '&:hover': {
                backgroundColor: '#e6b13d'
              }
            }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;