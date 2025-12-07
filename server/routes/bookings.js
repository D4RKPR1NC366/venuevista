const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create connection for bookings
const bookingConnection = mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking', {
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
    province: String,
    city: String,
    barangay: String,
    branchLocation: String,
    theme: String,
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
        paymentMode: String,
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
  suppliers: [{ type: mongoose.Schema.Types.ObjectId }],
  referenceNumber: { type: String }, // Reference number for approved bookings (e.g., GC-20251205-A3F9K)
  cancellationRequest: {
    status: { type: String, default: 'none' }, // 'none', 'pending', 'approved', 'rejected'
    reason: { type: String },
    description: { type: String },
    requestedBy: { type: String },
    requestedAt: { type: Date },
    processedBy: { type: String },
    processedAt: { type: Date },
    adminNotes: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

// Clear any existing models to force recompilation
if (bookingConnection.models.PendingBooking) delete bookingConnection.models.PendingBooking;
if (bookingConnection.models.ApprovedBooking) delete bookingConnection.models.ApprovedBooking;
if (bookingConnection.models.FinishedBooking) delete bookingConnection.models.FinishedBooking;
if (bookingConnection.models.CancelledBooking) delete bookingConnection.models.CancelledBooking;

// Initialize the booking models
const PendingBooking = bookingConnection.model('PendingBooking', bookingBaseSchema);
const ApprovedBooking = bookingConnection.model('ApprovedBooking', bookingBaseSchema);
const FinishedBooking = bookingConnection.model('FinishedBooking', bookingBaseSchema);
const CancelledBooking = bookingConnection.model('CancelledBooking', bookingBaseSchema);

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
                paymentMode: updateData.paymentDetails.paymentMode || '',
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

// Request booking cancellation
router.post('/:id/cancel-request', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason, description, userEmail } = req.body;

        if (!reason || !description) {
            return res.status(400).json({ message: 'Reason and description are required' });
        }

        const cancellationData = {
            cancellationRequest: {
                status: 'pending',
                reason,
                description,
                requestedBy: userEmail,
                requestedAt: new Date()
            }
        };

        // Try to find and update the booking
        let updatedBooking = await PendingBooking.findByIdAndUpdate(
            bookingId,
            cancellationData,
            { new: true }
        );

        if (!updatedBooking) {
            updatedBooking = await ApprovedBooking.findByIdAndUpdate(
                bookingId,
                cancellationData,
                { new: true }
            );
        }

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Cancellation request submitted successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Error requesting cancellation:', error);
        res.status(500).json({ message: 'Error requesting cancellation', error: error.message });
    }
});

// Get all bookings with pending cancellation requests (for admin)
router.get('/cancellation-requests/pending', async (req, res) => {
    try {
        const pendingCancellations = await PendingBooking.find({ 'cancellationRequest.status': 'pending' });
        const approvedCancellations = await ApprovedBooking.find({ 'cancellationRequest.status': 'pending' });
        
        res.json([...pendingCancellations, ...approvedCancellations]);
    } catch (error) {
        console.error('Error fetching cancellation requests:', error);
        res.status(500).json({ message: 'Error fetching cancellation requests', error: error.message });
    }
});

// Approve booking cancellation (moves to CancelledBooking collection)
router.put('/:id/cancel-approve', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { adminEmail, adminNotes } = req.body;

        // Find the booking in Pending or Approved
        let booking = await PendingBooking.findById(bookingId);
        let sourceCollection = 'pending';
        
        if (!booking) {
            booking = await ApprovedBooking.findById(bookingId);
            sourceCollection = 'approved';
        }

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update cancellation request status
        booking.cancellationRequest.status = 'approved';
        booking.cancellationRequest.processedBy = adminEmail;
        booking.cancellationRequest.processedAt = new Date();
        booking.cancellationRequest.adminNotes = adminNotes || '';

        // Create new cancelled booking
        const cancelledBooking = new CancelledBooking(booking.toObject());
        await cancelledBooking.save();

        // Remove from original collection
        if (sourceCollection === 'pending') {
            await PendingBooking.findByIdAndDelete(bookingId);
        } else {
            await ApprovedBooking.findByIdAndDelete(bookingId);
        }

        res.json({ message: 'Cancellation approved and booking moved to cancelled', booking: cancelledBooking });
    } catch (error) {
        console.error('Error approving cancellation:', error);
        res.status(500).json({ message: 'Error approving cancellation', error: error.message });
    }
});

// Reject booking cancellation
router.put('/:id/cancel-reject', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { adminEmail, adminNotes } = req.body;

        const cancellationData = {
            'cancellationRequest.status': 'rejected',
            'cancellationRequest.processedBy': adminEmail,
            'cancellationRequest.processedAt': new Date(),
            'cancellationRequest.adminNotes': adminNotes || ''
        };

        // Try to find and update the booking
        let updatedBooking = await PendingBooking.findByIdAndUpdate(
            bookingId,
            cancellationData,
            { new: true }
        );

        if (!updatedBooking) {
            updatedBooking = await ApprovedBooking.findByIdAndUpdate(
                bookingId,
                cancellationData,
                { new: true }
            );
        }

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Cancellation request rejected', booking: updatedBooking });
    } catch (error) {
        console.error('Error rejecting cancellation:', error);
        res.status(500).json({ message: 'Error rejecting cancellation', error: error.message });
    }
});

// Get cancelled bookings
router.get('/cancelled', async (req, res) => {
    try {
        const cancelledBookings = await CancelledBooking.find().sort({ createdAt: -1 });
        res.json(cancelledBookings);
    } catch (error) {
        console.error('Error fetching cancelled bookings:', error);
        res.status(500).json({ message: 'Error fetching cancelled bookings', error: error.message });
    }
});

// Reset cancellation request (for fixing bad data)
router.put('/:id/reset-cancellation', async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Try to find and update the booking
        let updatedBooking = await PendingBooking.findByIdAndUpdate(
            bookingId,
            { $unset: { cancellationRequest: "" } },
            { new: true }
        );

        if (!updatedBooking) {
            updatedBooking = await ApprovedBooking.findByIdAndUpdate(
                bookingId,
                { $unset: { cancellationRequest: "" } },
                { new: true }
            );
        }

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Cancellation request reset', booking: updatedBooking });
    } catch (error) {
        console.error('Error resetting cancellation:', error);
        res.status(500).json({ message: 'Error resetting cancellation', error: error.message });
    }
});

module.exports = router;