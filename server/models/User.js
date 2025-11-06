const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
