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
  
  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSupplier = user.role === 'supplier';

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
      console.error('Verification error:', err);
      setError('Invalid password');
      toast.error('Failed to verify identity');
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