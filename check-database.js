const mongoose = require('mongoose');

const EventTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
});

const SupplierSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    companyName: { type: String },
    eventTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventType' }],
}, { timestamps: true });

async function checkDatabase() {
    try {
        // Connect to ProductsAndServices database
        const conn = await mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/ProductsAndServices?retryWrites=true&w=majority&appName=goldust').asPromise();
        console.log('Connected to ProductsAndServices database');

        const EventType = conn.model('EventType', EventTypeSchema);
        const eventTypes = await EventType.find();
        
        console.log('\n=== EVENT TYPES IN DATABASE ===');
        console.log(`Found ${eventTypes.length} event types:`);
        eventTypes.forEach(et => {
            console.log(`  - ${et.name} (ID: ${et._id})`);
        });

        // Connect to authentication database
        const authConn = await mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication?retryWrites=true&w=majority&appName=goldust').asPromise();
        console.log('\nConnected to authentication database');

        const Supplier = authConn.model('Supplier', SupplierSchema);
        const suppliers = await Supplier.find({ email: 'slifaslacka888@yahoo.com' });
        
        console.log('\n=== SUPPLIER DATA ===');
        if (suppliers.length > 0) {
            const supplier = suppliers[0];
            console.log(`Supplier: ${supplier.firstName} ${supplier.lastName}`);
            console.log(`Company: ${supplier.companyName}`);
            console.log(`Event Types (raw):`, supplier.eventTypes);
            console.log(`Event Types count:`, supplier.eventTypes.length);
            
            // Try to populate
            await supplier.populate('eventTypes');
            console.log(`Event Types (populated):`, supplier.eventTypes);
        } else {
            console.log('No supplier found with that email');
        }

        await conn.close();
        await authConn.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabase();
