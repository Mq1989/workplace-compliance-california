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
      'employee_updated',
      'employee_removed',
      'document_exported',
      'settings_changed',
      'pdf_generated',
      'training_module_created',
      'training_module_updated',
      'training_assigned',
      'quiz_submitted',
      'video_progress_updated',
      'chat_message_sent',
      'chat_message_flagged',
      'chat_message_reviewed',
      'anonymous_report_submitted',
      'anonymous_report_updated',
      'anonymous_report_responded',
      'employee_invited',
      'document_generated',
      'reminder_sent'
    ],
    required: true
  },

  resourceType: {
    type: String,
    enum: ['plan', 'incident', 'employee', 'training', 'organization', 'chat', 'anonymous_report', 'document', 'reminder', 'training_module'],
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
