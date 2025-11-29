const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create connection for bookings
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';
const bookingConnection = mongoose.createConnection(`${ATLAS_URI}booking`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});// Define the booking schema
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
    promoDiscount: { type: Number, default: 0 },
    totalPrice: Number,
    // Payment details object
    paymentDetails: {
        paymentStatus: String,
        amountPaid: Number,
        paymentDate: String,
        transactionReference: String,
        paymentProof: String,
        paymentNotes: String
    },
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
    contractPicture: { type: String }, // base64 image string
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
        // Ensure promo name and discount are always present
        if (updateData.promoTitle !== undefined) {
            updateData.promoTitle = String(updateData.promoTitle);
        }
        if (updateData.promoDiscount !== undefined) {
            updateData.promoDiscount = Number(updateData.promoDiscount) || 0;
        }

        // Handle contract picture
        if (updateData.contractPicture !== undefined) {
            updateData.contractPicture = String(updateData.contractPicture);
        }

        // Handle payment details object
        if (updateData.paymentDetails) {
            updateData.paymentDetails = {
                paymentStatus: updateData.paymentDetails.paymentStatus || '',
                amountPaid: Number(updateData.paymentDetails.amountPaid) || 0,
                paymentDate: updateData.paymentDetails.paymentDate || '',
                transactionReference: updateData.paymentDetails.transactionReference || '',
                paymentProof: updateData.paymentDetails.paymentProof || '',
                paymentNotes: updateData.paymentDetails.paymentNotes || ''
            };
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