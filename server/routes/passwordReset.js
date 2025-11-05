const express = require('express');
const router = express.Router();
const { Customer, Supplier } = require('../config/database');
const { sendOTP } = require('../services/emailService');

// Store OTPs with expiry (in memory for now, should use Redis or similar in production)
const otpStore = new Map();

// Request password reset (send OTP)
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user
        const user = await Customer.findOne({ email }) || await Supplier.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'No account found with that email' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 600000; // 10 minutes expiry

        // Store OTP with user info
        otpStore.set(email, {
            otp,
            expiry: otpExpiry,
            userId: user._id,
            userType: user instanceof Customer ? 'customer' : 'supplier'
        });

        // Send OTP email
        const sent = await sendOTP(email, otp);
        if (!sent) {
            return res.status(500).json({ error: 'Failed to send verification code' });
        }

        res.json({ message: 'Verification code sent' });
    } catch (error) {
        console.error('OTP send error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const otpData = otpStore.get(email);
        if (!otpData) {
            return res.status(400).json({ error: 'No verification code requested or code expired' });
        }

        if (Date.now() > otpData.expiry) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'Verification code has expired' });
        }

        if (otpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        res.json({ message: 'Code verified successfully' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset password after OTP verification
router.post('/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const otpData = otpStore.get(email);
        if (!otpData) {
            return res.status(400).json({ error: 'Please verify your email first' });
        }

        // Update password
        const Model = otpData.userType === 'customer' ? Customer : Supplier;
        const user = await Model.findById(otpData.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = password;
        await user.save();

        // Clean up OTP data
        otpStore.delete(email);

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;