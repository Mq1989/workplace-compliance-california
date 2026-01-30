import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      'training_due',
      'training_overdue',
      'annual_review',
      'incident_followup',
      'new_hire_training',
      'plan_acknowledgment',
      'record_retention',
      'qa_flagged_review',
      'anonymous_report_new'
    ],
    required: true
  },

  // Target
  targetType: {
    type: String,
    enum: ['employee', 'organization', 'incident', 'report'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

  // Scheduling
  scheduledFor: { type: Date, required: true, index: true },
  sentAt: Date,

  // Recipients
  recipientEmail: { type: String, required: true },
  recipientName: String,
  recipientRole: String,

  // Status
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'failed', 'cancelled'],
    default: 'scheduled'
  },

  // Content
  subject: String,
  message: String,

  // Retry tracking
  attempts: { type: Number, default: 0 },
  lastError: String
}, {
  timestamps: true
});

ReminderSchema.index({ status: 1, scheduledFor: 1 });
ReminderSchema.index({ organizationId: 1, type: 1 });

export default mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);
