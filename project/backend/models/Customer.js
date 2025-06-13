const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  preferences: {
    serviceTypes: [String],
    communicationMethod: {
      type: String,
      enum: ['email', 'phone', 'sms'],
      default: 'email'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  serviceHistory: [{
    serviceType: String,
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'
    },
    date: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);