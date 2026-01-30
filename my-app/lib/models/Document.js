import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      'wvpp_full',
      'wvpp_summary',
      'emergency_contacts',
      'incident_report_form',
      'training_acknowledgment',
      'employee_acknowledgment',
      'incident_log_export',
      'training_records_export',
      'compliance_report',
      'posting_notice',
      'training_certificate'
    ],
    required: true
  },

  // File storage
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: Number,
  mimeType: { type: String, default: 'application/pdf' },

  // Version tracking
  version: { type: Number, default: 1 },
  planVersion: Number,

  // Generation context
  generatedBy: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },

  // For exports with date ranges
  dateRangeStart: Date,
  dateRangeEnd: Date,

  // For employee-specific docs
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

  // Metadata
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

DocumentSchema.index({ organizationId: 1, type: 1 });
DocumentSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
