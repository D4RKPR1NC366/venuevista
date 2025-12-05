require('dotenv').config({ path: './server/.env.production' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local MongoDB connection (default Compass connection)
const LOCAL_MONGODB = 'mongodb://localhost:27017';

// Directory where exported data is stored
const exportDir = path.join(__dirname, 'mongodb-export');

async function importDatabase(dbName) {
  console.log(`\n🔄 Importing database: ${dbName}`);
  
  try {
    const conn = await mongoose.createConnection(`${LOCAL_MONGODB}/${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ Connected to local MongoDB: ${dbName}`);

    const dbDir = path.join(exportDir, dbName);
    
    if (!fs.existsSync(dbDir)) {
      console.log(`⚠️  No export directory found for ${dbName}, skipping...`);
      await conn.close();
      return;
    }

    // Get all JSON files in the directory
    const files = fs.readdirSync(dbDir).filter(file => file.endsWith('.json'));
    console.log(`📦 Found ${files.length} collections to import`);

    // Import each collection
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
        
        // Clear existing data (optional - comment out if you want to keep existing data)
        await collection.deleteMany({});
        
        // Insert documents
        await collection.insertMany(documents);
        
        console.log(`  ✅ Imported ${documents.length} documents to ${collectionName}`);
      } catch (err) {
        console.error(`  ❌ Error importing ${collectionName}:`, err.message);
      }
    }

    await conn.close();
    console.log(`✅ Finished importing ${dbName}`);
  } catch (err) {
    console.error(`❌ Error connecting to local ${dbName}:`, err.message);
  }
}

async function importAll() {
  console.log('🚀 Starting local MongoDB import...\n');
  console.log(`📁 Import directory: ${exportDir}\n`);

  if (!fs.existsSync(exportDir)) {
    console.error('❌ Export directory not found! Please run export-all-data.js first.');
    process.exit(1);
  }

  // Get all database directories
  const databases = fs.readdirSync(exportDir).filter(item => {
    const itemPath = path.join(exportDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`Found ${databases.length} databases to import:`);
  databases.forEach(db => console.log(`  - ${db}`));
  console.log('');

  for (const dbName of databases) {
    await importAll(dbName);
  }

  console.log('\n✅ All databases imported successfully to local MongoDB!');
  console.log(`\n📋 You can now view your data in MongoDB Compass at: ${LOCAL_MONGODB}`);
  
  process.exit(0);
}

importAll().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
