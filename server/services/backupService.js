const { Customer, Supplier } = require('../config/database');
const { AtlasCustomer, AtlasSupplier, AtlasBooking, AtlasReview } = require('../config/atlas');
const mongoose = require('mongoose');

class BackupService {
    constructor() {
        this.isRunning = false;
        this.lastBackupTime = null;
        this.backupInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    async syncCustomersToAtlas() {
        try {
            console.log('Starting customer sync to Atlas...');
            const localCustomers = await Customer.find({});
            
            for (const customer of localCustomers) {
                await AtlasCustomer.findOneAndUpdate(
                    { email: customer.email },
                    {
                        ...customer.toObject(),
                        lastBackupSync: new Date()
                    },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: true 
                    }
                );
            }
            
            console.log(`Synced ${localCustomers.length} customers to Atlas`);
            return localCustomers.length;
        } catch (error) {
            console.error('Error syncing customers to Atlas:', error);
            throw error;
        }
    }

    async syncSuppliersToAtlas() {
        try {
            console.log('Starting supplier sync to Atlas...');
            const localSuppliers = await Supplier.find({});
            
            for (const supplier of localSuppliers) {
                await AtlasSupplier.findOneAndUpdate(
                    { email: supplier.email },
                    {
                        ...supplier.toObject(),
                        lastBackupSync: new Date()
                    },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: true 
                    }
                );
            }
            
            console.log(`Synced ${localSuppliers.length} suppliers to Atlas`);
            return localSuppliers.length;
        } catch (error) {
            console.error('Error syncing suppliers to Atlas:', error);
            throw error;
        }
    }

    async syncBookingsToAtlas() {
        try {
            console.log('Starting booking sync to Atlas...');
            
            // Connect to local booking database
            const localBookingConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/booking', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            // Define the booking schema to match your actual structure
            const bookingSchema = new mongoose.Schema({
                userId: String,
                name: String,
                contact: String,
                email: String,
                eventType: String,
                date: Date,
                eventVenue: String,
                guestCount: Number,
                paymentMode: String,
                discountType: String,
                discount: { type: Number, default: 0 },
                subTotal: { type: Number, default: 0 },
                promoDiscount: { type: Number, default: 0 },
                totalPrice: Number,
                paymentDetails: {
                    paymentStatus: String,
                    amountPaid: Number,
                    paymentDate: String,
                    transactionReference: String,
                    paymentProof: String,
                    paymentNotes: String
                },
                products: [{
                    image: String,
                    title: String,
                    price: Number,
                    additionals: { type: [Object], default: [] }
                }],
                specialRequest: String,
                service: String,
                details: Object,
                outsidePH: String,
                contractPicture: String,
                createdAt: { type: Date, default: Date.now },
                bookingStatus: String, // To track which collection it came from
                lastBackupSync: { type: Date, default: Date.now }
            });

            // Get all three booking collections
            const PendingBooking = localBookingConnection.model('PendingBooking', bookingSchema);
            const ApprovedBooking = localBookingConnection.model('ApprovedBooking', bookingSchema);
            const FinishedBooking = localBookingConnection.model('FinishedBooking', bookingSchema);
            
            // Fetch from all three collections
            const [pendingBookings, approvedBookings, finishedBookings] = await Promise.all([
                PendingBooking.find({}),
                ApprovedBooking.find({}),
                FinishedBooking.find({})
            ]);
            
            let totalSynced = 0;
            
            // Sync pending bookings
            for (const booking of pendingBookings) {
                await AtlasBooking.findOneAndUpdate(
                    { _id: booking._id },
                    {
                        ...booking.toObject(),
                        bookingStatus: 'pending',
                        lastBackupSync: new Date()
                    },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: true 
                    }
                );
                totalSynced++;
            }
            
            // Sync approved bookings
            for (const booking of approvedBookings) {
                await AtlasBooking.findOneAndUpdate(
                    { _id: booking._id },
                    {
                        ...booking.toObject(),
                        bookingStatus: 'approved',
                        lastBackupSync: new Date()
                    },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: true 
                    }
                );
                totalSynced++;
            }
            
            // Sync finished bookings
            for (const booking of finishedBookings) {
                await AtlasBooking.findOneAndUpdate(
                    { _id: booking._id },
                    {
                        ...booking.toObject(),
                        bookingStatus: 'finished',
                        lastBackupSync: new Date()
                    },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: true 
                    }
                );
                totalSynced++;
            }
            
            await localBookingConnection.close();
            
            console.log(`Synced ${pendingBookings.length} pending bookings to Atlas`);
            console.log(`Synced ${approvedBookings.length} approved bookings to Atlas`);
            console.log(`Synced ${finishedBookings.length} finished bookings to Atlas`);
            console.log(`Total bookings synced: ${totalSynced}`);
            
            return totalSynced;
        } catch (error) {
            console.error('Error syncing bookings to Atlas:', error);
            throw error;
        }
    }

    async syncReviewsToAtlas() {
        try {
            console.log('Starting reviews sync to Atlas...');
            
            // Connect to local reviews database
            const localReviewsConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/reviews', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            const LocalReview = localReviewsConnection.model('Review', new mongoose.Schema({}, { strict: false }));
            const localReviews = await LocalReview.find({});
            
            for (const review of localReviews) {
                await AtlasReview.findOneAndUpdate(
                    { _id: review._id },
                    {
                        ...review.toObject(),
                        lastBackupSync: new Date()
                    },
                    { 
                        upsert: true, 
                        new: true,
                        setDefaultsOnInsert: true 
                    }
                );
            }
            
            await localReviewsConnection.close();
            console.log(`Synced ${localReviews.length} reviews to Atlas`);
            return localReviews.length;
        } catch (error) {
            console.error('Error syncing reviews to Atlas:', error);
            throw error;
        }
    }

    async performFullBackup() {
        if (this.isRunning) {
            console.log('Backup already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            console.log('Starting full backup to Atlas...');
            
            const results = await Promise.all([
                this.syncCustomersToAtlas(),
                this.syncSuppliersToAtlas(),
                this.syncBookingsToAtlas(),
                this.syncReviewsToAtlas()
            ]);

            const totalSynced = results.reduce((sum, count) => sum + count, 0);
            const duration = Date.now() - startTime;
            
            this.lastBackupTime = new Date();
            
            console.log(`Full backup completed successfully!`);
            console.log(`Total records synced: ${totalSynced}`);
            console.log(`Backup duration: ${duration}ms`);
            
            return {
                success: true,
                recordsSynced: totalSynced,
                duration,
                timestamp: this.lastBackupTime,
                details: {
                    customers: results[0],
                    suppliers: results[1],
                    bookings: results[2],
                    reviews: results[3]
                }
            };
            
        } catch (error) {
            console.error('Backup failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        } finally {
            this.isRunning = false;
        }
    }

    startPeriodicBackup() {
        console.log(`Starting periodic backup every ${this.backupInterval / 1000} seconds`);
        
        // Run initial backup
        this.performFullBackup();
        
        // Schedule periodic backups
        setInterval(() => {
            this.performFullBackup();
        }, this.backupInterval);
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            lastBackupTime: this.lastBackupTime,
            backupInterval: this.backupInterval
        };
    }
}

module.exports = new BackupService();