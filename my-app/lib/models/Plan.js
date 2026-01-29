import mongoose from 'mongoose';

const ResponsiblePersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  responsibilities: [String],
  phone: { type: String, required: true },
  email: { type: String, required: true }
});

const HazardAssessmentSchema = new mongoose.Schema({
  hazardType: {
    type: String,
    enum: ['type1', 'type2', 'type3', 'type4'],
    required: true
  },
  description: { type: String, required: true },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  controlMeasures: [String],
  assessedAt: { type: Date, default: Date.now },
  assessedBy: String
});

const PlanSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  version: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },

  // Plan Content (maps to Cal/OSHA template sections)
  responsiblePersons: [ResponsiblePersonSchema],

  employeeInvolvement: {
    meetingFrequency: String,
    meetingDescription: String,
    trainingInvolvementDescription: String,
    reportingProceduresDescription: String
  },

  complianceProcedures: {
    trainingDescription: String,
    supervisionDescription: String,
    recognitionProgram: String,
    disciplinaryProcess: String
  },

  communicationSystem: {
    newEmployeeOrientation: { type: Boolean, default: true },
    regularMeetings: { type: Boolean, default: true },
    meetingFrequency: String,
    postedInformation: { type: Boolean, default: true },
    postingLocations: String,
    reportingHotline: String,
    reportingForm: String,
    anonymousReporting: { type: Boolean, default: false }
  },

  emergencyResponse: {
    alertMethods: [String],
    evacuationPlanDescription: String,
    shelterLocations: [String],
    emergencyContacts: [ResponsiblePersonSchema],
    lawEnforcementContact: String
  },

  hazardAssessments: [HazardAssessmentSchema],

  hazardCorrectionProcedures: {
    immediateThreatProcedure: String,
    documentationProcess: String,
    engineeringControls: [String],
    workPracticeControls: [String],
    administrativeControls: [String]
  },

  postIncidentProcedures: {
    investigationSteps: [String],
    supportResources: [String],
    counselingAvailable: { type: Boolean, default: false },
    counselingProvider: String
  },

  trainingProgram: {
    initialTrainingDescription: String,
    annualRefresherDescription: String,
    newHazardTrainingDescription: String,
    trainingTopics: [String]
  },

  recordkeepingProcedures: {
    hazardRecordsRetention: { type: Number, default: 5 },
    trainingRecordsRetention: { type: Number, default: 1 },
    incidentLogRetention: { type: Number, default: 5 },
    accessProcedure: String
  },

  planAccessibility: {
    physicalLocation: String,
    electronicAccess: { type: Boolean, default: true },
    electronicLocation: String
  },

  reviewSchedule: {
    annualReviewMonth: Number,
    lastReviewDate: Date,
    nextReviewDate: Date,
    reviewProcedure: String
  },

  authorization: {
    authorizerName: String,
    authorizerTitle: String,
    authorizationStatement: String,
    signedAt: Date
  },

  // Metadata
  publishedAt: Date,
  archivedAt: Date
}, {
  timestamps: true
});

export default mongoose.models.Plan || mongoose.model('Plan', PlanSchema);
