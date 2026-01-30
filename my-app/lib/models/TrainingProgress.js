import mongoose from 'mongoose';

const TrainingProgressSchema = new mongoose.Schema({
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
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingModule',
    required: true
  },

  // Video progress
  videoProgress: { type: Number, default: 0 },
  videoCompleted: { type: Boolean, default: false },
  videoCompletedAt: Date,
  lastWatchedPosition: { type: Number, default: 0 },

  // Quiz progress
  quizAttempts: [{
    attemptNumber: Number,
    score: Number,
    passed: Boolean,
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingQuestion' },
      selectedOptionIds: [String],
      isCorrect: Boolean
    }],
    completedAt: { type: Date, default: Date.now }
  }],
  quizPassed: { type: Boolean, default: false },
  quizPassedAt: Date,
  bestScore: { type: Number, default: 0 },

  // Overall module status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  completedAt: Date,

  // For compliance tracking
  assignedAt: { type: Date, default: Date.now },
  dueDate: Date
}, {
  timestamps: true
});

TrainingProgressSchema.index({ employeeId: 1, moduleId: 1 }, { unique: true });
TrainingProgressSchema.index({ organizationId: 1, status: 1 });

export default mongoose.models.TrainingProgress || mongoose.model('TrainingProgress', TrainingProgressSchema);
