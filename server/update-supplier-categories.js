require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');

const updateSupplierCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI_AUTH || 'mongodb://localhost:27017/authentication');
    console.log('Connected to MongoDB');

    // Update the specific supplier with categories
    const supplierEmail = 'ersmilrd@gmail.com';
    const categories = [
      '6930e0f4fa54a932075dae90',
      '692e6758effc83bb3e5ecc61',
      '6930c6f4b37a5b47a62c0072'
    ];

    const result = await Supplier.findOneAndUpdate(
      { email: supplierEmail },
      { $set: { categories: categories } },
      { new: true }
    );

    if (result) {
      console.log('✅ Successfully updated supplier with categories');
      console.log('Supplier email:', result.email);
      console.log('Categories:', result.categories);
    } else {
      console.log('❌ Supplier not found');
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error updating supplier:', error);
    process.exit(1);
  }
};

updateSupplierCategories();
