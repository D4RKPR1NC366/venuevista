import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Typography 
} from '@mui/material';
import { auth } from '../services/api';
import { toast } from 'react-toastify';

const PasswordConfirmationModal = ({ open, onClose, onSuccess, email }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Decode JWT token to get the actual role (only once using useMemo would be better, but keeping it simple)
  const getIsSupplier = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'supplier';
    } catch (e) {
      console.error('Failed to decode token:', e);
      return false;
    }
  };
  
  const isSupplier = getIsSupplier();

  const handleVerify = async () => {
    try {
      if (!password) {
        setError('Please enter your password');
        return;
      }

      // Use the appropriate login endpoint based on user role
      const loginFn = isSupplier ? auth.loginSupplier : auth.loginCustomer;
      const response = await loginFn({
        email: email,
        password: password
      });

      if (response.data) {
        onSuccess();
        setPassword('');
        setError('');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid password';
      setError(errorMsg);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
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
      <DialogTitle>Verify Your Identity</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please enter your current password to verify your identity.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Current Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#ccc',
              },
              '&:hover fieldset': {
                borderColor: '#F3C13A',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#F3C13A',
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose}
          sx={{
            color: '#222',
            '&:hover': {
              backgroundColor: 'rgba(243, 193, 58, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleVerify}
          variant="contained"
          sx={{
            backgroundColor: '#F3C13A',
            color: '#222',
            '&:hover': {
              backgroundColor: '#daa520',
            },
          }}
        >
          Verify & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordConfirmationModal;