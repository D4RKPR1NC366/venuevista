// Migration script to add isAvailable field to all existing suppliers
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');

mongoose.connect('mongodb://localhost:27017/goldust', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateAvailability() {
  try {
    console.log('Starting migration...');
    
    // Find all suppliers without isAvailable field or where it's undefined
    const result = await Supplier.updateMany(
      { isAvailable: { $exists: false } },
      { $set: { isAvailable: true } }
    );
    
    console.log(`Migration complete! Updated ${result.modifiedCount} suppliers.`);
    
    // Verify the update
    const suppliers = await Supplier.find({}).select('email isAvailable');
    console.log('\nAll suppliers:');
    suppliers.forEach(s => {
      console.log(`- ${s.email}: isAvailable = ${s.isAvailable}`);
    });
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

migrateAvailability();
