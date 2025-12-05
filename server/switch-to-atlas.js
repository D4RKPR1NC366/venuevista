const fs = require('fs');
const path = require('path');

/**
 * Switch MongoDB connection strings from localhost back to Atlas
 * Use this when you're done with local development and want to deploy
 */

const filesToUpdate = [
  {
    path: 'server/index.js',
    replacements: [
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/authentication'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/authentication'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/booking'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/ProductsAndServices'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/ProductsAndServices'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/promosDatabase'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/promosDatabase'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/scheduleCalendar'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/scheduleCalendar'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/backgroundImages'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/backgroundImages'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/goldustGallery'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/goldustGallery'"
      },
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/notification'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/notification'"
      }
    ]
  },
  {
    path: 'server/routes/bookings.js',
    replacements: [
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/booking'",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/booking'"
      }
    ]
  },
  {
    path: 'server/config/database.js',
    replacements: [
      {
        from: "mongoose.createConnection('mongodb://localhost:27017/",
        to: "mongoose.createConnection('mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/"
      },
      {
        from: "'mongodb://localhost:27017/",
        to: "'mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/"
      }
    ]
  }
];

function switchToAtlas() {
  console.log('🔄 Switching MongoDB connections to Atlas...\n');

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
  console.log('   1. Optionally export local changes back to Atlas');
  console.log('   2. Restart your server: cd server && npm start');
  console.log('   3. Your app now uses MongoDB Atlas (cloud) again\n');
}

switchToAtlas();
