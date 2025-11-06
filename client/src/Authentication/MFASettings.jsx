import React, { useState } from 'react';
import {
  Button,
  Typography,
  Box,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

export default function MFASettings() {
  const [mfaEnabled, setMfaEnabled] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return Boolean(user.mfaEnabled);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return false;
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleToggleMFA = async () => {
    if (!mfaEnabled) {
      // If enabling MFA, open dialog to verify email first
      setDialogOpen(true);
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('userEmail');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('Attempting MFA with:', { email, hasToken: !!token, user });
        
        if (!token || !email) {
          throw new Error('Please log in again');
        }

        const response = await fetch('/api/mfa/request-mfa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send verification code');
        }
      } catch (err) {
        setError(err.message);
        console.error('MFA error:', err);
      }
    } else {
      // If disabling MFA, just toggle it off
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Please log in again');
        }

        const response = await fetch('/api/mfa/toggle-mfa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to disable MFA');
        }

        const toggleData = await response.json();
        console.log('Toggle response (disable):', toggleData);

        if (!toggleData.success) {
          throw new Error('Failed to disable MFA');
        }

        // Update local storage with server response
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, mfaEnabled: toggleData.mfaEnabled };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update state with value from server
        setMfaEnabled(toggleData.mfaEnabled);
        setSuccess('Two-Factor Authentication has been disabled');
      } catch (err) {
        setError(err.message);
        console.error('MFA error:', err);
      }
    }
  };

  const handleVerifyCode = async () => {
    try {
      console.log('Attempting to verify code:', confirmationCode);
      const email = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');

      if (!email || !token) {
        throw new Error('Missing email or token');
      }

      // First verify the code
      const verifyResponse = await fetch('/api/mfa/verify-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          code: confirmationCode
        })
      });

      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || verifyData.error || 'Invalid verification code');
      }

      // If verification successful, enable MFA
      const toggleResponse = await fetch('/api/mfa/toggle-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const toggleData = await toggleResponse.json();
      console.log('Toggle response:', toggleData);

      if (!toggleResponse.ok || !toggleData.success) {
        throw new Error(toggleData.error || 'Failed to enable MFA');
      }

      // Get the new MFA state from the response
      const newMFAState = toggleData.mfaEnabled;
      console.log('New MFA state:', newMFAState);

      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...storedUser, 
        mfaEnabled: newMFAState
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Updated localStorage:', updatedUser);

      // Update component state
      setMfaEnabled(newMFAState);
      console.log('Updated component state to:', newMFAState);
      setDialogOpen(false);
      setSuccess('Two-Factor Authentication has been enabled');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ mr: 2, color: '#F7C04A' }} />
        <Typography variant="h5" component="h2">
          Two-Factor Authentication
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid #eee', borderRadius: 1 }}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Enable Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Secure your account with email verification codes
          </Typography>
        </Box>
        <Switch
          checked={mfaEnabled || false}  // Ensure it's always a boolean
          onChange={handleToggleMFA}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#F7C04A'
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#F7C04A'
            }
          }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Verify Your Email</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            We've sent a verification code to your email. Please enter it below to enable Two-Factor Authentication.
          </Typography>
          <TextField
            autoFocus
            label="Verification Code"
            fullWidth
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleVerifyCode}
            sx={{ 
              backgroundColor: '#F7C04A',
              color: '#111',
              '&:hover': {
                backgroundColor: '#e6b13d'
              }
            }}
          >
            Verify & Enable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}