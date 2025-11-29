const mongoose = require('mongoose');

// Atlas connection string
const ATLAS_URI = 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';

// Local connection strings (for migration from)
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

async function testAtlasConnection() {
  console.log('🔍 Testing Atlas connection...');
  try {
    const testConn = mongoose.createConnection(`${ATLAS_URI}test`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    await new Promise((resolve, reject) => {
      testConn.on('connected', () => {
        console.log('✅ Atlas connection successful');
        testConn.close();
        resolve();
      });
      testConn.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    return true;
  } catch (error) {
    console.error('❌ Atlas connection failed:', error.message);
    return false;
  }
}

async function testLocalConnection(dbName) {
  try {
    const testConn = mongoose.createConnection(LOCAL_CONNECTIONS[dbName], {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2000
    });

    await new Promise((resolve, reject) => {
      testConn.on('connected', () => {
        testConn.close();
        resolve();
      });
      testConn.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function migrateDatabase(dbName) {
  console.log(`\n=== Migrating ${dbName} ===`);
  
  // Test if local database exists
  const localExists = await testLocalConnection(dbName);
  if (!localExists) {
    console.log(`⚠️  No local ${dbName} database found - skipping`);
    return { migrated: 0, skipped: true };
  }

  try {
    // Connect to local database
    console.log(`🔗 Connecting to local ${dbName}...`);
    const localConn = mongoose.createConnection(LOCAL_CONNECTIONS[dbName], {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await new Promise((resolve, reject) => {
      localConn.on('connected', resolve);
      localConn.on('error', reject);
      setTimeout(() => reject(new Error('Local connection timeout')), 5000);
    });
    
    // Connect to Atlas database
    console.log(`🔗 Connecting to Atlas ${dbName}...`);
    const atlasConn = mongoose.createConnection(`${ATLAS_URI}${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await new Promise((resolve, reject) => {
      atlasConn.on('connected', resolve);
      atlasConn.on('error', reject);
      setTimeout(() => reject(new Error('Atlas connection timeout')), 10000);
    });

    // Get all collections from local database
    const collections = await localConn.db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections in ${dbName}`);

    let totalDocuments = 0;
    let collectionsProcessed = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`  📄 Processing collection: ${collectionName}`);

      try {
        // Get local collection
        const localCollection = localConn.collection(collectionName);
        
        // Get Atlas collection
        const atlasCollection = atlasConn.collection(collectionName);

        // Find all documents in local collection
        const documents = await localCollection.find({}).toArray();
        
        if (documents.length > 0) {
          // Check if Atlas collection has documents
          const existingCount = await atlasCollection.countDocuments();
          
          if (existingCount > 0) {
            console.log(`    ⚠️  Atlas collection ${collectionName} already has ${existingCount} documents`);
            console.log(`    🔄 Merging ${documents.length} local documents...`);
            
            // Insert documents that don't exist (based on _id)
            let insertedCount = 0;
            for (const doc of documents) {
              try {
                await atlasCollection.updateOne(
                  { _id: doc._id },
                  { $setOnInsert: doc },
                  { upsert: true }
                );
                insertedCount++;
              } catch (err) {
                if (!err.message.includes('duplicate key')) {
                  console.log(`      ⚠️  Error inserting document: ${err.message}`);
                }
              }
            }
            console.log(`    ✅ Merged ${insertedCount} documents`);
            totalDocuments += insertedCount;
          } else {
            // Insert all documents into empty Atlas collection
            await atlasCollection.insertMany(documents, { ordered: false });
            console.log(`    ✅ Migrated ${documents.length} documents`);
            totalDocuments += documents.length;
          }
        } else {
          console.log(`    ⚪ No documents found in ${collectionName}`);
        }
        
        collectionsProcessed++;
      } catch (collError) {
        console.log(`    ❌ Error processing ${collectionName}: ${collError.message}`);
      }
    }

    console.log(`📊 ${dbName} migration completed: ${totalDocuments} documents migrated from ${collectionsProcessed} collections`);

    // Close connections
    await localConn.close();
    await atlasConn.close();
    
    return { migrated: totalDocuments, collections: collectionsProcessed, skipped: false };
  } catch (error) {
    console.error(`❌ Error migrating ${dbName}:`, error.message);
    return { migrated: 0, collections: 0, error: error.message };
  }
}

async function runMigration() {
  console.log('🚀 Starting comprehensive data migration from localhost to Atlas...');
  console.log(`🌐 Atlas URI: ${ATLAS_URI}`);
  
  // Test Atlas connection first
  const atlasReady = await testAtlasConnection();
  if (!atlasReady) {
    console.error('❌ Cannot connect to Atlas. Please check your connection string and credentials.');
    return;
  }

  let totalMigrated = 0;
  let totalCollections = 0;
  const results = {};

  console.log('\n📋 Migration Summary:');
  console.log('=' + '='.repeat(50));

  for (const dbName of Object.keys(LOCAL_CONNECTIONS)) {
    const result = await migrateDatabase(dbName);
    results[dbName] = result;
    
    if (!result.skipped && !result.error) {
      totalMigrated += result.migrated;
      totalCollections += result.collections;
    }
  }

  console.log('\n🎉 Final Migration Results:');
  console.log('=' + '='.repeat(50));
  console.log(`📊 Total documents migrated: ${totalMigrated}`);
  console.log(`📁 Total collections processed: ${totalCollections}`);
  
  console.log('\n📈 Database Summary:');
  for (const [dbName, result] of Object.entries(results)) {
    if (result.skipped) {
      console.log(`  ${dbName}: ⚪ Skipped (no local data)`);
    } else if (result.error) {
      console.log(`  ${dbName}: ❌ Error - ${result.error}`);
    } else {
      console.log(`  ${dbName}: ✅ ${result.migrated} documents, ${result.collections} collections`);
    }
  }

  console.log('\n✅ Migration completed!');
  console.log('🎯 Your application is now ready to use Atlas exclusively.');
  
  if (totalMigrated > 0) {
    console.log('\n⚠️  Important: Please verify your data in Atlas before shutting down local MongoDB.');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Migration script completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, migrateDatabase, testAtlasConnection };