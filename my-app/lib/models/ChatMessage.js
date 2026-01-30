import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
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

  // Conversation tracking
  conversationId: { type: String, required: true, index: true },

  // Message content
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: { type: String, required: true },

  // AI response metadata
  aiMetadata: {
    model: String,
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    responseTimeMs: Number,

    // Classification
    questionCategory: {
      type: String,
      enum: [
        'wvpp_content',
        'sb553_general',
        'reporting',
        'emergency',
        'training',
        'other'
      ]
    },

    // Complexity flag for human review
    flaggedForReview: { type: Boolean, default: false },
    flagReason: String,
    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String
  },

  // Compliance tracking
  countedAsQAInteraction: { type: Boolean, default: false },
  linkedTrainingRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingRecord' }
}, {
  timestamps: true
});

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
ChatMessageSchema.index({ organizationId: 1, 'aiMetadata.flaggedForReview': 1 });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
