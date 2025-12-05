const fs = require('fs');
const path = require('path');

/**
 * Switch MongoDB connection strings from Atlas to localhost
 * Use this for local development and testing
 */

const filesToUpdate = [
  {
    path: 'server/index.js',
    replacements: [
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication'",
        to: "mongoose.createConnection('mongodb://localhost:27017/authentication'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking'",
        to: "mongoose.createConnection('mongodb://localhost:27017/booking'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/ProductsAndServices'",
        to: "mongoose.createConnection('mongodb://localhost:27017/ProductsAndServices'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/promosDatabase'",
        to: "mongoose.createConnection('mongodb://localhost:27017/promosDatabase'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/scheduleCalendar'",
        to: "mongoose.createConnection('mongodb://localhost:27017/scheduleCalendar'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/backgroundImages'",
        to: "mongoose.createConnection('mongodb://localhost:27017/backgroundImages'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/goldustGallery'",
        to: "mongoose.createConnection('mongodb://localhost:27017/goldustGallery'"
      },
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/notification'",
        to: "mongoose.createConnection('mongodb://localhost:27017/notification'"
      }
    ]
  },
  {
    path: 'server/routes/bookings.js',
    replacements: [
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking'",
        to: "mongoose.createConnection('mongodb://localhost:27017/booking'"
      }
    ]
  },
  {
    path: 'server/config/database.js',
    replacements: [
      {
        from: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/",
        to: "mongoose.createConnection('mongodb://localhost:27017/"
      },
      {
        from: "'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/",
        to: "'mongodb://localhost:27017/"
      }
    ]
  }
];

function switchToLocalhost() {
  console.log('🔄 Switching MongoDB connections to localhost...\n');

  let updatedFiles = 0;
  let totalReplacements = 0;

  filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file.path}, skipping...`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;
    let replacementsInFile = 0;

    file.replacements.forEach(replacement => {
      const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      
      if (matches) {
        content = content.replace(regex, replacement.to);
        replacementsInFile += matches.length;
        fileChanged = true;
      }
    });

    if (fileChanged) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${file.path} (${replacementsInFile} replacements)`);
      updatedFiles++;
      totalReplacements += replacementsInFile;
    } else {
      console.log(`ℹ️  No changes needed in ${file.path}`);
    }
  });

  console.log(`\n✅ Done! Updated ${updatedFiles} files with ${totalReplacements} replacements`);
  console.log('\n📋 Next steps:');
  console.log('   1. Make sure local MongoDB is running (MongoDB Compass or mongod)');
  console.log('   2. Import your data using: node import-to-local.js');
  console.log('   3. Restart your server: cd server && npm start');
  console.log('   4. Your app now uses localhost:27017 instead of Atlas\n');
}

switchToLocalhost();
