import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: { type: String, required: true },

  action: {
    type: String,
    enum: [
      'plan_created',
      'plan_updated',
      'plan_published',
      'plan_archived',
      'incident_logged',
      'incident_updated',
      'training_completed',
      'employee_added',
      'employee_removed',
      'document_exported',
      'settings_changed'
    ],
    required: true
  },

  resourceType: {
    type: String,
    enum: ['plan', 'incident', 'employee', 'training', 'organization'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for audit queries
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
