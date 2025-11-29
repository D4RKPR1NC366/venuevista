const mongoose = require('mongoose');
require('dotenv').config();

// Atlas connection string
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';

// Local connection strings (for migration)
const LOCAL_CONNECTIONS = {
  ProductsAndServices: 'mongodb://127.0.0.1:27017/ProductsAndServices',
  authentication: 'mongodb://127.0.0.1:27017/authentication',
  booking: 'mongodb://127.0.0.1:27017/booking',
  scheduleCalendar: 'mongodb://127.0.0.1:27017/scheduleCalendar',
  promosDatabase: 'mongodb://127.0.0.1:27017/promosDatabase',
  backgroundImages: 'mongodb://127.0.0.1:27017/backgroundImages',
  goldustGallery: 'mongodb://127.0.0.1:27017/goldustGallery',
  reviews: 'mongodb://127.0.0.1:27017/reviews'
};

async function migrateDatabase(dbName) {
  console.log(`\n=== Migrating ${dbName} ===`);
  
  try {
    // Connect to local database
    const localConn = await mongoose.createConnection(LOCAL_CONNECTIONS[dbName], {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Connect to Atlas database
    const atlasConn = await mongoose.createConnection(`${ATLAS_URI}${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Get all collections from local database
    const collections = await localConn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in ${dbName}`);

    let totalDocuments = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`  Migrating collection: ${collectionName}`);

      // Get local collection
      const localCollection = localConn.collection(collectionName);
      
      // Get Atlas collection
      const atlasCollection = atlasConn.collection(collectionName);

      // Find all documents in local collection
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length > 0) {
        // Clear existing documents in Atlas collection (optional)
        await atlasCollection.deleteMany({});
        
        // Insert documents into Atlas
        await atlasCollection.insertMany(documents);
        console.log(`    ✓ Migrated ${documents.length} documents`);
        totalDocuments += documents.length;
      } else {
        console.log(`    ⚠ No documents found`);
      }
    }

    console.log(`Database ${dbName} migration completed: ${totalDocuments} total documents`);

    // Close connections
    await localConn.close();
    await atlasConn.close();
    
    return totalDocuments;
  } catch (error) {
    console.error(`Error migrating ${dbName}:`, error.message);
    return 0;
  }
}

async function runMigration() {
  console.log('🚀 Starting data migration from localhost to Atlas...');
  console.log(`Atlas URI: ${ATLAS_URI}`);
  
  let totalMigrated = 0;
  const errors = [];

  for (const dbName of Object.keys(LOCAL_CONNECTIONS)) {
    try {
      const count = await migrateDatabase(dbName);
      totalMigrated += count;
    } catch (error) {
      console.error(`Failed to migrate ${dbName}:`, error.message);
      errors.push(`${dbName}: ${error.message}`);
    }
  }

  console.log('\n🎉 Migration Summary:');
  console.log(`Total documents migrated: ${totalMigrated}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n✅ Migration completed!');
  console.log('Your application is now ready for Hostinger deployment.');
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, migrateDatabase };