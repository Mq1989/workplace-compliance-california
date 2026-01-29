import mongoose from 'mongoose';

const TrainingRecordSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },

  // Required by LC 6401.9
  trainingDate: { type: Date, required: true },
  trainingType: {
    type: String,
    enum: ['initial', 'annual', 'new_hazard', 'plan_update'],
    required: true
  },

  moduleId: { type: String, required: true },
  moduleName: { type: String, required: true },

  contentSummary: { type: String, required: true },
  trainerName: { type: String, required: true },
  trainerQualifications: { type: String, required: true },

  // Completion tracking
  startedAt: { type: Date, required: true },
  completedAt: Date,
  durationMinutes: Number,

  // Quiz/assessment
  quizScore: Number,
  quizPassed: Boolean,

  // Acknowledgment
  employeeAcknowledged: { type: Boolean, default: false },
  acknowledgedAt: Date
}, {
  timestamps: true
});

// Index for 1-year retention queries (minimum)
TrainingRecordSchema.index({ organizationId: 1, trainingDate: 1 });
TrainingRecordSchema.index({ employeeId: 1, trainingType: 1 });

export default mongoose.models.TrainingRecord || mongoose.model('TrainingRecord', TrainingRecordSchema);
