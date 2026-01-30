import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  clerkUserId: { type: String, sparse: true },

  // Clerk invite integration
  inviteStatus: {
    type: String,
    enum: ['pending', 'sent', 'accepted', 'expired'],
    default: 'pending'
  },
  inviteSentAt: Date,
  inviteAcceptedAt: Date,

  // Portal access
  lastPortalLogin: Date,

  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  department: String,
  jobTitle: { type: String, required: true },

  role: {
    type: String,
    enum: ['employee', 'supervisor', 'manager', 'wvpp_administrator', 'owner'],
    default: 'employee'
  },

  hireDate: { type: Date, required: true },
  terminationDate: Date,
  isActive: { type: Boolean, default: true },

  // Training tracking
  initialTrainingCompletedAt: Date,
  lastAnnualTrainingCompletedAt: Date,
  nextTrainingDueDate: Date,

  // LMS tracking
  trainingPath: {
    startedAt: Date,
    completedAt: Date,
    currentModuleOrder: { type: Number, default: 1 }
  },

  // Q&A tracking for compliance
  hasCompletedQA: { type: Boolean, default: false },
  qaCompletedAt: Date,

  // Plan acknowledgment
  wvppAcknowledgedAt: Date,
  wvppAcknowledgedVersion: Number
}, {
  timestamps: true
});

EmployeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, isActive: 1 });

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
