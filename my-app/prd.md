# Product Requirements Document (PRD)
# SafeWorkCA - California SB 553 Workplace Violence Prevention Compliance Platform

## Document Information
- **Version:** 1.1
- **Created:** January 29, 2026
- **Author:** Quinn (Product Owner)
- **Target Build Time:** 2-4 weeks MVP
- **Language:** JavaScript (ES6+)

---

## 1. Executive Summary

### 1.1 Product Overview
SafeWorkCA is a SaaS platform that helps California employers comply with SB 553 (Labor Code Section 6401.9), which requires all covered employers to establish, implement, and maintain a written Workplace Violence Prevention Plan (WVPP) effective July 1, 2024.

### 1.2 Problem Statement
- 900,000+ California employers are required to comply with SB 553
- Most small/medium businesses are unaware of requirements or struggling with implementation
- Cal/OSHA's model template is generic and requires significant customization
- Employers must maintain training records, incident logs, and plan documentation for 5 years
- Penalties range from $25,000 for serious violations to $158,727 for willful violations

### 1.3 Solution
A pure SaaS platform that:
1. Generates customized, compliant WVPP documents through a guided wizard
2. Delivers required annual training with completion tracking
3. Maintains digital incident logs with proper retention
4. Sends automated compliance reminders
5. Provides audit-ready PDF exports

### 1.4 Target Market
- **Primary:** California employers with 10-100 employees (retail, restaurants, construction, professional services)
- **Secondary:** Multi-location franchises needing centralized compliance management
- **Exclusions:** Healthcare facilities (covered by separate CCR Title 8, Section 3342)

---

## 2. Technical Architecture

### 2.1 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router, JavaScript) |
| Authentication | Clerk |
| Database | MongoDB (via Mongoose) |
| Hosting | Vercel |
| File Storage | Vercel Blob (for generated PDFs) |
| Email | Resend (for reminders) |
| Payments | Stripe |

### 2.2 Project Structure
```
safeworkca/
├── jsconfig.json
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.js
│   │   └── sign-up/[[...sign-up]]/page.js
│   ├── (dashboard)/
│   │   ├── layout.js
│   │   ├── page.js (Dashboard home)
│   │   ├── plans/
│   │   │   ├── page.js (List all WVPPs)
│   │   │   ├── new/page.js (Create wizard)
│   │   │   └── [planId]/
│   │   │       ├── page.js (View/Edit plan)
│   │   │       └── export/route.js (PDF generation)
│   │   ├── training/
│   │   │   ├── page.js (Training dashboard)
│   │   │   ├── modules/[moduleId]/page.js
│   │   │   └── records/page.js
│   │   ├── incidents/
│   │   │   ├── page.js (Incident log list)
│   │   │   ├── new/page.js (Log new incident)
│   │   │   └── [incidentId]/page.js
│   │   ├── employees/
│   │   │   ├── page.js (Employee roster)
│   │   │   └── [employeeId]/page.js
│   │   ├── settings/
│   │   │   └── page.js
│   │   └── billing/
│   │       └── page.js
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── clerk/route.js
│   │   │   └── stripe/route.js
│   │   ├── plans/
│   │   │   ├── route.js (CRUD)
│   │   │   └── [planId]/
│   │   │       ├── route.js
│   │   │       └── pdf/route.js
│   │   ├── incidents/route.js
│   │   ├── training/route.js
│   │   ├── employees/route.js
│   │   └── cron/
│   │       └── reminders/route.js
│   ├── layout.js
│   └── page.js (Marketing landing page)
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── forms/
│   │   ├── PlanWizard.js
│   │   ├── IncidentForm.js
│   │   └── EmployeeForm.js
│   ├── dashboard/
│   │   ├── ComplianceScore.js
│   │   ├── UpcomingDeadlines.js
│   │   └── RecentActivity.js
│   └── training/
│       ├── ModulePlayer.js
│       └── QuizComponent.js
├── lib/
│   ├── db.js (MongoDB connection)
│   ├── models/
│   │   ├── Organization.js
│   │   ├── Plan.js
│   │   ├── Incident.js
│   │   ├── Employee.js
│   │   ├── TrainingRecord.js
│   │   └── AuditLog.js
│   ├── pdf/
│   │   └── generateWVPP.js
│   ├── email/
│   │   └── sendReminder.js
│   └── utils/
│       └── compliance.js
├── middleware.js (Clerk auth)
└── constants/
    └── index.js
```

### 2.3 jsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 3. Data Models (Mongoose Schemas)

### 3.1 Organization
```javascript
// lib/models/Organization.js
import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  clerkOrgId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  dba: String,
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'CA' },
    zip: { type: String, required: true }
  },
  phone: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  industry: { 
    type: String, 
    enum: ['retail', 'restaurant', 'construction', 'professional_services', 'manufacturing', 'other'],
    required: true 
  },
  employeeCount: { 
    type: Number, 
    required: true 
  },
  workplaceType: [{ 
    type: String, 
    enum: ['office', 'retail_store', 'warehouse', 'outdoor', 'multiple_locations'] 
  }],
  
  // Subscription
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  plan: { 
    type: String, 
    enum: ['free', 'starter', 'professional', 'enterprise'], 
    default: 'free' 
  },
  planExpiresAt: Date,
  
  // Compliance tracking
  wvppCreatedAt: Date,
  lastTrainingDate: Date,
  nextTrainingDueDate: Date,
  lastPlanReviewDate: Date,
  nextPlanReviewDueDate: Date
}, { 
  timestamps: true 
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
```

### 3.2 Plan (WVPP Document)
```javascript
// lib/models/Plan.js
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
```

### 3.3 Incident
```javascript
// lib/models/Incident.js
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
```

### 3.4 Employee
```javascript
// lib/models/Employee.js
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
```

### 3.5 TrainingRecord
```javascript
// lib/models/TrainingRecord.js
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
```

### 3.6 AuditLog
```javascript
// lib/models/AuditLog.js
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  userId: { type: String, required: true },
  
  action: {
    type: String,
    enum: [
      'plan_created',
      'plan_updated',
      'plan_published',
      'plan_archived',
      'incident_logged',
      'incident_updated',
      'training_completed',
      'employee_added',
      'employee_removed',
      'document_exported',
      'settings_changed'
    ],
    required: true
  },
  
  resourceType: { 
    type: String, 
    enum: ['plan', 'incident', 'employee', 'training', 'organization'],
    required: true 
  },
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: String,
  userAgent: String
}, { 
  timestamps: { createdAt: true, updatedAt: false } 
});

// Index for audit queries
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
```

---

## 4. Database Connection

### 4.1 MongoDB Connection Singleton
```javascript
// lib/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

---

## 5. Core Features & User Flows

### 5.1 Onboarding Flow
```
1. User signs up via Clerk
2. Create Organization profile:
   - Company name, DBA
   - Address (must be CA)
   - Industry selection
   - Employee count
   - Workplace type(s)
3. Redirect to Plan Creation Wizard
```

### 5.2 WVPP Creation Wizard (Multi-Step Form)

**Step 1: Responsible Persons**
- Add WVPP Administrator (required)
- Add additional responsible persons (optional)
- Fields: Name, Title, Phone, Email, Responsibilities (checkboxes)

**Step 2: Employee Involvement**
- Meeting frequency selector
- Text areas for procedure descriptions
- Checkboxes for involvement methods

**Step 3: Communication System**
- Toggle switches for communication methods
- Conditional fields based on selections
- Anonymous reporting setup

**Step 4: Emergency Response**
- Alert method selection (multi-select)
- Evacuation plan text
- Shelter location inputs
- Emergency contacts (reuse ResponsiblePerson component)
- Local law enforcement contact

**Step 5: Hazard Assessment**
- Industry-specific pre-populated hazards
- Risk level selection for each
- Control measure suggestions based on industry
- Ability to add custom hazards

**Step 6: Post-Incident Procedures**
- Investigation steps (default provided, editable)
- Support resources
- Counseling toggle + provider info

**Step 7: Training Program**
- Training description fields
- Topic checklist (pre-populated per LC 6401.9)
- Delivery method selection

**Step 8: Recordkeeping & Access**
- Retention periods (pre-filled with minimums)
- Access procedure description
- Plan accessibility settings

**Step 9: Review Schedule**
- Annual review month selector
- Review procedure description

**Step 10: Authorization**
- Authorizer name and title
- Authorization statement (template provided)
- E-signature capture (typed name + checkbox)
- Timestamp

**Step 11: Review & Publish**
- Full plan preview
- Edit buttons for each section
- Publish button → generates PDF, sets status to 'active'

### 5.3 Incident Logging Flow
```
1. Click "Log New Incident"
2. Multi-step form matching Violent Incident Log requirements:
   - Date/Time/Location
   - Violence type classification
   - Incident type selection
   - Detailed description
   - Perpetrator classification
   - Circumstances checklist
   - Consequences documentation
   - Injury documentation
   - Emergency response documentation
   - Cal/OSHA reporting determination
3. Save → Creates incident record
4. Optional: Mark investigation status
5. Optional: Add corrective actions
```

### 5.4 Training Module Flow
```
1. Employee accesses training portal (unique link or login)
2. View assigned modules
3. Watch video/read content
4. Complete quiz (if applicable)
5. Acknowledge completion
6. System records TrainingRecord with all required fields
```

### 5.5 Dashboard Features
- **Compliance Score**: Visual indicator based on:
  - WVPP exists and is current (25%)
  - All employees trained within last year (25%)
  - No overdue plan reviews (25%)
  - Incident log up to date (25%)
- **Upcoming Deadlines**: 
  - Training due dates by employee
  - Plan review date
  - Record retention alerts
- **Recent Activity**: Audit log summary
- **Quick Actions**:
  - Log Incident
  - Add Employee
  - Export WVPP PDF
  - Schedule Training

---

## 6. API Routes

### 6.1 Organizations API
```javascript
// app/api/organizations/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';

export async function POST(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();

    const organization = await Organization.create({
      clerkOrgId: orgId || userId,
      ...data
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.2 Plans API
```javascript
// app/api/plans/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const plans = await Plan.find({ organizationId: organization._id })
      .sort({ createdAt: -1 });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const plan = await Plan.create({
      organizationId: organization._id,
      ...data
    });

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'plan_created',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { version: plan.version }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.3 Plan by ID API
```javascript
// app/api/plans/[planId]/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const plan = await Plan.findOne({ 
      _id: params.planId,
      organizationId: organization._id 
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const plan = await Plan.findOneAndUpdate(
      { _id: params.planId, organizationId: organization._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'plan_updated',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { updatedFields: Object.keys(data) }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.4 Plan Publish API
```javascript
// app/api/plans/[planId]/publish/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import AuditLog from '@/lib/models/AuditLog';

export async function POST(request, { params }) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Archive any existing active plans
    await Plan.updateMany(
      { organizationId: organization._id, status: 'active' },
      { $set: { status: 'archived', archivedAt: new Date() } }
    );

    // Publish the new plan
    const plan = await Plan.findOneAndUpdate(
      { _id: params.planId, organizationId: organization._id },
      { 
        $set: { 
          status: 'active', 
          publishedAt: new Date() 
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update organization tracking
    await Organization.findByIdAndUpdate(organization._id, {
      wvppCreatedAt: plan.publishedAt,
      lastPlanReviewDate: new Date(),
      nextPlanReviewDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'plan_published',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { version: plan.version }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error publishing plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.5 Incidents API
```javascript
// app/api/incidents/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Incident from '@/lib/models/Incident';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = { organizationId: organization._id };
    
    if (startDate || endDate) {
      query.incidentDate = {};
      if (startDate) query.incidentDate.$gte = new Date(startDate);
      if (endDate) query.incidentDate.$lte = new Date(endDate);
    }

    const incidents = await Incident.find(query)
      .sort({ incidentDate: -1 });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const incident = await Incident.create({
      organizationId: organization._id,
      ...data
    });

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'incident_logged',
      resourceType: 'incident',
      resourceId: incident._id,
      details: { 
        incidentDate: incident.incidentDate,
        violenceTypes: incident.workplaceViolenceTypes 
      }
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.6 Employees API
```javascript
// app/api/employees/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const query = { organizationId: organization._id };
    if (activeOnly) {
      query.isActive = true;
    }

    const employees = await Employee.find(query)
      .sort({ lastName: 1, firstName: 1 });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    // Calculate next training due date (within 30 days of hire)
    const hireDate = new Date(data.hireDate);
    const nextTrainingDueDate = new Date(hireDate);
    nextTrainingDueDate.setDate(nextTrainingDueDate.getDate() + 30);

    const employee = await Employee.create({
      organizationId: organization._id,
      nextTrainingDueDate,
      ...data
    });

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'employee_added',
      resourceType: 'employee',
      resourceId: employee._id,
      details: { 
        name: `${employee.firstName} ${employee.lastName}`,
        role: employee.role
      }
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.7 Training Records API
```javascript
// app/api/training/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import TrainingRecord from '@/lib/models/TrainingRecord';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const query = { organizationId: organization._id };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const records = await TrainingRecord.find(query)
      .populate('employeeId', 'firstName lastName email')
      .sort({ trainingDate: -1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching training records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, orgId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const organization = await Organization.findOne({ 
      clerkOrgId: orgId || userId 
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const record = await TrainingRecord.create({
      organizationId: organization._id,
      ...data
    });

    // Update employee training dates
    const updateFields = {
      lastAnnualTrainingCompletedAt: record.completedAt || record.trainingDate
    };

    if (record.trainingType === 'initial') {
      updateFields.initialTrainingCompletedAt = record.completedAt || record.trainingDate;
    }

    // Calculate next training due date (1 year from completion)
    const completedDate = new Date(record.completedAt || record.trainingDate);
    updateFields.nextTrainingDueDate = new Date(completedDate);
    updateFields.nextTrainingDueDate.setFullYear(
      updateFields.nextTrainingDueDate.getFullYear() + 1
    );

    await Employee.findByIdAndUpdate(record.employeeId, { $set: updateFields });

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'training_completed',
      resourceType: 'training',
      resourceId: record._id,
      details: { 
        employeeId: record.employeeId,
        trainingType: record.trainingType,
        moduleName: record.moduleName
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating training record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.8 Cron Job for Reminders
```javascript
// app/api/cron/reminders/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import { sendReminderEmail } from '@/lib/email/sendReminder';

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find employees with upcoming training deadlines
    const employeesNeedingReminder = await Employee.find({
      isActive: true,
      nextTrainingDueDate: {
        $gte: now,
        $lte: thirtyDaysFromNow
      }
    }).populate('organizationId');

    const remindersSent = [];

    for (const employee of employeesNeedingReminder) {
      const daysUntilDue = Math.ceil(
        (employee.nextTrainingDueDate - now) / (1000 * 60 * 60 * 24)
      );

      // Send reminders at 30, 7, and 0 days
      if ([30, 7, 0].includes(daysUntilDue)) {
        await sendReminderEmail({
          to: employee.email,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          organizationName: employee.organizationId.name,
          dueDate: employee.nextTrainingDueDate,
          daysRemaining: daysUntilDue,
          type: 'training_due'
        });

        remindersSent.push({
          employeeId: employee._id,
          type: 'training_due',
          daysUntilDue
        });
      }
    }

    // Find organizations with upcoming plan reviews
    const orgsNeedingReview = await Organization.find({
      nextPlanReviewDueDate: {
        $gte: now,
        $lte: thirtyDaysFromNow
      }
    });

    for (const org of orgsNeedingReview) {
      const daysUntilDue = Math.ceil(
        (org.nextPlanReviewDueDate - now) / (1000 * 60 * 60 * 24)
      );

      if ([30, 7, 0].includes(daysUntilDue)) {
        await sendReminderEmail({
          to: org.email,
          organizationName: org.name,
          dueDate: org.nextPlanReviewDueDate,
          daysRemaining: daysUntilDue,
          type: 'plan_review_due'
        });

        remindersSent.push({
          organizationId: org._id,
          type: 'plan_review_due',
          daysUntilDue
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      remindersSent: remindersSent.length,
      details: remindersSent
    });
  } catch (error) {
    console.error('Error in reminder cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 7. Email Service

```javascript
// lib/email/sendReminder.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail({
  to,
  employeeName,
  organizationName,
  dueDate,
  daysRemaining,
  type
}) {
  const subjects = {
    training_due: `Training Due ${daysRemaining === 0 ? 'Today' : `in ${daysRemaining} Days`} - ${organizationName}`,
    plan_review_due: `WVPP Annual Review Due ${daysRemaining === 0 ? 'Today' : `in ${daysRemaining} Days`}`,
    new_employee_training: `Complete Your Workplace Violence Prevention Training`,
    incident_followup: `Incident Investigation Follow-up Required`
  };

  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const templates = {
    training_due: `
      <h2>Training Reminder</h2>
      <p>Hello ${employeeName},</p>
      <p>Your annual Workplace Violence Prevention training is due <strong>${formattedDate}</strong>.</p>
      <p>Please log in to SafeWorkCA to complete your training before the deadline.</p>
      <p>California Labor Code Section 6401.9 requires all employees to receive annual training on workplace violence prevention.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/training" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Complete Training</a>
    `,
    plan_review_due: `
      <h2>Annual Plan Review Required</h2>
      <p>Hello,</p>
      <p>Your Workplace Violence Prevention Plan (WVPP) is due for annual review on <strong>${formattedDate}</strong>.</p>
      <p>California Labor Code Section 6401.9 requires employers to review their WVPP at least annually.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Review Plan</a>
    `
  };

  try {
    const { data, error } = await resend.emails.send({
      from: 'SafeWorkCA <notifications@safeworkca.com>',
      to: [to],
      subject: subjects[type],
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${templates[type]}
            <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated reminder from SafeWorkCA.<br>
              ${organizationName}
            </p>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    throw error;
  }
}
```

---

## 8. PDF Generation

```javascript
// lib/pdf/generateWVPP.js
import { jsPDF } from 'jspdf';

export async function generateWVPPPdf(plan, organization) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper functions
  const addText = (text, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach(line => {
      if (yPos > 270) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += fontSize * 0.5;
    });
    yPos += 5;
  };

  const addHeading = (text, level = 1) => {
    const sizes = { 1: 18, 2: 14, 3: 12 };
    yPos += 10;
    addText(text, sizes[level], true);
    yPos += 5;
  };

  const addSection = (title, content) => {
    addHeading(title, 2);
    if (typeof content === 'string') {
      addText(content);
    } else if (Array.isArray(content)) {
      content.forEach(item => {
        addText(`• ${item}`);
      });
    }
  };

  // Cover Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WORKPLACE VIOLENCE', pageWidth / 2, 80, { align: 'center' });
  doc.text('PREVENTION PLAN', pageWidth / 2, 95, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(organization.name, pageWidth / 2, 130, { align: 'center' });
  if (organization.dba) {
    doc.text(`DBA: ${organization.dba}`, pageWidth / 2, 145, { align: 'center' });
  }
  
  doc.setFontSize(12);
  doc.text(`${organization.address.street}`, pageWidth / 2, 170, { align: 'center' });
  doc.text(`${organization.address.city}, ${organization.address.state} ${organization.address.zip}`, pageWidth / 2, 180, { align: 'center' });
  
  const pubDate = plan.publishedAt ? new Date(plan.publishedAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`Effective Date: ${pubDate}`, pageWidth / 2, 210, { align: 'center' });
  doc.text(`Version: ${plan.version}`, pageWidth / 2, 220, { align: 'center' });

  // New page for content
  doc.addPage();
  yPos = margin;

  // Definitions Section
  addHeading('DEFINITIONS', 1);
  
  const definitions = [
    { term: 'Emergency', def: 'Unanticipated circumstances that can be life threatening or pose a risk of significant injuries to employees or other persons.' },
    { term: 'Engineering controls', def: 'An aspect of the built space or a device that removes a hazard from the workplace or creates a barrier between the employee and the hazard.' },
    { term: 'Workplace violence', def: 'Any act of violence or threat of violence that occurs in a place of employment.' },
    { term: 'Type 1 violence', def: 'Workplace violence committed by a person who has no legitimate business at the worksite.' },
    { term: 'Type 2 violence', def: 'Workplace violence directed at employees by customers, clients, patients, students, inmates, or visitors.' },
    { term: 'Type 3 violence', def: 'Workplace violence against an employee by a present or former employee, supervisor, or manager.' },
    { term: 'Type 4 violence', def: 'Workplace violence committed by a person who does not work there, but has or is known to have had a personal relationship with an employee.' }
  ];

  definitions.forEach(({ term, def }) => {
    addText(`${term} - ${def}`);
  });

  // Responsibility Section
  addHeading('RESPONSIBILITY', 1);
  
  if (plan.responsiblePersons && plan.responsiblePersons.length > 0) {
    plan.responsiblePersons.forEach(person => {
      addText(`${person.name}, ${person.title}`, 12, true);
      addText(`Phone: ${person.phone} | Email: ${person.email}`);
      if (person.responsibilities && person.responsibilities.length > 0) {
        addText('Responsibilities:');
        person.responsibilities.forEach(resp => {
          addText(`  • ${resp}`);
        });
      }
      yPos += 5;
    });
  }

  // Employee Active Involvement
  addSection('EMPLOYEE ACTIVE INVOLVEMENT', [
    `Meeting Frequency: ${plan.employeeInvolvement?.meetingFrequency || 'Monthly'}`,
    plan.employeeInvolvement?.meetingDescription || 'Management will hold regular safety meetings with employees to discuss workplace violence concerns.',
    plan.employeeInvolvement?.trainingInvolvementDescription || 'Employees are encouraged to participate in training program development.',
    plan.employeeInvolvement?.reportingProceduresDescription || 'All employees may report concerns without fear of retaliation.'
  ]);

  // Employee Compliance
  addSection('EMPLOYEE COMPLIANCE', [
    plan.complianceProcedures?.trainingDescription || 'All employees will be trained on the WVPP.',
    plan.complianceProcedures?.supervisionDescription || 'Supervisors will monitor compliance with WVPP procedures.',
    plan.complianceProcedures?.recognitionProgram || 'Employees demonstrating safe practices will be recognized.',
    plan.complianceProcedures?.disciplinaryProcess || 'Non-compliance will be addressed through standard disciplinary procedures.'
  ]);

  // Communication System
  addHeading('COMMUNICATION WITH EMPLOYEES', 1);
  const commMethods = [];
  if (plan.communicationSystem?.newEmployeeOrientation) commMethods.push('New employee orientation includes WVPP training');
  if (plan.communicationSystem?.regularMeetings) commMethods.push(`Regular safety meetings (${plan.communicationSystem?.meetingFrequency || 'monthly'})`);
  if (plan.communicationSystem?.postedInformation) commMethods.push(`Posted information at: ${plan.communicationSystem?.postingLocations || 'common areas'}`);
  if (plan.communicationSystem?.reportingHotline) commMethods.push(`Reporting Hotline: ${plan.communicationSystem.reportingHotline}`);
  if (plan.communicationSystem?.anonymousReporting) commMethods.push('Anonymous reporting available');
  
  commMethods.forEach(method => addText(`• ${method}`));

  // Emergency Response
  addSection('EMERGENCY RESPONSE PROCEDURES', [
    `Alert Methods: ${plan.emergencyResponse?.alertMethods?.join(', ') || 'Alarm system, PA announcements'}`,
    plan.emergencyResponse?.evacuationPlanDescription || 'Evacuation routes are posted throughout the facility.',
    `Shelter Locations: ${plan.emergencyResponse?.shelterLocations?.join(', ') || 'Designated safe rooms'}`,
    `Law Enforcement Contact: ${plan.emergencyResponse?.lawEnforcementContact || '911'}`
  ]);

  // Emergency Contacts
  if (plan.emergencyResponse?.emergencyContacts && plan.emergencyResponse.emergencyContacts.length > 0) {
    addText('Emergency Contacts:', 12, true);
    plan.emergencyResponse.emergencyContacts.forEach(contact => {
      addText(`  ${contact.name} (${contact.title}): ${contact.phone}`);
    });
  }

  // Hazard Identification
  addHeading('WORKPLACE VIOLENCE HAZARD IDENTIFICATION AND EVALUATION', 1);
  addText('Periodic inspections will be conducted to identify workplace violence hazards.');
  
  if (plan.hazardAssessments && plan.hazardAssessments.length > 0) {
    addText('Identified Hazards:', 12, true);
    plan.hazardAssessments.forEach(hazard => {
      addText(`• Type ${hazard.hazardType.replace('type', '')} - ${hazard.description} (Risk: ${hazard.riskLevel})`);
      if (hazard.controlMeasures && hazard.controlMeasures.length > 0) {
        hazard.controlMeasures.forEach(measure => {
          addText(`    - ${measure}`);
        });
      }
    });
  }

  // Hazard Correction
  addSection('WORKPLACE VIOLENCE HAZARD CORRECTION', [
    plan.hazardCorrectionProcedures?.immediateThreatProcedure || 'Employees will be removed from immediate danger.',
    plan.hazardCorrectionProcedures?.documentationProcess || 'All corrective actions will be documented.',
    ...(plan.hazardCorrectionProcedures?.engineeringControls || []),
    ...(plan.hazardCorrectionProcedures?.workPracticeControls || []),
    ...(plan.hazardCorrectionProcedures?.administrativeControls || [])
  ]);

  // Post-Incident Procedures
  addSection('POST INCIDENT RESPONSE AND INVESTIGATION', 
    plan.postIncidentProcedures?.investigationSteps || [
      'Visit the scene as soon as safe and practicable',
      'Interview involved parties and witnesses',
      'Review security footage if available',
      'Determine cause and contributing factors',
      'Take corrective action',
      'Record findings in violent incident log'
    ]
  );

  if (plan.postIncidentProcedures?.counselingAvailable) {
    addText(`Counseling Provider: ${plan.postIncidentProcedures?.counselingProvider || 'Employee Assistance Program'}`);
  }

  // Training
  addSection('TRAINING AND INSTRUCTION', [
    'Training is provided when the WVPP is first established',
    'Annual refresher training for all employees',
    'Training when new hazards are identified or plan changes',
    ...(plan.trainingProgram?.trainingTopics || [
      'Understanding the WVPP and how to obtain a copy',
      'How to report incidents without fear of reprisal',
      'Workplace violence hazards specific to job duties',
      'How to seek assistance and avoid physical harm',
      'The violent incident log and records access'
    ])
  ]);

  // Recordkeeping
  addSection('RECORDKEEPING', [
    `Hazard records retained for ${plan.recordkeepingProcedures?.hazardRecordsRetention || 5} years`,
    `Training records retained for ${plan.recordkeepingProcedures?.trainingRecordsRetention || 1} year(s) minimum`,
    `Incident logs retained for ${plan.recordkeepingProcedures?.incidentLogRetention || 5} years`,
    plan.recordkeepingProcedures?.accessProcedure || 'Records available within 15 calendar days of request'
  ]);

  // Plan Access
  addSection('EMPLOYEE ACCESS TO THE WRITTEN WVPP', [
    `Physical Location: ${plan.planAccessibility?.physicalLocation || 'Company office'}`,
    plan.planAccessibility?.electronicAccess ? `Electronic Access: ${plan.planAccessibility?.electronicLocation || 'Company intranet'}` : 'Available in print upon request'
  ]);

  // Review Schedule
  addSection('REVIEW AND REVISION OF THE WVPP', [
    'Reviewed at least annually',
    'Reviewed when deficiencies are observed',
    'Reviewed after any workplace violence incident',
    `Annual review month: ${plan.reviewSchedule?.annualReviewMonth ? new Date(2024, plan.reviewSchedule.annualReviewMonth - 1).toLocaleString('default', { month: 'long' }) : 'January'}`
  ]);

  // Authorization Page
  doc.addPage();
  yPos = margin;
  
  addHeading('AUTHORIZATION', 1);
  
  const authStatement = plan.authorization?.authorizationStatement || 
    `I, ${plan.authorization?.authorizerName || '[Authorizer Name]'}, ${plan.authorization?.authorizerTitle || '[Title]'} of ${organization.name}, hereby authorize and ensure the establishment, implementation, and maintenance of this written workplace violence prevention plan. I am committed to promoting a culture of safety and violence prevention in our workplace.`;
  
  addText(authStatement);
  
  yPos += 30;
  addText('_________________________________');
  addText(`${plan.authorization?.authorizerName || '[Signature]'}`);
  addText(`${plan.authorization?.authorizerTitle || '[Title]'}`);
  
  yPos += 10;
  addText(`Date: ${plan.authorization?.signedAt ? new Date(plan.authorization.signedAt).toLocaleDateString() : '________________'}`);

  // Violent Incident Log Template (blank)
  doc.addPage();
  yPos = margin;
  
  addHeading('VIOLENT INCIDENT LOG', 1);
  addText('This log must be used for every workplace violence incident. No personally identifying information should be recorded.');
  
  yPos += 10;
  addText('Date of Incident: _________________    Time: _________________');
  addText('Location: _________________________________________________');
  addText('Workplace Violence Type(s): ☐ Type 1  ☐ Type 2  ☐ Type 3  ☐ Type 4');
  
  yPos += 5;
  addText('Type of Incident:', 12, true);
  addText('☐ Physical attack without weapon  ☐ Attack with weapon/object');
  addText('☐ Threat of physical force  ☐ Threat of weapon use');
  addText('☐ Sexual assault or threat  ☐ Animal attack  ☐ Other');
  
  yPos += 5;
  addText('Detailed Description:', 12, true);
  addText('_________________________________________________________________');
  addText('_________________________________________________________________');
  addText('_________________________________________________________________');
  
  yPos += 5;
  addText('Perpetrator Classification:', 12, true);
  addText('☐ Client/Customer  ☐ Family/Friend of Client  ☐ Stranger');
  addText('☐ Coworker  ☐ Supervisor/Manager  ☐ Partner/Spouse  ☐ Other');
  
  yPos += 5;
  addText('Circumstances at time of incident:', 12, true);
  addText('☐ Usual job duties  ☐ Poorly lit area  ☐ Rushed  ☐ Low staffing');
  addText('☐ Isolated/alone  ☐ Unable to get help  ☐ Community setting');
  
  yPos += 5;
  addText('Consequences:', 12, true);
  addText('Security contacted: ☐ Yes  ☐ No    Response: ___________________');
  addText('Law enforcement contacted: ☐ Yes  ☐ No    Response: ____________');
  addText('Actions taken to protect employees: ____________________________');
  
  yPos += 5;
  addText('Injuries: ☐ Yes  ☐ No    Description: _________________________');
  addText('Emergency medical contacted: ☐ Yes  ☐ No');
  addText('Cal/OSHA reporting required: ☐ Yes  ☐ No    Reported: __________');
  
  yPos += 10;
  addText('Completed by: _________________ Title: _________________ Date: _________');

  // Return the PDF as a buffer
  return doc.output('arraybuffer');
}
```

---

## 9. Middleware (Clerk Auth)

```javascript
// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)'
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

---

## 10. Constants

```javascript
// constants/index.js

export const INDUSTRIES = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant / Food Service' },
  { value: 'construction', label: 'Construction' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' }
];

export const WORKPLACE_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail_store', label: 'Retail Store' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'outdoor', label: 'Outdoor / Field' },
  { value: 'multiple_locations', label: 'Multiple Locations' }
];

export const VIOLENCE_TYPES = [
  { value: 'type1', label: 'Type 1 - Criminal Intent (no legitimate business)', description: 'Violence by someone who enters to commit a crime (robbery, etc.)' },
  { value: 'type2', label: 'Type 2 - Customer/Client', description: 'Violence by customers, clients, patients, students, or visitors' },
  { value: 'type3', label: 'Type 3 - Worker-on-Worker', description: 'Violence by current or former employees, supervisors, or managers' },
  { value: 'type4', label: 'Type 4 - Personal Relationship', description: 'Violence by someone with personal relationship to an employee' }
];

export const INCIDENT_TYPES = [
  { value: 'physical_attack_no_weapon', label: 'Physical attack without weapon (biting, choking, kicking, etc.)' },
  { value: 'attack_with_weapon', label: 'Attack with weapon or object' },
  { value: 'threat_physical_force', label: 'Threat of physical force' },
  { value: 'threat_weapon', label: 'Threat of weapon use' },
  { value: 'sexual_assault', label: 'Sexual assault' },
  { value: 'sexual_threat', label: 'Sexual threat or unwanted contact' },
  { value: 'animal_attack', label: 'Animal attack' },
  { value: 'other', label: 'Other' }
];

export const PERPETRATOR_TYPES = [
  { value: 'client_customer', label: 'Client or Customer' },
  { value: 'family_friend_of_client', label: 'Family/Friend of Client' },
  { value: 'stranger_criminal_intent', label: 'Stranger with Criminal Intent' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'supervisor_manager', label: 'Supervisor or Manager' },
  { value: 'partner_spouse', label: 'Partner or Spouse' },
  { value: 'parent_relative', label: 'Parent or Relative' },
  { value: 'other', label: 'Other' }
];

export const ALERT_METHODS = [
  { value: 'alarm', label: 'Alarm System' },
  { value: 'pa', label: 'PA Announcement' },
  { value: 'text', label: 'Text Message' },
  { value: 'email', label: 'Email Alert' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'radio', label: 'Two-Way Radio' }
];

export const TRAINING_TOPICS = [
  'The employer\'s WVPP and how to obtain a copy',
  'How to participate in WVPP development and implementation',
  'How to report incidents without fear of reprisal',
  'Workplace violence hazards specific to job duties',
  'How to seek assistance to prevent or respond to violence',
  'Strategies to avoid physical harm',
  'The violent incident log',
  'How to obtain copies of records',
  'Emergency response procedures',
  'De-escalation techniques'
];

export const INDUSTRY_HAZARDS = {
  retail: [
    { type: 'type1', description: 'Robbery or theft attempt', riskLevel: 'high', controls: ['Cash handling procedures', 'Limited cash on premises', 'Surveillance cameras', 'Panic buttons'] },
    { type: 'type2', description: 'Angry or aggressive customers', riskLevel: 'medium', controls: ['De-escalation training', 'Manager intervention protocols', 'Security presence'] }
  ],
  restaurant: [
    { type: 'type1', description: 'Robbery attempt', riskLevel: 'medium', controls: ['Cash handling procedures', 'Surveillance', 'Well-lit premises'] },
    { type: 'type2', description: 'Intoxicated or difficult patrons', riskLevel: 'medium', controls: ['Alcohol service policies', 'De-escalation training', 'Security for evening hours'] },
    { type: 'type3', description: 'Kitchen staff conflicts', riskLevel: 'low', controls: ['Conflict resolution procedures', 'Supervisor training', 'Clear communication protocols'] }
  ],
  construction: [
    { type: 'type1', description: 'Site intrusion or theft', riskLevel: 'medium', controls: ['Site security', 'Perimeter fencing', 'Tool lockup procedures'] },
    { type: 'type3', description: 'Crew conflicts', riskLevel: 'medium', controls: ['Clear supervision', 'Communication protocols', 'Conflict resolution training'] }
  ],
  professional_services: [
    { type: 'type2', description: 'Upset clients or visitors', riskLevel: 'low', controls: ['Visitor sign-in procedures', 'Reception area security', 'Meeting room protocols'] },
    { type: 'type3', description: 'Workplace conflicts', riskLevel: 'low', controls: ['HR policies', 'Conflict resolution procedures', 'Manager training'] },
    { type: 'type4', description: 'Domestic situations affecting workplace', riskLevel: 'low', controls: ['Security awareness', 'Confidential reporting', 'Support resources'] }
  ],
  manufacturing: [
    { type: 'type1', description: 'Unauthorized access or theft', riskLevel: 'medium', controls: ['Access control systems', 'Security cameras', 'Visitor procedures'] },
    { type: 'type3', description: 'Worker conflicts', riskLevel: 'medium', controls: ['Supervisor presence', 'Clear reporting procedures', 'Employee assistance program'] }
  ],
  other: [
    { type: 'type2', description: 'Interactions with public', riskLevel: 'medium', controls: ['De-escalation training', 'Security protocols', 'Clear reporting procedures'] },
    { type: 'type3', description: 'Workplace conflicts', riskLevel: 'low', controls: ['HR policies', 'Management training', 'Open communication'] }
  ]
};

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free Trial',
    price: 0,
    features: ['14-day trial', 'All Professional features']
  },
  starter: {
    name: 'Starter',
    price: 29,
    features: ['1 location', 'Up to 25 employees', 'WVPP generation', 'Incident log', 'Email reminders']
  },
  professional: {
    name: 'Professional',
    price: 79,
    features: ['Up to 3 locations', 'Up to 100 employees', 'Training modules', 'Compliance dashboard', 'Priority support']
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited locations', 'Unlimited employees', 'API access', 'Custom branding', 'Dedicated support']
  }
};
```

---

## 11. Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# MongoDB
MONGODB_URI=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# Resend
RESEND_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=

# Signing URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

## 12. Package.json Dependencies

```json
{
  "name": "safeworkca",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@clerk/nextjs": "^5.0.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "jspdf": "^2.5.1",
    "lucide-react": "^0.344.0",
    "mongoose": "^8.2.0",
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7.50.1",
    "resend": "^3.2.0",
    "stripe": "^14.18.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## 13. MVP Scope (Phase 1)

### 13.1 Must Have (Week 1-2)
- [ ] Clerk authentication setup
- [ ] MongoDB connection and models
- [ ] Organization onboarding flow
- [ ] WVPP creation wizard (all steps)
- [ ] PDF generation for WVPP
- [ ] Basic dashboard with compliance status

### 13.2 Should Have (Week 3)
- [ ] Incident logging form
- [ ] Incident log PDF export
- [ ] Employee roster management
- [ ] Training record tracking (manual entry)

### 13.3 Nice to Have (Week 4+)
- [ ] Video training modules
- [ ] Automated email reminders
- [ ] Stripe integration
- [ ] Multi-location support
- [ ] Employee self-service portal

---

## 14. API Routes Summary

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/organizations | Create organization |
| GET | /api/organizations | Get current organization |
| PUT | /api/organizations | Update organization |
| GET | /api/plans | List plans for org |
| POST | /api/plans | Create new plan |
| GET | /api/plans/[planId] | Get plan details |
| PUT | /api/plans/[planId] | Update plan |
| POST | /api/plans/[planId]/publish | Publish plan |
| GET | /api/plans/[planId]/pdf | Generate/download PDF |
| GET | /api/incidents | List incidents |
| POST | /api/incidents | Log new incident |
| GET | /api/incidents/[id] | Get incident |
| PUT | /api/incidents/[id] | Update incident |
| GET | /api/employees | List employees |
| POST | /api/employees | Add employee |
| PUT | /api/employees/[id] | Update employee |
| DELETE | /api/employees/[id] | Deactivate employee |
| GET | /api/training | List training records |
| POST | /api/training | Create training record |
| POST | /api/webhooks/clerk | Clerk webhook handler |
| POST | /api/webhooks/stripe | Stripe webhook handler |
| GET | /api/cron/reminders | Cron job for reminders |

---

## 15. Key Files to Create First

1. `lib/db.js` - MongoDB connection singleton
2. `lib/models/*.js` - All Mongoose models
3. `middleware.js` - Clerk authentication
4. `app/layout.js` - Root layout with ClerkProvider
5. `app/(dashboard)/layout.js` - Dashboard layout with sidebar
6. `components/forms/PlanWizard.js` - Multi-step form component
7. `lib/pdf/generateWVPP.js` - PDF generation logic
8. `constants/index.js` - All app constants

---

## 16. Legal Disclaimer

The platform should include a prominent disclaimer:
> "SafeWorkCA provides tools to help employers create workplace violence prevention plans. Use of this platform does not guarantee compliance with California Labor Code Section 6401.9. Employers are responsible for ensuring their plans meet all legal requirements. This platform does not provide legal advice."

---

## End of PRD

**Next Steps for Claude Code:**
1. Initialize Next.js project: `npx create-next-app@latest safeworkca`
2. Select: JavaScript, ESLint, Tailwind CSS, App Router, NO TypeScript
3. Install dependencies from package.json
4. Set up Clerk application and configure
5. Create MongoDB Atlas cluster
6. Implement files in order listed in Section 15
7. Build authentication flow
8. Build WVPP wizard step by step
9. Implement PDF generation
10. Add incident logging
11. Build dashboard