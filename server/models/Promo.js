const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  promoCode: {
    type: String,
    unique: true,
    sparse: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableServices: [{
    type: String
  }],
  applicableProducts: [{
    type: String
  }],
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  timesUsed: {
    type: Number,
    default: 0
  },
  minimumBookingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'scheduled', 'expired', 'inactive'],
    default: 'scheduled'
  },
  termsAndConditions: {
    type: String
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-update status based on dates
promoSchema.pre('save', function(next) {
  const now = new Date();
  if (this.validFrom > now) {
    this.status = 'scheduled';
  } else if (this.validUntil < now) {
    this.status = 'expired';
  } else if (this.status === 'scheduled' || this.status === 'active') {
    this.status = 'active';
  }
  next();
});

module.exports = promoSchema;
