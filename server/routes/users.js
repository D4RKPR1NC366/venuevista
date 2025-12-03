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
            user = await Customer.findById(id);
        } else if (role === 'supplier') {
            user = await Supplier.findById(id);
            
            // Ensure isAvailable field exists for older suppliers
            if (user && user.isAvailable === undefined) {
                console.log('Adding missing isAvailable field for supplier:', user.email);
                user.isAvailable = true;
                await user.save();
            }
            
            // Manually fetch EventTypes from ProductsAndServices database
            if (user && user.eventTypes && user.eventTypes.length > 0) {
                const EventType = require('../models/EventType');
                const populatedEventTypes = await EventType.find({ _id: { $in: user.eventTypes } });
                user = user.toObject();
                user.eventTypes = populatedEventTypes;
            }
            
            console.log('Fetched supplier profile:', {
                email: user?.email,
                isAvailable: user?.isAvailable,
                eventTypesCount: user?.eventTypes?.length || 0,
                hasIsAvailableField: user ? 'isAvailable' in user : false
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
        const { firstName, middleName, lastName, email, phone, contact, province, city, barangay } = req.body;
        
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
        
        // Update customer location fields (for customers or non-suppliers)
        if (role === 'customer' || !user.companyName) {
            console.log('Updating customer location fields:', { province, city, barangay });
            if (province !== undefined) {
                user.province = province;
                console.log('Set province to:', user.province);
            }
            if (city !== undefined) {
                user.city = city;
                console.log('Set city to:', user.city);
            }
            if (barangay !== undefined) {
                user.barangay = barangay;
                console.log('Set barangay to:', user.barangay);
            }
        }
        
        // Update supplier-specific fields
        if (role === 'supplier' || user.companyName) {
            if (req.body.companyName !== undefined) {
                console.log('Updating companyName to:', req.body.companyName);
                user.companyName = req.body.companyName;
            }
            if (req.body.eventTypes !== undefined) {
                console.log('Received eventTypes:', req.body.eventTypes, 'Type:', typeof req.body.eventTypes, 'IsArray:', Array.isArray(req.body.eventTypes));
                user.eventTypes = Array.isArray(req.body.eventTypes) ? req.body.eventTypes : [];
                console.log('Set user.eventTypes to:', user.eventTypes);
            }
            if (req.body.branchContacts !== undefined) {
                console.log('Updating branchContacts to:', req.body.branchContacts);
                user.branchContacts = Array.isArray(req.body.branchContacts) ? req.body.branchContacts : [];
            }
        }

        console.log('User before save:', { _id: user._id, companyName: user.companyName, eventTypes: user.eventTypes });
        await user.save();
        console.log('User saved successfully. EventTypes after save:', user.eventTypes);
        
        let updatedUser;
        if (role === 'customer') {
            updatedUser = await Customer.findById(id).select('-password');
        } else if (role === 'supplier') {
            updatedUser = await Supplier.findById(id).select('-password');
            console.log('Raw eventTypes in response:', updatedUser.eventTypes);
            
            // Manually fetch EventTypes from ProductsAndServices database instead of populate
            // since they're in different databases
            if (updatedUser.eventTypes && updatedUser.eventTypes.length > 0) {
                const EventType = require('../models/EventType');
                const populatedEventTypes = await EventType.find({ _id: { $in: updatedUser.eventTypes } });
                updatedUser = updatedUser.toObject();
                updatedUser.eventTypes = populatedEventTypes;
                console.log('Manually populated eventTypes:', populatedEventTypes);
            }
        }
            
        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all approved suppliers (for admin)
router.get('/admin/suppliers/approved', auth, async (req, res) => {
    try {
        // You may want to check if req.user is admin here
        const suppliers = await Supplier.find({ isApproved: true }); // includes password
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all pending suppliers (for admin)
router.get('/admin/suppliers/pending', auth, async (req, res) => {
    try {
        // You may want to check if req.user is admin here
        const suppliers = await Supplier.find({ isApproved: false }); // includes password
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;