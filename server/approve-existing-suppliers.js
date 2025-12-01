const mongoose = require('mongoose');
const { Supplier } = require('./config/database');

async function approveExistingSuppliers() {
  try {
    // Find all suppliers without approval status
    const suppliersToUpdate = await Supplier.find({ 
      $or: [
        { isApproved: { $exists: false } },
        { isApproved: null }
      ]
    });
    
    console.log(`Found ${suppliersToUpdate.length} unapproved suppliers`);
    
    if (suppliersToUpdate.length === 0) {
      console.log('No suppliers need approval updates');
      process.exit(0);
    }
    
    // Update each supplier
    for (const supplier of suppliersToUpdate) {
      await Supplier.findByIdAndUpdate(supplier._id, {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: 'system-migration'
      });
      console.log(`✅ Approved: ${supplier.email}`);
    }
    
    console.log(`\n✅ Approved ${suppliersToUpdate.length} existing suppliers`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

approveExistingSuppliers();
