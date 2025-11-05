const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get the models from the authentication connection
const Customer = mongoose.model('Customer');
const Supplier = mongoose.model('Supplier');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const { id, role } = req.user;
        let user;
        
        if (role === 'customer') {
            user = await Customer.findById(id).select('-password');
        } else if (role === 'supplier') {
            user = await Supplier.findById(id).select('-password');
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

        await user.save();
        
        const updatedUser = await (role === 'customer' ? Customer : Supplier)
            .findById(id)
            .select('-password');
            
        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;