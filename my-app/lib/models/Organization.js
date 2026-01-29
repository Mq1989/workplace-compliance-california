import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  clerkOrgId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  dba: String,
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'CA' },
    zip: { type: String, required: true }
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    enum: ['retail', 'restaurant', 'construction', 'professional_services', 'manufacturing', 'other'],
    required: true
  },
  employeeCount: {
    type: Number,
    required: true
  },
  workplaceType: [{
    type: String,
    enum: ['office', 'retail_store', 'warehouse', 'outdoor', 'multiple_locations']
  }],

  // Subscription
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free'
  },
  planExpiresAt: Date,

  // Compliance tracking
  wvppCreatedAt: Date,
  lastTrainingDate: Date,
  nextTrainingDueDate: Date,
  lastPlanReviewDate: Date,
  nextPlanReviewDueDate: Date
}, {
  timestamps: true
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
