const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Customer, Supplier } = require('../config/database');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const { id, role } = req.user;
        let user;
        
        if (role === 'customer') {
            user = await Customer.findById(id).select('-password');
        } else if (role === 'supplier') {
            user = await Supplier.findById(id).select('-password').populate('eventTypes');
            
            // Ensure isAvailable field exists for older suppliers
            if (user && user.isAvailable === undefined) {
                console.log('Adding missing isAvailable field for supplier:', user.email);
                user.isAvailable = true;
                await user.save();
            }
            
            console.log('Fetched supplier profile:', {
                email: user?.email,
                isAvailable: user?.isAvailable,
                hasIsAvailableField: user ? 'isAvailable' in user.toObject() : false
            });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { id, role } = req.user;
        const { firstName, middleName, lastName, email, phone, contact } = req.body;
        
        let user;
        if (role === 'customer') {
            user = await Customer.findById(id);
        } else if (role === 'supplier') {
            user = await Supplier.findById(id);
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (middleName) user.middleName = middleName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (contact) user.contact = contact;
        
        // Update supplier-specific fields
        if (role === 'supplier') {
            if (req.body.companyName !== undefined) {
                console.log('Updating companyName to:', req.body.companyName);
                user.companyName = req.body.companyName;
            }
            if (req.body.eventTypes !== undefined) {
                console.log('Updating eventTypes to:', req.body.eventTypes);
                user.eventTypes = req.body.eventTypes;
            }
        }

        console.log('User before save:', { companyName: user.companyName, eventTypes: user.eventTypes });
        await user.save();
        console.log('User saved successfully');
        
        let updatedUser;
        if (role === 'customer') {
            updatedUser = await Customer.findById(id).select('-password');
        } else if (role === 'supplier') {
            updatedUser = await Supplier.findById(id).select('-password').populate('eventTypes');
        }
            
        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;