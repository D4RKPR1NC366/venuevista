require('dotenv').config({ path: './server/.env.production' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Export directory where local data will be read from
const exportDir = path.join(__dirname, 'mongodb-local-backup');

// Atlas connection strings
const atlasConnections = {
  authentication: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication',
  booking: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking',
  ProductsAndServices: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/ProductsAndServices',
  promosDatabase: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/promosDatabase',
  scheduleCalendar: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/scheduleCalendar',
  backgroundImages: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/backgroundImages',
  goldustGallery: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/goldustGallery',
  notification: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/notification'
};

// Local MongoDB connection
const LOCAL_MONGODB = 'mongodb://localhost:27017';

// Step 1: Export from localhost
async function exportFromLocal(dbName) {
  console.log(`\n🔄 Exporting from local database: ${dbName}`);
  
  try {
    const conn = await mongoose.createConnection(`${LOCAL_MONGODB}/${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ Connected to local ${dbName}`);

    const collections = await conn.db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections`);

    const dbDir = path.join(exportDir, dbName);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`  📄 Exporting collection: ${collectionName}`);

      try {
        const collection = conn.db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        const filePath = path.join(dbDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
        
        console.log(`  ✅ Exported ${documents.length} documents`);
      } catch (err) {
        console.error(`  ❌ Error exporting ${collectionName}:`, err.message);
      }
    }

    await conn.close();
    console.log(`✅ Finished exporting ${dbName}`);
  } catch (err) {
    console.error(`❌ Error connecting to local ${dbName}:`, err.message);
  }
}

// Step 2: Import to Atlas
async function importToAtlas(dbName, connectionString) {
  console.log(`\n🔄 Importing to Atlas database: ${dbName}`);
  
  try {
    const conn = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ Connected to Atlas ${dbName}`);

    const dbDir = path.join(exportDir, dbName);
    
    if (!fs.existsSync(dbDir)) {
      console.log(`⚠️  No local backup found for ${dbName}, skipping...`);
      await conn.close();
      return;
    }

    const files = fs.readdirSync(dbDir).filter(file => file.endsWith('.json'));
    console.log(`📦 Found ${files.length} collections to import`);

    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      console.log(`  📄 Importing collection: ${collectionName}`);

      try {
        const filePath = path.join(dbDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const documents = JSON.parse(fileContent);
        
        if (documents.length === 0) {
          console.log(`  ⚠️  No documents in ${collectionName}, skipping...`);
          continue;
        }

        const collection = conn.db.collection(collectionName);
        
        // Clear existing data in Atlas (BE CAREFUL!)
        console.log(`  🗑️  Clearing existing data in Atlas ${collectionName}...`);
        await collection.deleteMany({});
        
        // Insert documents from local
        await collection.insertMany(documents);
        
        console.log(`  ✅ Imported ${documents.length} documents to Atlas`);
      } catch (err) {
        console.error(`  ❌ Error importing ${collectionName}:`, err.message);
      }
    }

    await conn.close();
    console.log(`✅ Finished importing ${dbName} to Atlas`);
  } catch (err) {
    console.error(`❌ Error connecting to Atlas ${dbName}:`, err.message);
  }
}

async function syncLocalToAtlas() {
  console.log('🚀 Starting sync from localhost to MongoDB Atlas...\n');
  console.log('⚠️  WARNING: This will OVERWRITE data in Atlas with local data!\n');
  
  // Create backup directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log('📋 Step 1: Exporting from localhost...\n');
  
  for (const dbName of Object.keys(atlasConnections)) {
    await exportFromLocal(dbName);
  }

  console.log('\n📋 Step 2: Importing to Atlas...\n');
  
  for (const [dbName, connectionString] of Object.entries(atlasConnections)) {
    await importToAtlas(dbName, connectionString);
  }

  console.log('\n✅ Sync complete! Local data has been pushed to Atlas.');
  console.log(`📂 Backup saved in: ${exportDir}`);
  
  process.exit(0);
}

// Confirmation prompt
console.log('⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️');
console.log('This script will REPLACE all data in MongoDB Atlas with your local data!');
console.log('Make sure you have a backup of your Atlas data before proceeding.\n');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  syncLocalToAtlas().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}, 5000);
