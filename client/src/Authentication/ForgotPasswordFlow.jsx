
import React, { useState } from "react";
import { Typography, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./auth.css";

export default function ForgotPasswordFlow() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Check if navigated from client profile page
  const fromClientProfile = sessionStorage.getItem('fromClientProfile') === 'true';

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      setEmailSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="auth-card">
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Forgot your Password?
        </Typography>
        {emailSent ? (
          <>
            <Typography sx={{ mb: 2 }}>
              Password reset instructions have been sent to your email.
            </Typography>
            <Typography sx={{ mb: 4 }}>
              Please check your inbox and follow the link in the email to reset your password.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              If you don't receive the email within a few minutes, please check your spam folder.
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              sx={{ 
                color: "#111",
                borderColor: "#F7C04A",
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { 
                  borderColor: '#e6b13d',
                  background: 'rgba(247, 192, 74, 0.1)'
                }
              }}
              onClick={() => {
                sessionStorage.removeItem('fromClientProfile');
                if (fromClientProfile) {
                  navigate("/client/personal-information");
                } else {
                  navigate("/login");
                }
              }}
            >
              {fromClientProfile ? "Return to Profile" : "Return to Login"}
            </Button>
          </>
        ) : (
          <>
            <Typography sx={{ mb: 2 }}>Enter your email to recover your password</Typography>
            <TextField
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 4 }}
            />
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <Button
              variant="contained"
              fullWidth
              sx={{ 
                background: "#F7C04A", 
                color: "#111", 
                fontWeight: 600, 
                borderRadius: 2, 
                boxShadow: "none", 
                '&:hover': { background: '#e6b13d' } 
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Sending..." : "Submit"}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ 
                mt: 2,
                color: "#111",
                borderColor: "#F7C04A",
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { 
                  borderColor: '#e6b13d',
                  background: 'rgba(247, 192, 74, 0.1)'
                }
              }}
              onClick={() => {
                sessionStorage.removeItem('fromClientProfile');
                if (fromClientProfile) {
                  navigate("/client/personal-information");
                } else {
                  navigate("/login");
                }
              }}
            >
              {fromClientProfile ? "Return to Profile" : "Return to Login"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
