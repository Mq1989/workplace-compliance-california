import mongoose from 'mongoose';

const TrainingModuleSchema = new mongoose.Schema({
  moduleId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },

  // Sequencing (LMS)
  order: { type: Number, required: true },

  // Content
  type: {
    type: String,
    enum: ['video', 'interactive', 'document'],
    default: 'video'
  },
  videoUrl: String,
  videoDurationMinutes: Number,
  thumbnailUrl: String,
  transcript: String,

  // Categorization per SB 553 requirements
  category: {
    type: String,
    enum: [
      'wvpp_overview',
      'reporting_procedures',
      'hazard_recognition',
      'avoidance_strategies',
      'incident_log',
      'emergency_response',
      'de_escalation',
      'active_shooter'
    ],
    required: true
  },

  // Requirements
  isRequired: { type: Boolean, default: true },

  // Quiz settings
  hasQuiz: { type: Boolean, default: true },
  passingScore: { type: Number, default: 70 },
  maxAttempts: { type: Number, default: 0 },

  // Metadata
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },

  // Analytics
  totalCompletions: { type: Number, default: 0 },
  avgQuizScore: { type: Number, default: 0 }
}, {
  timestamps: true
});

TrainingModuleSchema.index({ order: 1, isActive: 1 });

export default mongoose.models.TrainingModule || mongoose.model('TrainingModule', TrainingModuleSchema);
