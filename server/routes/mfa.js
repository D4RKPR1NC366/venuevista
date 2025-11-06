const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Customer } = require('../config/database');
const { Supplier } = require('../config/database');
const { sendMFACode, verifyMFACode } = require('../services/mfaService');

// Helper function to find user in both collections
const findUserByEmail = async (email) => {
    let user = await Customer.findOne({ email });
    if (!user) {
        user = await Supplier.findOne({ email });
    }
    return user;
};

// Toggle MFA status
router.post('/toggle-mfa', auth, async (req, res) => {
    try {
        // 1. Find current user and get their MFA state
        const userEmail = req.user.email;
        console.log('Finding user:', userEmail);
        
        let Model = Customer;
        let user = await Customer.findOne({ email: userEmail });
        
        if (!user) {
            Model = Supplier;
            user = await Supplier.findOne({ email: userEmail });
        }

        if (!user) {
            console.log('User not found:', userEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Get current state and calculate new state
        const currentState = Boolean(user.mfaEnabled);
        const newState = !currentState;

        console.log('MFA Toggle:', {
            email: userEmail,
            currentState,
            newState
        });

        // 3. Update user with new MFA state
        try {
            // First verify the user exists and get their current state
            const existingUser = await Model.findOne({ email: userEmail });
            if (!existingUser) {
                console.error('User not found before update');
                return res.status(404).json({ error: 'User not found' });
            }

            console.log('Found user before update:', {
                id: existingUser._id,
                email: existingUser.email,
                currentMfaState: existingUser.mfaEnabled
            });

            // Perform the update with explicit Boolean conversion
            const result = await Model.findOneAndUpdate(
                { email: userEmail },
                { $set: { mfaEnabled: Boolean(newState) } },
                { 
                    new: true,  // Return the updated document
                    runValidators: true,  // Run schema validations
                    upsert: false  // Don't create if doesn't exist
                }
            );

            if (!result) {
                console.error('Update failed - no document returned');
                return res.status(500).json({ error: 'Failed to update MFA state' });
            }

            console.log('Update operation completed:', {
                userId: result._id,
                email: result.email,
                oldState: existingUser.mfaEnabled,
                newState: result.mfaEnabled,
                updateSuccessful: result.mfaEnabled === newState
            });
        } catch (updateError) {
            console.error('Error during MFA update:', updateError);
            return res.status(500).json({ 
                error: 'Failed to update MFA state',
                details: updateError.message
            });
        }

        // 4. Verify the update with a fresh query
        const updatedUser = await Model.findOne({ email: userEmail });
        
        console.log('Final verification:', {
            email: userEmail,
            mfaEnabled: updatedUser.mfaEnabled,
            expectedState: newState,
            updateSuccessful: updatedUser.mfaEnabled === newState
        });

        if (updatedUser.mfaEnabled !== newState) {
            console.error('State verification failed:', {
                expected: newState,
                actual: updatedUser.mfaEnabled
            });
            return res.status(500).json({ error: 'MFA state verification failed' });
        }

        // 5. Send response
        res.json({
            success: true,
            mfaEnabled: updatedUser.mfaEnabled,
            message: `MFA has been ${updatedUser.mfaEnabled ? 'enabled' : 'disabled'}`
        });

    } catch (error) {
        console.error('MFA toggle error:', error);
        res.status(500).json({ 
            error: 'Server error while toggling MFA',
            details: error.message
        });
    }
});

// Request MFA code during login
router.post('/request-mfa', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            console.log('Missing email in request');
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('Looking for user with email:', email);
        const user = await findUserByEmail(email);

        if (!user) {
            console.log('No user found with email:', email);
            return res.status(400).json({ error: 'User not found' });
        }

        console.log('Found user, checking MFA status:', { email, mfaEnabled: user.mfaEnabled });
        // When enabling MFA for the first time, user.mfaEnabled will be false, which is what we want
        // Only check mfaEnabled when verifying an existing MFA setup
        
        await sendMFACode(email);
        res.json({ 
            success: true, 
            message: 'MFA code sent' 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Error sending MFA code' 
        });
    }
});

// Verify MFA code during login
router.post('/verify-mfa', async (req, res) => {
    try {
        const { email, code } = req.body;
        console.log('Verifying MFA code:', { email, code });
        
        const user = await findUserByEmail(email);
        if (!user) {
            console.log('User not found during verification');
            return res.status(400).json({ 
                error: 'User not found' 
            });
        }

        const isValid = verifyMFACode(email, code);
        console.log('Code verification result:', isValid, 'for email:', email);
        
        if (!isValid) {
            return res.status(400).json({ 
                error: 'Invalid or expired code',
                message: 'The verification code you entered does not match or has expired'
            });
        }

        res.json({ 
            success: true, 
            message: 'MFA verification successful' 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Error verifying MFA code' 
        });
    }
});

module.exports = router;