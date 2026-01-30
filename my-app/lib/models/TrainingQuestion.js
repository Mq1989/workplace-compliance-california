import mongoose from 'mongoose';

const TrainingQuestionSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingModule',
    required: true,
    index: true
  },

  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'select_all'],
    required: true
  },

  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }],

  explanation: String,

  order: { type: Number, default: 0 },
  points: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

TrainingQuestionSchema.index({ moduleId: 1, order: 1 });

export default mongoose.models.TrainingQuestion || mongoose.model('TrainingQuestion', TrainingQuestionSchema);
