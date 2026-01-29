import mongoose from 'mongoose';

const IncidentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },

  // Required by LC 6401.9(d)
  incidentDate: { type: Date, required: true },
  incidentTime: { type: String, required: true }, // "14:30" format
  location: {
    type: {
      type: String,
      enum: ['workplace', 'parking_lot', 'outside_workplace', 'other'],
      required: true
    },
    description: { type: String, required: true }
  },

  workplaceViolenceTypes: [{
    type: String,
    enum: ['type1', 'type2', 'type3', 'type4']
  }],

  incidentTypes: [{
    type: String,
    enum: [
      'physical_attack_no_weapon',
      'attack_with_weapon',
      'threat_physical_force',
      'threat_weapon',
      'sexual_assault',
      'sexual_threat',
      'animal_attack',
      'other'
    ]
  }],

  detailedDescription: { type: String, required: true },

  perpetratorClassification: {
    type: String,
    enum: [
      'client_customer',
      'family_friend_of_client',
      'stranger_criminal_intent',
      'coworker',
      'supervisor_manager',
      'partner_spouse',
      'parent_relative',
      'other'
    ],
    required: true
  },

  circumstances: {
    usualJobDuties: Boolean,
    poorlyLitArea: Boolean,
    rushed: Boolean,
    lowStaffing: Boolean,
    isolated: Boolean,
    unableToGetHelp: Boolean,
    communitySetting: Boolean,
    unfamiliarLocation: Boolean,
    other: String
  },

  consequences: {
    securityContacted: Boolean,
    securityResponse: String,
    lawEnforcementContacted: Boolean,
    lawEnforcementResponse: String,
    actionsToProtectEmployees: String
  },

  injuries: {
    occurred: Boolean,
    description: String
  },

  emergencyMedical: {
    contacted: Boolean,
    responderType: String,
    description: String
  },

  calOshaReporting: {
    required: Boolean,
    reportedAt: Date,
    representativeName: String
  },

  // Metadata (no PII - per LC 6401.9)
  completedBy: {
    name: { type: String, required: true },
    title: { type: String, required: true }
  },
  completedAt: { type: Date, default: Date.now },

  // Investigation tracking
  investigationStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  investigationNotes: String,
  correctiveActionsTaken: [String]
}, {
  timestamps: true
});

// Index for 5-year retention queries
IncidentSchema.index({ organizationId: 1, incidentDate: 1 });

export default mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);
