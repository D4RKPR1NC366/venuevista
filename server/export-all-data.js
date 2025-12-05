const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection strings from your server (hardcoded to avoid dotenv dependency)
const connections = {
  authentication: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication',
  booking: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking',
  ProductsAndServices: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/ProductsAndServices',
  promosDatabase: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/promosDatabase',
  scheduleCalendar: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/scheduleCalendar',
  backgroundImages: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/backgroundImages',
  goldustGallery: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/goldustGallery',
  notification: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/notification'
};

// Create export directory
const exportDir = path.join(__dirname, 'mongodb-export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

async function exportDatabase(dbName, connectionString) {
  console.log(`\n🔄 Exporting database: ${dbName}`);
  
  try {
    const conn = mongoose.createConnection(connectionString);
    
    // Wait for connection to open
    await new Promise((resolve, reject) => {
      conn.once('open', resolve);
      conn.once('error', reject);
    });

    console.log(`✅ Connected to ${dbName}`);

    // Get all collections
    const collections = await conn.db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections`);

    const dbDir = path.join(exportDir, dbName);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Export each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`  📄 Exporting collection: ${collectionName}`);

      try {
        const collection = conn.db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        const filePath = path.join(dbDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
        
        console.log(`  ✅ Exported ${documents.length} documents to ${collectionName}.json`);
      } catch (err) {
        console.error(`  ❌ Error exporting ${collectionName}:`, err.message);
      }
    }

    await conn.close();
    console.log(`✅ Finished exporting ${dbName}`);
  } catch (err) {
    console.error(`❌ Error connecting to ${dbName}:`, err.message);
  }
}

async function exportAll() {
  console.log('🚀 Starting MongoDB Atlas export...\n');
  console.log(`📁 Export directory: ${exportDir}\n`);

  for (const [dbName, connectionString] of Object.entries(connections)) {
    await exportDatabase(dbName, connectionString);
  }

  console.log('\n✅ All databases exported successfully!');
  console.log(`\n📂 Your data is in: ${exportDir}`);
  console.log('\n📋 To import into MongoDB Compass:');
  console.log('   1. Open MongoDB Compass');
  console.log('   2. Connect to your local MongoDB instance');
  console.log('   3. Create a database with the same name (e.g., "authentication")');
  console.log('   4. For each JSON file, click "Add Data" → "Import File"');
  console.log('   5. Select the corresponding JSON file and import');
  
  process.exit(0);
}

exportAll().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
