import mongoose from 'mongoose';

const AnonymousThreadSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnonymousReport',
    required: true,
    index: true
  },

  // Message content
  messageType: {
    type: String,
    enum: ['admin_question', 'reporter_response', 'admin_update'],
    required: true
  },

  content: { type: String, required: true },

  // For admin messages
  adminUserId: String,
  adminName: String,

  // Read tracking
  readByAdmin: { type: Boolean, default: false },
  readByReporter: { type: Boolean, default: false }
}, {
  timestamps: true
});

AnonymousThreadSchema.index({ reportId: 1, createdAt: 1 });

export default mongoose.models.AnonymousThread || mongoose.model('AnonymousThread', AnonymousThreadSchema);
