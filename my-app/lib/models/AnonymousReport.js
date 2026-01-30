import mongoose from 'mongoose';
import crypto from 'crypto';

const AnonymousReportSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  // Anonymous identifier — generated, NOT linked to employee
  anonymousId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ANON-${crypto.randomBytes(8).toString('hex').toUpperCase()}`
  },

  // Access token for reporter to view responses (hashed)
  accessTokenHash: { type: String, required: true },

  // Report content
  reportType: {
    type: String,
    enum: [
      'workplace_violence',
      'safety_concern',
      'harassment',
      'retaliation',
      'policy_violation',
      'other'
    ],
    required: true
  },

  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true },

  // Optional details (reporter chooses what to share)
  incidentDate: Date,
  incidentLocation: String,
  witnessesPresent: { type: Boolean },

  // Status tracking
  status: {
    type: String,
    enum: ['new', 'under_review', 'investigating', 'resolved', 'closed'],
    default: 'new'
  },

  // Admin handling (NO reporter identity stored)
  assignedTo: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Resolution
  resolution: String,
  resolvedAt: Date,

  // Internal notes (not visible to reporter)
  internalNotes: [{
    note: String,
    addedBy: String,
    addedAt: { type: Date, default: Date.now }
  }],

  // Link to official incident log (if applicable)
  linkedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },

  // Metadata
  submittedVia: { type: String, default: 'web' },
  ipHash: String
}, {
  timestamps: true
});

AnonymousReportSchema.index({ organizationId: 1, status: 1 });

// Static method to hash access token
AnonymousReportSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to generate access token
AnonymousReportSchema.statics.generateAccessToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

export default mongoose.models.AnonymousReport || mongoose.model('AnonymousReport', AnonymousReportSchema);
