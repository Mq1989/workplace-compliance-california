# Product Requirements Document (PRD)
# SafeWorkCA — Complete SB 553 Compliance Platform

## Document Information
- **Version:** 3.0
- **Created:** January 29, 2026
- **Updated:** January 29, 2026
- **Author:** Quinn (Product Owner)
- **Status:** Full Platform Build - Ready for Development

---

## 1. Executive Summary

### 1.1 Current State
SafeWorkCA currently has:
- ✅ Clerk authentication
- ✅ MongoDB/Mongoose data models (Organization, Plan, Incident, Employee, TrainingRecord, AuditLog)
- ✅ Organization onboarding flow
- ✅ WVPP creation wizard (11 steps)
- ✅ Basic plans list and detail views
- ✅ Dashboard layout with navigation

### 1.2 Problem Statement
The current implementation is essentially a form wizard that generates a one-time document. However, **SB 553 compliance is not a one-time activity**. California Labor Code Section 6401.9 requires:

1. **Annual training** for all employees with interactive Q&A component
2. **Annual plan review** (minimum) plus reviews after any incident
3. **Violent incident logging** for every incident with 5-year retention
4. **Training records** with specific required fields and 1-year retention
5. **Hazard assessment records** with 5-year retention
6. **Employee access** to all records within 15 calendar days of request
7. **Employee involvement** documentation in plan development

### 1.3 Solution: Full Compliance Platform
Transform SafeWorkCA from a document generator into a complete compliance management platform that:

1. **Delivers annual training** via built-in LMS with video modules, quizzes, and sequential learning paths
2. **Provides AI-powered Q&A** using OpenAI to answer employee questions about WVPP and SB 553
3. **Automates compliance tracking** with dashboards showing real-time status
4. **Maintains incident logs** with all required fields and automatic PII detection
5. **Enables anonymous reporting** for employees to report concerns without identification
6. **Generates printable documents** (emergency contacts, posting materials, acknowledgments)
7. **Sends automated reminders** for training due dates, annual reviews, and follow-ups
8. **Provides audit-ready exports** of all compliance documentation

### 1.4 Target Market
- **Primary:** California employers with 10-100 employees (no dedicated HR/compliance staff)
- **Secondary:** California employers with 100-200 employees (HR generalist handling compliance)
- **Industries:** Retail, restaurant/food service, construction, professional services, manufacturing

### 1.5 Pricing Strategy
| Tier | Price | Features |
|------|-------|----------|
| **Starter** | $29/month | 1 location, 25 employees, WVPP generation, incident log, email reminders |
| **Professional** | $79/month | 3 locations, 100 employees, LMS training, AI Q&A, compliance dashboard, anonymous reporting |
| **Enterprise** | $199/month | Unlimited locations/employees, API access, custom branding, priority support, advanced analytics |

---

## 2. Technical Architecture Overview

### 2.1 Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+ (App Router), React, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | Clerk (Organizations, Roles, Magic Links) |
| **AI/ML** | OpenAI GPT-4o-mini (Q&A chatbot, content generation) |
| **File Storage** | Vercel Blob |
| **Email** | Resend |
| **Payments** | Stripe |
| **Hosting** | Vercel |
| **Video** | Self-hosted via Vercel Blob or external CDN |

### 2.2 Clerk Organization & Roles

**Organization Structure:**
- Each company = 1 Clerk Organization
- All users belong to an organization
- Roles determine access levels

**Role Definitions:**

| Role | Clerk Role Key | Permissions |
|------|---------------|-------------|
| **Owner** | `org:owner` | Full admin, billing, delete org, manage all users |
| **Admin/Manager** | `org:admin` | Manage employees, view all data, respond to Q&A, investigate incidents, manage training |
| **Employee** | `org:member` | Portal access only: training, view WVPP, submit anonymous reports, AI Q&A |

**Clerk Configuration:**
```javascript
// Clerk organization roles setup
const organizationRoles = {
  owner: {
    name: 'Owner',
    permissions: ['org:manage', 'billing:manage', 'users:manage', 'data:all']
  },
  admin: {
    name: 'Manager',
    permissions: ['users:manage', 'data:all', 'training:manage', 'incidents:manage']
  },
  member: {
    name: 'Employee',
    permissions: ['portal:access', 'training:complete', 'reports:submit']
  }
};
```

### 2.3 Employee Invite Flow

```
1. Admin adds employee in SafeWorkCA (name, email, job title, hire date)
2. System creates Employee record in MongoDB
3. System triggers Clerk organization invitation with role "member"
4. Clerk sends magic link email to employee
5. Employee clicks magic link → creates Clerk account → auto-joins org
6. Employee redirected to /portal with their assigned training
7. MongoDB Employee record updated with clerkUserId
```

**Implementation:**
```javascript
// lib/clerk/inviteEmployee.js
import { clerkClient } from '@clerk/nextjs/server';

export async function inviteEmployee(organizationId, employee) {
  // Create Clerk organization invitation
  const invitation = await clerkClient.organizations.createOrganizationInvitation({
    organizationId: organizationId,
    emailAddress: employee.email,
    role: 'org:member',
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/welcome`
  });
  
  return invitation;
}
```

---

## 3. Gap Analysis: Current vs. Required

### 3.1 Missing Core Features

| Feature | Statutory Requirement | Current State | Priority |
|---------|----------------------|---------------|----------|
| Built-in LMS | LC 6401.9(c)(3) | ❌ Not built | **P0** |
| Training Video Modules | LC 6401.9(c)(3) | ❌ Not built | **P0** |
| Training Quiz/Assessment | Best practice | ❌ Not built | **P0** |
| AI-Powered Q&A Chatbot | LC 6401.9(c)(3)(F) | ❌ Not built | **P0** |
| Anonymous Reporting System | Best practice / anti-retaliation | ❌ Not built | **P0** |
| Compliance Dashboard | Operational need | ❌ Basic placeholder | **P0** |
| Incident Logging Form | LC 6401.9(d) | ❌ Model exists, no UI | **P0** |
| Employee Portal | LC 6401.9(c)(3) | ❌ Not built | **P0** |
| Clerk Org Roles | Operational need | ❌ Not configured | **P0** |
| Magic Link Invites | Operational need | ❌ Not built | **P0** |
| PDF Export (WVPP) | LC 6401.9(c)(1) | ❌ Skeleton exists | **P0** |
| Automated Email Reminders | Operational need | ❌ Cron exists but not integrated | **P1** |
| Printable Documents | Operational need | ❌ Not built | **P1** |
| Employee Acknowledgments | Best practice | ❌ Not built | **P1** |
| Plan Version History | LC 6401.9(c)(2)(J) | ❌ Not built | **P2** |
| Multi-location Support | Operational need | ❌ Not built | **P2** |

### 3.2 New Data Models Required

| Model | Purpose |
|-------|---------|
| **TrainingModule** | LMS course content metadata |
| **TrainingQuestion** | Quiz questions for modules |
| **TrainingProgress** | Track employee progress through LMS |
| **ChatMessage** | AI Q&A conversation history |
| **AnonymousReport** | Anonymous employee reports |
| **AnonymousThread** | Follow-up communication on anonymous reports |
| **Document** | Generated printable documents |
| **Reminder** | Scheduled reminder configurations |

---

## 4. New Data Models

### 4.1 TrainingModule Schema (LMS)
```javascript
// lib/models/TrainingModule.js
import mongoose from 'mongoose';

const TrainingModuleSchema = new mongoose.Schema({
  // Module identification
  moduleId: { type: String, required: true, unique: true }, // e.g., "wvpp-overview-v1"
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Sequencing (LMS)
  order: { type: Number, required: true }, // Position in learning path
  
  // Content
  type: { 
    type: String, 
    enum: ['video', 'interactive', 'document'], 
    default: 'video'
  },
  videoUrl: String, // Vercel Blob URL
  videoDurationMinutes: Number,
  thumbnailUrl: String,
  transcript: String, // For accessibility and AI context
  
  // Categorization per SB 553 requirements
  category: {
    type: String,
    enum: [
      'wvpp_overview',        // The employer's WVPP
      'reporting_procedures', // How to report without reprisal
      'hazard_recognition',   // Job-specific hazards
      'avoidance_strategies', // Strategies to avoid harm
      'incident_log',         // The violent incident log
      'emergency_response',   // Emergency procedures
      'de_escalation',        // De-escalation techniques
      'active_shooter'        // Active shooter response
    ],
    required: true
  },
  
  // Requirements
  isRequired: { type: Boolean, default: true },
  
  // Quiz settings
  hasQuiz: { type: Boolean, default: true },
  passingScore: { type: Number, default: 70 },
  maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
  
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
```

### 4.2 TrainingQuestion Schema
```javascript
// lib/models/TrainingQuestion.js
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
    id: { type: String, required: true }, // e.g., "a", "b", "c", "d"
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }],
  
  explanation: String, // Shown after answering
  
  order: { type: Number, default: 0 },
  points: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

TrainingQuestionSchema.index({ moduleId: 1, order: 1 });

export default mongoose.models.TrainingQuestion || mongoose.model('TrainingQuestion', TrainingQuestionSchema);
```

### 4.3 TrainingProgress Schema (LMS Tracking)
```javascript
// lib/models/TrainingProgress.js
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
  videoProgress: { type: Number, default: 0 }, // Percentage 0-100
  videoCompleted: { type: Boolean, default: false },
  videoCompletedAt: Date,
  lastWatchedPosition: { type: Number, default: 0 }, // Seconds
  
  // Quiz progress
  quizAttempts: [{
    attemptNumber: Number,
    score: Number, // Percentage
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
```

### 4.4 ChatMessage Schema (AI Q&A)
```javascript
// lib/models/ChatMessage.js
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
  conversationId: { type: String, required: true, index: true }, // UUID for grouping
  
  // Message content
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: { type: String, required: true },
  
  // AI response metadata
  aiMetadata: {
    model: String, // e.g., "gpt-4o-mini"
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
        'wvpp_content',        // About employer's specific WVPP
        'sb553_general',       // General SB 553 questions
        'reporting',           // How to report incidents
        'emergency',           // Emergency procedures
        'training',            // Training-related questions
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
  countedAsQAInteraction: { type: Boolean, default: false }, // For training compliance
  linkedTrainingRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingRecord' }
}, {
  timestamps: true
});

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
ChatMessageSchema.index({ organizationId: 1, 'aiMetadata.flaggedForReview': 1 });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
```

### 4.5 AnonymousReport Schema
```javascript
// lib/models/AnonymousReport.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const AnonymousReportSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true 
  },
  
  // Anonymous identifier - generated, NOT linked to employee
  anonymousId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `ANON-${crypto.randomBytes(8).toString('hex').toUpperCase()}`
  },
  
  // Access token for reporter to view responses (hashed)
  accessTokenHash: { type: String, required: true },
  
  // Report content
  reportType: {
    type: String,
    enum: [
      'workplace_violence',    // Violence incident
      'safety_concern',        // General safety issue
      'harassment',            // Harassment complaint
      'retaliation',           // Retaliation for reporting
      'policy_violation',      // Policy violation
      'other'
    ],
    required: true
  },
  
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true },
  
  // Optional details (reporter chooses what to share)
  incidentDate: Date,
  incidentLocation: String,
  witnessesPresent: { type: Boolean },
  
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'under_review', 'investigating', 'resolved', 'closed'],
    default: 'new'
  },
  
  // Admin handling (NO reporter identity stored)
  assignedTo: String, // Admin user ID
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Resolution
  resolution: String,
  resolvedAt: Date,
  
  // Internal notes (not visible to reporter)
  internalNotes: [{
    note: String,
    addedBy: String,
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Link to official incident log (if applicable)
  linkedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  
  // Metadata
  submittedVia: { type: String, default: 'web' }, // web, mobile
  ipHash: String // Hashed IP for abuse prevention, NOT identification
}, {
  timestamps: true
});

// Indexes
AnonymousReportSchema.index({ organizationId: 1, status: 1 });
AnonymousReportSchema.index({ anonymousId: 1 });

// Static method to hash access token
AnonymousReportSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to generate access token
AnonymousReportSchema.statics.generateAccessToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

export default mongoose.models.AnonymousReport || mongoose.model('AnonymousReport', AnonymousReportSchema);
```

### 4.6 AnonymousThread Schema (Follow-up Communication)
```javascript
// lib/models/AnonymousThread.js
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
  adminUserId: String, // Clerk user ID (only for admin messages)
  adminName: String,   // Display name
  
  // For reporter messages - NO identification stored
  // Reporter identified only by having the access token
  
  // Read tracking
  readByAdmin: { type: Boolean, default: false },
  readByReporter: { type: Boolean, default: false }
}, {
  timestamps: true
});

AnonymousThreadSchema.index({ reportId: 1, createdAt: 1 });

export default mongoose.models.AnonymousThread || mongoose.model('AnonymousThread', AnonymousThreadSchema);
```

### 4.7 Document Schema
```javascript
// lib/models/Document.js
import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true 
  },
  
  type: {
    type: String,
    enum: [
      'wvpp_full',              // Complete WVPP PDF
      'wvpp_summary',           // One-page WVPP summary for posting
      'emergency_contacts',     // Emergency contact sheet
      'incident_report_form',   // Blank incident report form
      'training_acknowledgment', // Training acknowledgment form
      'employee_acknowledgment', // WVPP acknowledgment form
      'incident_log_export',    // Incident log export (date range)
      'training_records_export', // Training records export
      'compliance_report',      // Full compliance status report
      'posting_notice',         // Required posting notice
      'training_certificate'    // Individual training certificate
    ],
    required: true
  },
  
  // File storage
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: Number,
  mimeType: { type: String, default: 'application/pdf' },
  
  // Version tracking
  version: { type: Number, default: 1 },
  planVersion: Number,
  
  // Generation context
  generatedBy: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  
  // For exports with date ranges
  dateRangeStart: Date,
  dateRangeEnd: Date,
  
  // For employee-specific docs
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  
  // Metadata
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

DocumentSchema.index({ organizationId: 1, type: 1 });
DocumentSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
```

### 4.8 Reminder Schema
```javascript
// lib/models/Reminder.js
import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true 
  },
  
  type: {
    type: String,
    enum: [
      'training_due',
      'training_overdue',
      'annual_review',
      'incident_followup',
      'new_hire_training',
      'plan_acknowledgment',
      'record_retention',
      'qa_flagged_review',
      'anonymous_report_new'
    ],
    required: true
  },
  
  // Target
  targetType: {
    type: String,
    enum: ['employee', 'organization', 'incident', 'report'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // Scheduling
  scheduledFor: { type: Date, required: true, index: true },
  sentAt: Date,
  
  // Recipients
  recipientEmail: { type: String, required: true },
  recipientName: String,
  recipientRole: String, // owner, admin, member
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Content
  subject: String,
  message: String,
  
  // Retry tracking
  attempts: { type: Number, default: 0 },
  lastError: String
}, {
  timestamps: true
});

ReminderSchema.index({ status: 1, scheduledFor: 1 });
ReminderSchema.index({ organizationId: 1, type: 1 });

export default mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);
```

### 4.9 Updates to Existing Models

**Employee Model — Add fields:**
```javascript
// Add to EmployeeSchema
{
  // Clerk integration
  clerkUserId: { type: String, index: true }, // Set after invite accepted
  inviteStatus: {
    type: String,
    enum: ['pending', 'sent', 'accepted', 'expired'],
    default: 'pending'
  },
  inviteSentAt: Date,
  inviteAcceptedAt: Date,
  
  // Portal access
  lastPortalLogin: Date,
  
  // LMS tracking
  trainingPath: {
    startedAt: Date,
    completedAt: Date,
    currentModuleOrder: { type: Number, default: 1 }
  },
  
  // Q&A tracking for compliance
  hasCompletedQA: { type: Boolean, default: false },
  qaCompletedAt: Date,
  
  // Anonymous reporting (we store that they CAN report, not WHAT they reported)
  // This is just for feature access, not tracking reports
}
```

**Organization Model — Add fields:**
```javascript
// Add to OrganizationSchema
{
  // Clerk integration
  clerkOrganizationId: { type: String, required: true, unique: true, index: true },
  
  // Compliance settings
  settings: {
    trainingReminderDays: { type: [Number], default: [30, 7, 1] },
    autoAssignTraining: { type: Boolean, default: true },
    requireQuizPass: { type: Boolean, default: true },
    quizPassingScore: { type: Number, default: 70 },
    qaResponseEmail: String,
    timezone: { type: String, default: 'America/Los_Angeles' },
    
    // AI Q&A settings
    enableAIQA: { type: Boolean, default: true },
    aiReviewThreshold: { type: String, default: 'complex' } // 'all', 'complex', 'none'
  },
  
  // Compliance scores (cached)
  complianceScore: {
    overall: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    planCurrent: { type: Number, default: 0 },
    incidentLog: { type: Number, default: 0 },
    lastCalculated: Date
  },
  
  // AI Q&A context - store WVPP content for RAG
  wvppContent: {
    lastUpdated: Date,
    contentHash: String // To detect when WVPP changes
  }
}
```

---

## 5. Feature Specifications

### 5.1 AI-Powered Q&A Chatbot (OpenAI)

**Purpose:** Fulfill LC 6401.9(c)(3)(F) requirement for interactive Q&A by providing instant AI responses to employee questions about WVPP and SB 553.

**Capabilities:**
1. Answer questions about the employer's specific WVPP (RAG-based)
2. Answer general SB 553 / workplace violence prevention questions
3. Auto-flag complex questions for human review
4. Log all interactions for compliance documentation

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Employee Portal                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "What should I do if I witness workplace violence?" │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              /api/chat/message                       │   │
│  │  1. Load organization's WVPP content                 │   │
│  │  2. Build context prompt with WVPP + SB 553 knowledge│   │
│  │  3. Send to OpenAI GPT-4o-mini                       │   │
│  │  4. Classify response complexity                     │   │
│  │  5. Flag if complex, log interaction                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI Response + Source Attribution                    │   │
│  │  "According to your company's WVPP, you should..."   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**System Prompt Template:**
```javascript
const systemPrompt = `You are a workplace violence prevention assistant for ${organizationName}. 
Your role is to answer employee questions about:
1. This employer's specific Workplace Violence Prevention Plan (WVPP)
2. California SB 553 requirements and workplace safety

EMPLOYER'S WVPP CONTENT:
${wvppContent}

INSTRUCTIONS:
- Answer questions clearly and helpfully
- When referencing the employer's WVPP, cite specific sections
- For general SB 553 questions, provide accurate information
- If you're unsure or the question is complex, indicate that a human will review
- Never provide legal advice - recommend consulting HR or legal counsel for complex situations
- Be supportive and non-judgmental about all concerns raised
- Encourage reporting of any safety concerns

RESPONSE FORMAT:
- Keep responses concise but complete
- Use bullet points for lists of steps
- Always end with an offer to help with follow-up questions`;
```

**Complexity Classification (for flagging):**
```javascript
// lib/ai/classifyComplexity.js
const complexityIndicators = {
  flagForReview: [
    'legal', 'lawsuit', 'attorney', 'lawyer',
    'discrimination', 'harassment', 'retaliation',
    'termination', 'fired', 'discipline',
    'police', 'arrest', 'criminal',
    'weapon', 'gun', 'knife',
    'suicide', 'self-harm', 'mental health crisis',
    'domestic violence', 'stalking',
    'union', 'grievance', 'complaint against manager'
  ]
};

export function shouldFlagForReview(question, response) {
  const combinedText = `${question} ${response}`.toLowerCase();
  
  for (const indicator of complexityIndicators.flagForReview) {
    if (combinedText.includes(indicator)) {
      return {
        flag: true,
        reason: `Contains sensitive topic: ${indicator}`
      };
    }
  }
  
  return { flag: false };
}
```

**Compliance Documentation:**
- Every AI Q&A interaction logged in ChatMessage collection
- Counts as compliant Q&A interaction for training records
- Flagged messages appear in admin dashboard for review
- Admin can add review notes without changing AI response

**API Endpoints:**
```
POST /api/chat/message              # Send message, get AI response
GET  /api/chat/conversations        # List employee's conversations
GET  /api/chat/conversations/[id]   # Get conversation history
GET  /api/chat/flagged              # [Admin] List flagged messages
PUT  /api/chat/flagged/[id]/review  # [Admin] Mark as reviewed
```

**UI Components:**
```
Employee Portal:
┌─────────────────────────────────────────────────────────────┐
│  💬 Ask a Question                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ You: What should I do if a customer becomes         │   │
│  │      aggressive?                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Assistant:                                        │   │
│  │                                                      │   │
│  │ According to your company's WVPP (Section 4 -       │   │
│  │ Emergency Response), here are the steps to follow:  │   │
│  │                                                      │   │
│  │ 1. Stay calm and speak in a low, steady voice       │   │
│  │ 2. Do not argue or challenge the person             │   │
│  │ 3. If safe, try to de-escalate by listening         │   │
│  │ 4. If you feel unsafe, remove yourself from the     │   │
│  │    situation and call for help                      │   │
│  │ 5. Contact your supervisor: John Smith (ext. 123)   │   │
│  │ 6. If there's immediate danger, call 911            │   │
│  │                                                      │   │
│  │ Would you like more details on any of these steps?  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type your question...                          [Send]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ℹ️ Your questions are logged for compliance. For          │
│     sensitive matters, you can submit an anonymous report. │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Built-in LMS (Learning Management System)

**Purpose:** Deliver required SB 553 training with video modules, quizzes, and progress tracking in a sequential learning path.

**Training Path (Sequential):**

| Order | Module | Category | Duration | Quiz |
|-------|--------|----------|----------|------|
| 1 | Understanding Your WVPP | wvpp_overview | 8 min | Yes |
| 2 | Reporting Workplace Violence | reporting_procedures | 6 min | Yes |
| 3 | Recognizing Hazards | hazard_recognition | 10 min | Yes |
| 4 | Strategies to Avoid Harm | avoidance_strategies | 8 min | Yes |
| 5 | The Violent Incident Log | incident_log | 5 min | Yes |
| 6 | Emergency Response | emergency_response | 10 min | Yes |

**Total: ~47 minutes + quizzes + Q&A**

**LMS Flow:**
```
1. Employee logs into portal
2. Sees training path with progress indicator
3. Must complete modules in sequence (can't skip ahead)
4. For each module:
   a. Watch video (progress tracked, can resume)
   b. Complete quiz (must pass with ≥70%)
   c. Can retake quiz unlimited times
   d. Module marked complete when video watched + quiz passed
5. After all modules complete:
   a. Prompted to ask questions via AI Q&A (or mark "no questions")
   b. Sign acknowledgment
   c. Training record created with all required fields
6. Certificate available for download
```

**Progress Tracking:**
```
┌─────────────────────────────────────────────────────────────┐
│  Your Training Progress                    4 of 6 Complete  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ 1. Understanding Your WVPP          Complete            │
│  ✅ 2. Reporting Workplace Violence     Complete            │
│  ✅ 3. Recognizing Hazards              Complete            │
│  ✅ 4. Strategies to Avoid Harm         Complete            │
│  ▶️ 5. The Violent Incident Log          In Progress (60%)  │
│  🔒 6. Emergency Response               Locked              │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 67%            │
│                                                             │
│                                    [Continue Training →]    │
└─────────────────────────────────────────────────────────────┘
```

**Video Player Features:**
- Progress bar with watched indicator
- Resume from last position
- Playback speed control (0.5x - 2x)
- Closed captions/transcript
- Cannot mark complete until 90% watched
- Mobile responsive

**Quiz Component:**
- Questions displayed one at a time
- Immediate feedback after each answer
- Show explanation for incorrect answers
- Score displayed at end
- Retry button if failed
- Best score saved

**API Endpoints:**
```
# LMS Content
GET  /api/training/modules                    # List all modules in order
GET  /api/training/modules/[id]               # Get module details + questions

# Progress Tracking
GET  /api/training/progress                   # Get employee's progress
POST /api/training/progress/video             # Update video progress
POST /api/training/progress/quiz              # Submit quiz attempt
POST /api/training/complete                   # Mark training complete

# Admin
GET  /api/training/reports                    # Training completion reports
GET  /api/training/reports/employee/[id]      # Individual employee report
POST /api/training/assign                     # Assign training to employee(s)
```

### 5.3 Anonymous Reporting System

**Purpose:** Allow employees to report workplace violence, safety concerns, harassment, or other issues without revealing their identity, fulfilling anti-retaliation requirements.

**Key Design Principles:**
1. **Truly anonymous** - No way to identify reporter, even for admins
2. **Two-way communication** - Admins can ask follow-up questions
3. **Secure access** - Reporter uses one-time token to view responses
4. **Separate from incident log** - Admin decides what enters official log

**Submission Flow:**
```
1. Employee clicks "Submit Anonymous Report" (no login required)
2. Selects report type (violence, safety, harassment, etc.)
3. Fills in report details
4. System generates:
   - anonymousId (e.g., "ANON-A1B2C3D4")
   - accessToken (32-char hex string)
5. System stores:
   - Report with anonymousId
   - Hashed accessToken (original NOT stored)
6. Employee shown:
   - "Your report ID: ANON-A1B2C3D4"
   - "Your access code: [one-time display]"
   - "Save this code to check for responses"
7. Report appears in admin dashboard as new
```

**Access for Reporter:**
```
1. Reporter visits /anonymous/status
2. Enters report ID + access code
3. System hashes access code, compares to stored hash
4. If match, shows:
   - Report status
   - Any admin questions/updates
   - Option to respond to questions
```

**Admin Review Flow:**
```
1. Admin sees new anonymous report in dashboard
2. Can:
   - Update status (under review, investigating, resolved)
   - Set priority
   - Add internal notes (not visible to reporter)
   - Post questions for reporter (visible to reporter)
   - Link to official incident log (if appropriate)
3. Cannot:
   - See reporter identity (doesn't exist in system)
   - See reporter's IP or any identifying info
```

**UI - Employee Submission:**
```
┌─────────────────────────────────────────────────────────────┐
│  Submit Anonymous Report                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔒 Your identity is completely protected. We cannot see    │
│     who you are, even if we wanted to.                      │
│                                                             │
│  Report Type *                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▼ Select type...                                    │   │
│  │   • Workplace Violence Incident                     │   │
│  │   • Safety Concern                                  │   │
│  │   • Harassment                                      │   │
│  │   • Retaliation for Reporting                       │   │
│  │   • Policy Violation                                │   │
│  │   • Other                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Title *                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Brief description of the issue                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Details *                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │ Describe what happened...                           │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  When did this occur? (optional)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select date...                                 📅   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                        [Submit Report →]    │
└─────────────────────────────────────────────────────────────┘
```

**UI - Confirmation (One-Time Display):**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Report Submitted Successfully                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ IMPORTANT: Save this information now!                   │
│     This is the ONLY time you will see your access code.    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Report ID:    ANON-A1B2C3D4E5F6                    │   │
│  │  Access Code:  a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                   [Copy to Clipboard 📋]    │
│                                                             │
│  Use these to check the status of your report and view      │
│  any responses from management at:                          │
│                                                             │
│  🔗 safeworkca.com/anonymous/status                         │
│                                                             │
│                              [Check Status] [Submit Another]│
└─────────────────────────────────────────────────────────────┘
```

**UI - Admin Dashboard:**
```
┌─────────────────────────────────────────────────────────────┐
│  Anonymous Reports                          [+ New Reports: 2]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter: [All Types ▼] [All Status ▼] [All Priority ▼]     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 ANON-A1B2C3D4  Workplace Violence    NEW         │   │
│  │    "Aggressive behavior from customer"              │   │
│  │    Submitted: 2 hours ago                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 ANON-E5F6G7H8  Safety Concern        INVESTIGATING│   │
│  │    "Broken emergency exit door"                     │   │
│  │    Submitted: 3 days ago │ 1 follow-up question    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 ANON-I9J0K1L2  Harassment            RESOLVED     │   │
│  │    "Inappropriate comments from coworker"           │   │
│  │    Resolved: 1 week ago                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints:**
```
# Public (no auth required)
POST /api/anonymous/submit                    # Submit new report
POST /api/anonymous/status                    # Check status (with token)
POST /api/anonymous/respond                   # Reporter responds to question

# Admin only
GET  /api/anonymous/reports                   # List all reports
GET  /api/anonymous/reports/[id]              # Get report details
PUT  /api/anonymous/reports/[id]              # Update status/priority
POST /api/anonymous/reports/[id]/question     # Post follow-up question
POST /api/anonymous/reports/[id]/note         # Add internal note
POST /api/anonymous/reports/[id]/link-incident # Link to incident log
```

### 5.4 Compliance Dashboard

**Purpose:** Single-screen visibility into organization's SB 553 compliance status.

**Components:**

1. **Compliance Score Card**
   - Overall score (0-100%)
   - Breakdown:
     - WVPP Status (25%): Active plan exists and is current
     - Training Compliance (25%): All employees completed training
     - Annual Review (25%): Plan reviewed within last year
     - Incident Log (25%): All incidents logged and investigated

2. **Alert Banner**
   - Critical: Overdue items, flagged Q&A, new anonymous reports
   - Warning: Items due within 30 days
   - Info: Upcoming deadlines

3. **Quick Stats Cards**
   - Employees trained: X / Y
   - Days until annual review: X
   - Open incidents: X
   - Flagged Q&A: X
   - Anonymous reports: X new

4. **Upcoming Deadlines**
   - Training due dates
   - Annual review
   - Investigation follow-ups

5. **Recent Activity**
   - Last 10 audit log entries
   - Training completions
   - Incident logs
   - Anonymous reports

6. **Quick Actions**
   - Log New Incident
   - Add Employee
   - View Flagged Q&A
   - Export Compliance Report
   - Download WVPP PDF

### 5.5 Incident Logging System

**Purpose:** Capture and maintain the Violent Incident Log per LC 6401.9(d).

**Required Fields:**
- Date, time, and location
- Violence type (1-4)
- Detailed description
- Perpetrator classification
- Circumstances and environment
- Actions taken
- Security/law enforcement contacted
- Injuries occurred

**Critical:** Log must NOT contain PII (employees have access rights).

**PII Detection:**
```javascript
// lib/compliance/piiDetector.js
const piiPatterns = [
  { type: 'name', pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g },
  { type: 'email', pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/g },
  { type: 'phone', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
  { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: 'address', pattern: /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr)\b/gi }
];

export function detectPII(text) {
  const findings = [];
  for (const { type, pattern } of piiPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      findings.push({ type, matches });
    }
  }
  return findings;
}
```

**API Endpoints:**
```
GET  /api/incidents                           # List incidents
POST /api/incidents                           # Create incident
GET  /api/incidents/[id]                      # Get incident details
PUT  /api/incidents/[id]                      # Update incident
GET  /api/incidents/export                    # Export incident log
POST /api/incidents/check-pii                 # Check text for PII
```

### 5.6 Employee Management

**Purpose:** Manage employee roster with Clerk organization integration.

**Employee Lifecycle:**
```
1. Admin adds employee (name, email, job title, hire date, role)
2. Employee record created in MongoDB
3. Clerk invitation sent with appropriate role
4. Employee accepts → Clerk account created, joins org
5. MongoDB record updated with clerkUserId
6. Training auto-assigned based on settings
7. Employee can now access portal
```

**Role Assignment:**
- Owner: Full access (typically business owner)
- Admin/Manager: Manage employees, respond to Q&A, investigate incidents
- Employee: Portal access only

**API Endpoints:**
```
GET  /api/employees                           # List employees
POST /api/employees                           # Add employee + send invite
GET  /api/employees/[id]                      # Get employee details
PUT  /api/employees/[id]                      # Update employee
DELETE /api/employees/[id]                    # Deactivate employee
POST /api/employees/import                    # Bulk import from CSV
GET  /api/employees/export                    # Export to CSV
POST /api/employees/[id]/resend-invite        # Resend Clerk invitation
```

### 5.7 Document Generation

**Purpose:** Generate printable PDFs for compliance and posting.

**Document Types:**
1. Complete WVPP PDF
2. WVPP Summary Poster (one-page)
3. Emergency Contact Sheet
4. Blank Incident Report Form
5. Training Acknowledgment Form
6. WVPP Acknowledgment Form
7. Incident Log Export (date range)
8. Training Records Export
9. Compliance Status Report
10. Training Certificate (per employee)

**Implementation:** Use `@react-pdf/renderer` for generation, Vercel Blob for storage.

### 5.8 Automated Reminders

**Reminder Types:**
| Type | Trigger | Recipients | Timing |
|------|---------|------------|--------|
| Training Due | Anniversary approaching | Employee + Admin | 30, 7, 1 days |
| Training Overdue | Past due | Employee + Admin | Day of, 7 days after |
| Annual Review | Review date approaching | Admin | 30, 7 days |
| New Hire Training | Employee added | Employee + Admin | Day of hire, 7 days |
| Q&A Flagged | Complex question flagged | Admin | Immediately |
| Anonymous Report | New report submitted | Admin | Immediately |
| Incident Follow-up | Open investigation | Admin | 7 days |

**Implementation:** Vercel Cron job daily at 9 AM (org timezone), send via Resend.

---

## 6. Project Structure

```
my-app/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.js
│   │   └── sign-up/[[...sign-up]]/page.js
│   ├── (dashboard)/                         # Admin/Manager views
│   │   ├── layout.js
│   │   ├── dashboard/page.js                # Compliance dashboard
│   │   ├── plans/
│   │   │   ├── page.js
│   │   │   ├── new/page.js
│   │   │   └── [planId]/page.js
│   │   ├── training/
│   │   │   ├── page.js                      # Training admin
│   │   │   ├── modules/page.js              # Module management
│   │   │   ├── reports/page.js              # Completion reports
│   │   │   └── qa-review/page.js            # Flagged Q&A review
│   │   ├── incidents/
│   │   │   ├── page.js
│   │   │   ├── new/page.js
│   │   │   └── [incidentId]/page.js
│   │   ├── employees/
│   │   │   ├── page.js
│   │   │   ├── new/page.js
│   │   │   ├── import/page.js
│   │   │   └── [employeeId]/page.js
│   │   ├── anonymous-reports/
│   │   │   ├── page.js                      # List reports
│   │   │   └── [reportId]/page.js           # Report detail
│   │   ├── documents/page.js
│   │   ├── settings/
│   │   │   ├── page.js
│   │   │   ├── organization/page.js
│   │   │   ├── compliance/page.js
│   │   │   ├── users/page.js
│   │   │   └── notifications/page.js
│   │   └── billing/page.js
│   ├── (portal)/                            # Employee portal
│   │   ├── layout.js
│   │   ├── portal/
│   │   │   ├── page.js                      # Portal dashboard
│   │   │   ├── training/
│   │   │   │   ├── page.js                  # Training path
│   │   │   │   └── [moduleId]/page.js       # Module player + quiz
│   │   │   ├── chat/page.js                 # AI Q&A chatbot
│   │   │   ├── wvpp/page.js                 # View WVPP
│   │   │   └── documents/page.js            # My certificates
│   │   └── welcome/page.js                  # Post-invite landing
│   ├── (public)/                            # Public pages (no auth)
│   │   └── anonymous/
│   │       ├── page.js                      # Submit report
│   │       └── status/page.js               # Check report status
│   ├── api/
│   │   ├── organizations/route.js
│   │   ├── plans/...
│   │   ├── incidents/...
│   │   ├── employees/
│   │   │   ├── route.js
│   │   │   ├── [employeeId]/route.js
│   │   │   ├── import/route.js
│   │   │   └── [employeeId]/resend-invite/route.js
│   │   ├── training/
│   │   │   ├── modules/route.js
│   │   │   ├── modules/[moduleId]/route.js
│   │   │   ├── progress/route.js
│   │   │   ├── progress/video/route.js
│   │   │   ├── progress/quiz/route.js
│   │   │   ├── complete/route.js
│   │   │   └── reports/route.js
│   │   ├── chat/
│   │   │   ├── message/route.js             # AI Q&A
│   │   │   ├── conversations/route.js
│   │   │   ├── flagged/route.js
│   │   │   └── flagged/[id]/review/route.js
│   │   ├── anonymous/
│   │   │   ├── submit/route.js              # Public
│   │   │   ├── status/route.js              # Public
│   │   │   ├── respond/route.js             # Public
│   │   │   ├── reports/route.js             # Admin
│   │   │   └── reports/[id]/route.js        # Admin
│   │   ├── documents/...
│   │   ├── dashboard/...
│   │   ├── settings/...
│   │   ├── billing/...
│   │   ├── portal/...
│   │   ├── webhooks/
│   │   │   ├── clerk/route.js
│   │   │   └── stripe/route.js
│   │   └── cron/
│   │       └── reminders/route.js
│   ├── layout.js
│   └── page.js                              # Landing page
├── components/
│   ├── ui/                                  # shadcn/ui
│   ├── forms/
│   │   ├── PlanWizard.js
│   │   ├── IncidentForm.js
│   │   ├── EmployeeForm.js
│   │   └── AnonymousReportForm.js
│   ├── dashboard/
│   │   ├── ComplianceScoreCard.js
│   │   ├── AlertBanner.js
│   │   ├── UpcomingDeadlines.js
│   │   ├── RecentActivity.js
│   │   └── QuickActions.js
│   ├── training/
│   │   ├── TrainingPath.js
│   │   ├── ModuleCard.js
│   │   ├── VideoPlayer.js
│   │   ├── QuizComponent.js
│   │   ├── QuizQuestion.js
│   │   └── ProgressBar.js
│   ├── chat/
│   │   ├── ChatInterface.js
│   │   ├── ChatMessage.js
│   │   └── ChatInput.js
│   ├── anonymous/
│   │   ├── ReportForm.js
│   │   ├── ReportConfirmation.js
│   │   ├── StatusChecker.js
│   │   └── ThreadView.js
│   ├── employees/
│   │   ├── EmployeeTable.js
│   │   ├── InviteStatusBadge.js
│   │   └── RoleSelector.js
│   └── incidents/
│       ├── IncidentTable.js
│       ├── PIIWarningModal.js
│       └── InvestigationTimeline.js
├── lib/
│   ├── db.js
│   ├── utils.js
│   ├── models/
│   │   ├── Organization.js
│   │   ├── Plan.js
│   │   ├── Incident.js
│   │   ├── Employee.js
│   │   ├── TrainingRecord.js
│   │   ├── AuditLog.js
│   │   ├── TrainingModule.js
│   │   ├── TrainingQuestion.js
│   │   ├── TrainingProgress.js
│   │   ├── ChatMessage.js
│   │   ├── AnonymousReport.js
│   │   ├── AnonymousThread.js
│   │   ├── Document.js
│   │   └── Reminder.js
│   ├── clerk/
│   │   ├── inviteEmployee.js
│   │   └── syncUser.js
│   ├── openai/
│   │   ├── client.js
│   │   ├── chatCompletion.js
│   │   ├── buildSystemPrompt.js
│   │   └── classifyComplexity.js
│   ├── pdf/
│   │   ├── generateWVPP.js
│   │   ├── generateIncidentLog.js
│   │   ├── generateTrainingCertificate.js
│   │   └── generateComplianceReport.js
│   ├── email/
│   │   ├── sendEmail.js
│   │   └── templates/
│   │       ├── training-due.js
│   │       ├── new-hire-welcome.js
│   │       ├── qa-flagged.js
│   │       └── anonymous-report-new.js
│   ├── compliance/
│   │   ├── calculateScore.js
│   │   ├── checkDeadlines.js
│   │   └── piiDetector.js
│   └── stripe/
│       └── client.js
├── constants/
│   └── index.js
├── middleware.js
└── public/
    └── videos/                              # Or use Vercel Blob
```

---

## 7. API Reference

### Authentication & Authorization

All API routes (except `/api/anonymous/*`) require Clerk authentication.

Role-based access:
- **Owner/Admin:** Full access to all endpoints
- **Employee:** Only `/api/portal/*` and `/api/chat/*` endpoints

### Organizations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/organizations | Owner/Admin | Get current organization |
| POST | /api/organizations | Owner | Create organization |
| PUT | /api/organizations | Owner/Admin | Update organization |

### Plans
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/plans | Owner/Admin | List all plans |
| POST | /api/plans | Owner/Admin | Create new plan |
| GET | /api/plans/[id] | Owner/Admin | Get plan details |
| PUT | /api/plans/[id] | Owner/Admin | Update plan |
| POST | /api/plans/[id]/publish | Owner/Admin | Publish plan |

### Incidents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/incidents | Owner/Admin | List incidents |
| POST | /api/incidents | Owner/Admin | Create incident |
| GET | /api/incidents/[id] | Owner/Admin | Get incident details |
| PUT | /api/incidents/[id] | Owner/Admin | Update incident |
| GET | /api/incidents/export | Owner/Admin | Export incident log |
| POST | /api/incidents/check-pii | Owner/Admin | Check text for PII |

### Employees
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/employees | Owner/Admin | List employees |
| POST | /api/employees | Owner/Admin | Add employee + send invite |
| GET | /api/employees/[id] | Owner/Admin | Get employee details |
| PUT | /api/employees/[id] | Owner/Admin | Update employee |
| DELETE | /api/employees/[id] | Owner/Admin | Deactivate employee |
| POST | /api/employees/import | Owner/Admin | Bulk import |
| POST | /api/employees/[id]/resend-invite | Owner/Admin | Resend Clerk invitation |

### Training (LMS)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/training/modules | All | List modules in order |
| GET | /api/training/modules/[id] | All | Get module + questions |
| GET | /api/training/progress | Employee | Get my progress |
| POST | /api/training/progress/video | Employee | Update video progress |
| POST | /api/training/progress/quiz | Employee | Submit quiz attempt |
| POST | /api/training/complete | Employee | Complete training |
| GET | /api/training/reports | Owner/Admin | Completion reports |
| POST | /api/training/assign | Owner/Admin | Assign training |

### Chat (AI Q&A)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/chat/message | Employee | Send message, get AI response |
| GET | /api/chat/conversations | Employee | List my conversations |
| GET | /api/chat/conversations/[id] | Employee | Get conversation history |
| GET | /api/chat/flagged | Owner/Admin | List flagged messages |
| PUT | /api/chat/flagged/[id]/review | Owner/Admin | Mark as reviewed |

### Anonymous Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/anonymous/submit | Public | Submit new report |
| POST | /api/anonymous/status | Public | Check status (with token) |
| POST | /api/anonymous/respond | Public | Respond to admin question |
| GET | /api/anonymous/reports | Owner/Admin | List all reports |
| GET | /api/anonymous/reports/[id] | Owner/Admin | Get report details |
| PUT | /api/anonymous/reports/[id] | Owner/Admin | Update status/priority |
| POST | /api/anonymous/reports/[id]/question | Owner/Admin | Post follow-up question |

### Documents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/documents | Owner/Admin | List documents |
| POST | /api/documents/generate/[type] | Owner/Admin | Generate document |
| GET | /api/documents/[id]/download | All | Download document |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/dashboard/compliance-score | Owner/Admin | Get compliance score |
| GET | /api/dashboard/alerts | Owner/Admin | Get active alerts |
| GET | /api/dashboard/stats | Owner/Admin | Get quick stats |

### Portal (Employee)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/portal/me | Employee | Get my profile |
| GET | /api/portal/training | Employee | Get my training |
| GET | /api/portal/wvpp | Employee | Get WVPP content |
| POST | /api/portal/acknowledge-wvpp | Employee | Acknowledge WVPP |

### Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/settings | Owner/Admin | Get settings |
| PUT | /api/settings | Owner | Update settings |
| GET | /api/settings/users | Owner | List team users |
| POST | /api/settings/users/invite | Owner | Invite user |

### Billing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/billing | Owner | Get billing info |
| POST | /api/billing/create-checkout | Owner | Create Stripe checkout |
| POST | /api/billing/create-portal | Owner | Create Stripe portal |

---

## 8. Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# MongoDB
MONGODB_URI=

# Vercel Blob (file storage)
BLOB_READ_WRITE_TOKEN=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=notifications@safeworkca.com

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_PROFESSIONAL_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=

# Video CDN (optional)
VIDEO_CDN_URL=
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Configure Clerk organizations with roles
- [ ] Update Organization and Employee models
- [ ] Implement employee invite flow with magic links
- [ ] Build compliance dashboard with score calculation
- [ ] Implement incident logging with PII detection
- [ ] Create employee management CRUD
- [ ] Generate WVPP PDF export

### Phase 2: LMS & Training (Week 3-4)
- [ ] Create TrainingModule, TrainingQuestion, TrainingProgress models
- [ ] Seed initial training modules (content placeholders)
- [ ] Build training path UI with progress tracking
- [ ] Implement video player with progress saving
- [ ] Build quiz component with scoring
- [ ] Create training completion flow
- [ ] Generate training certificates

### Phase 3: AI Q&A (Week 5)
- [ ] Create ChatMessage model
- [ ] Implement OpenAI integration with system prompt
- [ ] Build RAG context from organization's WVPP
- [ ] Implement complexity classification and flagging
- [ ] Build chat interface for employee portal
- [ ] Build flagged Q&A review for admins
- [ ] Link Q&A completion to training records

### Phase 4: Anonymous Reporting (Week 6)
- [ ] Create AnonymousReport and AnonymousThread models
- [ ] Build public submission form (no auth)
- [ ] Implement secure token generation and hashing
- [ ] Build status checker with token verification
- [ ] Build admin report management dashboard
- [ ] Implement two-way communication thread

### Phase 5: Polish & Launch (Week 7-8)
- [ ] Implement automated reminders
- [ ] Complete all document generators
- [ ] Stripe billing integration
- [ ] Email template polish
- [ ] Mobile responsiveness
- [ ] Error handling and loading states
- [ ] Testing and bug fixes
- [ ] Production deployment

---

## 10. Success Metrics

### Product Metrics
- Time to first WVPP: < 30 minutes
- Training completion rate: > 90%
- Average compliance score: > 85%
- Q&A response accuracy: > 95%
- Anonymous report response time: < 48 hours

### Business Metrics
- Monthly churn rate: < 5%
- Customer acquisition cost: < $100
- Lifetime value: > $500
- Net promoter score: > 50

### Technical Metrics
- Page load time: < 2 seconds
- API response time: < 500ms
- AI response time: < 3 seconds
- Uptime: > 99.9%

---

## 11. Legal Disclaimer

**Display prominently:**

> SafeWorkCA provides tools to help employers create workplace violence prevention plans and manage compliance activities. Use of this platform does not guarantee compliance with California Labor Code Section 6401.9. Employers are responsible for ensuring their plans meet all legal requirements and are properly implemented at their worksites. This platform does not provide legal advice. Consult with a qualified attorney or compliance professional for specific guidance.

**AI Q&A Disclaimer (shown in chat):**

> This AI assistant provides general information about workplace violence prevention. For legal advice or complex situations, please consult HR or legal counsel. All conversations are logged for compliance purposes.

**Anonymous Reporting Disclaimer:**

> Your identity is completely protected. This system does not collect or store any information that could identify you. Management cannot see who submitted this report.

---

## 12. Data Retention Policy

| Data Type | Retention Period | Authority |
|-----------|-----------------|-----------|
| WVPP Documents | Current + 5 years | LC 6401.9 |
| Incident Logs | 5 years | LC 6401.9(d) |
| Training Records | 1 year minimum | LC 6401.9 |
| Hazard Assessments | 5 years | LC 6401.9 |
| AI Chat Logs | 1 year | Best practice |
| Anonymous Reports | 5 years | Best practice |

---

## 13. Next Steps

1. ✅ Review and approve this PRD
2. Set up Clerk organization with custom roles
3. Configure OpenAI API access
4. Create placeholder training video content
5. Set up Stripe products and pricing
6. Begin Phase 1 implementation

---

*End of PRD v3.0*