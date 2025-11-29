const mongoose = require('mongoose');
require('dotenv').config();

// Atlas connection string
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/';

async function verifyAtlasConnections() {
  console.log('🔍 Verifying Atlas database connections...');
  console.log(`Atlas URI: ${ATLAS_URI}`);
  
  const databases = [
    'ProductsAndServices',
    'authentication', 
    'booking',
    'scheduleCalendar',
    'promosDatabase',
    'backgroundImages',
    'goldustGallery',
    'reviews'
  ];

  let successCount = 0;
  const errors = [];

  for (const dbName of databases) {
    try {
      console.log(`\n=== Testing ${dbName} ===`);
      
      const connection = mongoose.createConnection(`${ATLAS_URI}${dbName}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // Wait for connection to be ready
      await new Promise((resolve, reject) => {
        connection.on('connected', resolve);
        connection.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
      
      // Get collections
      const collections = await connection.db.listCollections().toArray();
      console.log(`✅ Connected successfully - ${collections.length} collections found`);
      
      // Show collection names and document counts
      for (const col of collections) {
        const count = await connection.db.collection(col.name).countDocuments();
        console.log(`  - ${col.name}: ${count} documents`);
      }
      
      await connection.close();
      successCount++;
      
    } catch (error) {
      console.log(`❌ Failed to connect: ${error.message}`);
      errors.push(`${dbName}: ${error.message}`);
    }
  }

  console.log('\n🎉 Connection Verification Summary:');
  console.log(`✅ Successful connections: ${successCount}/${databases.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Failed connections:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n📊 Atlas Database Status:');
  if (successCount === databases.length) {
    console.log('🟢 All databases are ready for production deployment!');
  } else {
    console.log('🟡 Some databases may need attention before deployment.');
  }

  return successCount === databases.length;
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyAtlasConnections()
    .then((allSuccess) => {
      if (allSuccess) {
        console.log('\n✅ Your application is ready for Hostinger deployment!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Please check Atlas connections before deploying.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyAtlasConnections };