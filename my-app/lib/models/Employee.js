import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  clerkUserId: { type: String, sparse: true },

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

  // Plan acknowledgment
  wvppAcknowledgedAt: Date,
  wvppAcknowledgedVersion: Number
}, {
  timestamps: true
});

EmployeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, isActive: 1 });

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
