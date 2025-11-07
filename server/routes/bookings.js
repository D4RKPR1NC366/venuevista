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
    // Payment related fields
    paymentMode: String,
    discountType: String,
    discount: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
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

        // Ensure payment fields are properly formatted
        if (updateData.paymentMode !== undefined) {
            updateData.paymentMode = String(updateData.paymentMode);
        }
        if (updateData.discountType !== undefined) {
            updateData.discountType = String(updateData.discountType);
        }
        if (updateData.discount !== undefined) {
            updateData.discount = Number(updateData.discount) || 0;
        }
        if (updateData.subTotal !== undefined) {
            updateData.subTotal = Number(updateData.subTotal) || 0;
        }
        if (updateData.totalPrice !== undefined) {
            updateData.totalPrice = Number(updateData.totalPrice) || 0;
        }

        // Try to find and update the booking in all collections
        let updatedBooking = await PendingBooking.findByIdAndUpdate(
            bookingId,
            updateData,
            { new: true, runValidators: true }
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