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

  // Compliance settings
  settings: {
    trainingReminderDays: { type: [Number], default: [30, 7, 1] },
    autoAssignTraining: { type: Boolean, default: true },
    requireQuizPass: { type: Boolean, default: true },
    quizPassingScore: { type: Number, default: 70 },
    qaResponseEmail: String,
    timezone: { type: String, default: 'America/Los_Angeles' },
    enableAIQA: { type: Boolean, default: true },
    aiReviewThreshold: { type: String, default: 'complex' }
  },

  // Compliance scores (cached)
  complianceScore: {
    overall: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    planCurrent: { type: Number, default: 0 },
    incidentLog: { type: Number, default: 0 },
    lastCalculated: Date
  },

  // AI Q&A context — store WVPP content for RAG
  wvppContent: {
    lastUpdated: Date,
    contentHash: String
  },

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
