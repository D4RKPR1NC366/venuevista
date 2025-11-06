const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create connection for bookings
const bookingConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/booking', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the booking schema
const bookingBaseSchema = new mongoose.Schema({
    userId: String,
    name: String,
    contact: String,
    email: String,
    eventType: String,
    date: Date,
    eventVenue: String,
    guestCount: Number,
    totalPrice: Number,
    products: [
        {
            image: String,
            title: String,
            price: Number,
            additionals: { type: [Object], default: [] }
        }
    ],
    specialRequest: String,
    service: String,
    details: Object,
    outsidePH: String,
    createdAt: { type: Date, default: Date.now }
});

// Initialize the booking models
const PendingBooking = bookingConnection.model('PendingBooking', bookingBaseSchema);
const ApprovedBooking = bookingConnection.model('ApprovedBooking', bookingBaseSchema);
const FinishedBooking = bookingConnection.model('FinishedBooking', bookingBaseSchema);

// Update a booking
router.put('/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const updateData = req.body;

        // Try to find and update the booking in all collections
        let updatedBooking = await PendingBooking.findByIdAndUpdate(
            bookingId,
            updateData,
            { new: true }
        );

        if (!updatedBooking) {
            updatedBooking = await ApprovedBooking.findByIdAndUpdate(
                bookingId,
                updateData,
                { new: true }
            );
        }

        if (!updatedBooking) {
            updatedBooking = await FinishedBooking.findByIdAndUpdate(
                bookingId,
                updateData,
                { new: true }
            );
        }

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
});

module.exports = router;