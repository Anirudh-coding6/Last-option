const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'landscaping', 'hvac', 'roofing', 'cleaning', 'renovation', 'other']
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'qualified', 'converted', 'closed'],
    default: 'pending'
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'instagram', 'facebook', 'google', 'other'],
    default: 'website'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },
  followUpDate: {
    type: Date
  },
  notes: [{
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'
    }
  }],
  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'sms', 'meeting', 'quote_sent', 'follow_up']
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  submissionTime: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Date
  },
  appointmentBooked: {
    type: Boolean,
    default: false
  },
  estimatedValue: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Calculate AI score based on various factors
leadSchema.methods.calculateScore = function() {
  let score = 0;
  
  // Form submitted within 60 seconds (simulated)
  const submissionSpeed = Math.random() < 0.3; // 30% chance
  if (submissionSpeed) score += 3;
  
  // Message length > 20 words
  if (this.message && this.message.split(' ').length > 20) score += 2;
  
  // Target business type (high-value services)
  const highValueServices = ['plumbing', 'electrical', 'hvac', 'renovation'];
  if (highValueServices.includes(this.serviceType)) score += 2;
  
  // Source = referral/Instagram
  if (['referral', 'instagram'].includes(this.source)) score += 1;
  
  // Appointment booked instantly
  if (this.appointmentBooked) score += 1;
  
  // Opened follow-up (simulated)
  const openedFollowUp = Math.random() < 0.4; // 40% chance
  if (openedFollowUp) score += 1;
  
  // No response in 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  if (this.createdAt < threeDaysAgo && this.status === 'pending') score -= 2;
  
  // Invalid contact info (basic validation)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  const phoneValid = /^\(\d{3}\)\s\d{3}-\d{4}$/.test(this.phone) || /^\d{10}$/.test(this.phone.replace(/\D/g, ''));
  if (!emailValid || !phoneValid) score -= 1;
  
  this.score = Math.max(0, Math.min(10, score));
  return this.score;
};

// Get score category
leadSchema.methods.getScoreCategory = function() {
  if (this.score >= 8) return 'hot';
  if (this.score >= 5) return 'warm';
  return 'cold';
};

module.exports = mongoose.model('Lead', leadSchema);