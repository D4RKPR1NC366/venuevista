const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { EJSON } = require('bson');

// Database connections configuration
const DB_CONNECTIONS = {
  authentication: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication',
  ProductsAndServices: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/ProductsAndServices',
  backgroundImages: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/backgroundImages',
  booking: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking',
  cart: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/cart',
  categories: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/categories',
  goldustGallery: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/goldustGallery',
  promosDatabase: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/promosDatabase',
  reviews: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/reviews',
  scheduleCalendar: 'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/scheduleCalendar',
};

// Export all databases
router.get('/export', async (req, res) => {
  try {
    console.log('Starting database backup export...');
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      databases: {}
    };

    // Iterate through each database
    for (const [dbName, connectionString] of Object.entries(DB_CONNECTIONS)) {
      console.log(`Exporting database: ${dbName}`);
      
      let connection;
      try {
        // Create connection to this database
        connection = await mongoose.createConnection(connectionString, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });

        await new Promise((resolve, reject) => {
          connection.once('open', resolve);
          connection.once('error', reject);
        });

        // Get all collections in this database
        const collections = await connection.db.listCollections().toArray();
        backup.databases[dbName] = {};

        // Export each collection
        for (const collectionInfo of collections) {
          const collectionName = collectionInfo.name;
          console.log(`  Exporting collection: ${collectionName}`);
          
          const collection = connection.db.collection(collectionName);
          const documents = await collection.find({}).toArray();
          
          // Convert to Extended JSON to preserve ObjectIds
          backup.databases[dbName][collectionName] = EJSON.serialize(documents);
          console.log(`    Exported ${documents.length} documents`);
        }

        await connection.close();
      } catch (error) {
        console.error(`Error exporting database ${dbName}:`, error);
        if (connection) {
          await connection.close();
        }
        backup.databases[dbName] = { error: error.message };
      }
    }

    console.log('Backup export completed successfully');

    // Send as JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=goldust-backup-${Date.now()}.json`);
    res.json(backup);

  } catch (error) {
    console.error('Error during backup export:', error);
    res.status(500).json({ 
      error: 'Failed to export backup',
      message: error.message 
    });
  }
});

// Import/Restore databases
router.post('/restore', async (req, res) => {
  try {
    console.log('Starting database restore...');
    const backup = req.body;

    // Validate backup format
    if (!backup.databases || typeof backup.databases !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid backup format',
        message: 'Backup must contain a databases object' 
      });
    }

    const results = {
      restoreDate: new Date().toISOString(),
      backupDate: backup.exportDate,
      databases: {}
    };

    // Iterate through each database in the backup
    for (const [dbName, collections] of Object.entries(backup.databases)) {
      console.log(`Restoring database: ${dbName}`);
      
      if (!DB_CONNECTIONS[dbName]) {
        console.warn(`  Skipping unknown database: ${dbName}`);
        results.databases[dbName] = { 
          status: 'skipped',
          message: 'Database not in current configuration' 
        };
        continue;
      }

      // Skip if this database had an error during export
      if (collections.error) {
        results.databases[dbName] = { 
          status: 'skipped',
          message: `Original export had error: ${collections.error}` 
        };
        continue;
      }

      let connection;
      try {
        // Create connection to this database
        connection = await mongoose.createConnection(DB_CONNECTIONS[dbName], {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });

        await new Promise((resolve, reject) => {
          connection.once('open', resolve);
          connection.once('error', reject);
        });

        results.databases[dbName] = { collections: {} };

        // Restore each collection
        for (const [collectionName, documents] of Object.entries(collections)) {
          console.log(`  Restoring collection: ${collectionName}`);
          
          try {
            const collection = connection.db.collection(collectionName);
            
            // Deserialize Extended JSON to restore ObjectIds properly
            const deserializedDocs = EJSON.deserialize(documents);
            
            // Clear existing data (optional - comment out if you want to keep existing data)
            await collection.deleteMany({});
            
            // Insert backed up documents
            if (Array.isArray(deserializedDocs) && deserializedDocs.length > 0) {
              await collection.insertMany(deserializedDocs);
              results.databases[dbName].collections[collectionName] = {
                status: 'success',
                documentsRestored: deserializedDocs.length
              };
              console.log(`    Restored ${deserializedDocs.length} documents`);
            } else {
              results.databases[dbName].collections[collectionName] = {
                status: 'success',
                documentsRestored: 0
              };
              console.log(`    Collection was empty`);
            }
          } catch (error) {
            console.error(`    Error restoring collection ${collectionName}:`, error);
            results.databases[dbName].collections[collectionName] = {
              status: 'error',
              message: error.message
            };
          }
        }

        results.databases[dbName].status = 'success';
        await connection.close();

      } catch (error) {
        console.error(`Error restoring database ${dbName}:`, error);
        if (connection) {
          await connection.close();
        }
        results.databases[dbName].status = 'error';
        results.databases[dbName].message = error.message;
      }
    }

    console.log('Database restore completed');
    res.json(results);

  } catch (error) {
    console.error('Error during backup restore:', error);
    res.status(500).json({ 
      error: 'Failed to restore backup',
      message: error.message 
    });
  }
});

module.exports = router;
