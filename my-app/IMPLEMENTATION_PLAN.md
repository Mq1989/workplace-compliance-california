# Implementation Plan — SafeWorkCA

## Phase 0: Project Foundation
- [x] **Task 0.1** — Install dependencies and configure project (Clerk, Mongoose, shadcn/ui, jsPDF, Resend, Stripe, react-hook-form, zod, lucide-react, class-variance-authority, clsx, tailwind-merge, tailwindcss-animate)
- [x] **Task 0.2** — Create constants file (`constants/index.js`) with all enums, industry data, subscription plans
- [x] **Task 0.3** — Create shared UI components: set up shadcn/ui component primitives (Button, Input, Label, Card, Select, Checkbox, Switch, Tabs, Dialog, Toast, Progress, RadioGroup, Separator, DropdownMenu)
- [x] **Task 0.4** — Create `lib/utils.js` with `cn()` helper for Tailwind class merging

## Phase 1: Authentication & Database
- [x] **Task 1.1** — Configure Clerk: install, add environment variables, create `proxy.js`, wrap root layout with `ClerkProvider`, create sign-in and sign-up pages
- [x] **Task 1.2** — Set up MongoDB connection singleton (`lib/db.js`)
- [x] **Task 1.3** — Create Mongoose models: Organization, Plan, Incident, Employee, TrainingRecord, AuditLog

## Phase 2: Layout & Navigation
- [x] **Task 2.1** — Build root layout (`app/layout.js`) with ClerkProvider and global styles
- [x] **Task 2.2** — Build dashboard layout (`app/(dashboard)/layout.js`) with sidebar navigation (Plans, Training, Incidents, Employees, Settings, Billing) and top bar with user button
- [x] **Task 2.3** — Build marketing landing page (`app/page.js`) with hero, features, pricing, and CTA

## Phase 3: Organization Onboarding
- [x] **Task 3.1** — Create Organization API route (`app/api/organizations/route.js`) with GET and POST
- [x] **Task 3.2** — Build onboarding flow page: multi-step form for company name, address, industry, employee count, workplace type

## Phase 4: WVPP Plan CRUD & Wizard
- [x] **Task 4.1** — Create Plans API routes: `app/api/plans/route.js` (GET, POST), `app/api/plans/[planId]/route.js` (GET, PUT), `app/api/plans/[planId]/publish/route.js` (POST)
- [x] **Task 4.2** — Build Plans list page (`app/(dashboard)/plans/page.js`) showing all plans with status badges
- [x] **Task 4.3** — Build WVPP Creation Wizard (`app/(dashboard)/plans/new/page.js` + `components/forms/PlanWizard.js`) — Steps 1-5 (Responsible Persons, Employee Involvement, Communication, Emergency Response, Hazard Assessment)
- [x] **Task 4.4** — Build WVPP Creation Wizard Steps 6-11 (Post-Incident, Training Program, Recordkeeping, Review Schedule, Authorization, Review & Publish)
- [x] **Task 4.5** — Build Plan view/edit page (`app/(dashboard)/plans/[planId]/page.js`)

## Phase 5: PDF Generation
- [x] **Task 5.1** — Implement `lib/pdf/generateWVPP.js` with full WVPP document generation
- [x] **Task 5.2** — Create PDF export API route (`app/api/plans/[planId]/pdf/route.js`)

## Phase 6: Dashboard
- [x] **Task 6.1** — Build dashboard home page (`app/(dashboard)/dashboard/page.js`) with compliance score, upcoming deadlines, recent activity, quick actions

## Phase 7: Incident Logging
- [x] **Task 7.1** — Create Incidents API routes (`app/api/incidents/route.js` + `app/api/incidents/[incidentId]/route.js`)
- [x] **Task 7.2** — Build Incident list page (`app/(dashboard)/incidents/page.js`)
- [x] **Task 7.3** — Build Incident form (`app/(dashboard)/incidents/new/page.js` + `components/forms/IncidentForm.js`)
- [x] **Task 7.4** — Build Incident detail page (`app/(dashboard)/incidents/[incidentId]/page.js`)

## Phase 8: Employee Management
- [x] **Task 8.1** — Create Employees API routes (`app/api/employees/route.js` + `app/api/employees/[employeeId]/route.js`)
- [x] **Task 8.2** — Build Employee roster page (`app/(dashboard)/employees/page.js`) + add form (`components/forms/EmployeeForm.js`)
- [x] **Task 8.3** — Build Employee detail page (`app/(dashboard)/employees/[employeeId]/page.js`)

## Phase 9: Training Records
- [x] **Task 9.1** — Create Training API routes (`app/api/training/route.js`)
- [x] **Task 9.2** — Build Training dashboard page (`app/(dashboard)/training/page.js`) and records page (`app/(dashboard)/training/records/page.js`)

## Phase 10: Webhooks & Email
- [x] **Task 10.1** — Create Clerk webhook handler (`app/api/webhooks/clerk/route.js`)
- [x] **Task 10.2** — Create email service (`lib/email/sendReminder.js`) and cron reminder route (`app/api/cron/reminders/route.js`)

## Phase 11: Stripe Billing
- [x] **Task 11.1** — Create Stripe webhook handler (`app/api/webhooks/stripe/route.js`)
- [x] **Task 11.2** — Build billing page (`app/(dashboard)/billing/page.js`)

## Phase 12: Settings & Polish
- [x] **Task 12.1** — Build settings page (`app/(dashboard)/settings/page.js`)
- [x] **Task 12.2** — Final QA: ensure build passes, lint clean, all pages render

## Phase 13: New Data Models & Schema Updates
- [x] **Task 13.1** — Create new Mongoose models: TrainingModule, TrainingQuestion, TrainingProgress, ChatMessage, AnonymousReport, AnonymousThread, Document, Reminder (per PRD sections 4.1–4.8). Update Employee model with invite/portal/LMS fields (PRD 4.9). Update Organization model with settings, complianceScore, wvppContent fields (PRD 4.9). Update AuditLog action enum with new action types.
- [x] **Task 13.2** — Create seed script (`lib/seed/trainingModules.js`) with 6 default training modules and sample quiz questions per PRD section 5.2

## Phase 14: Employee Portal Layout & Welcome
- [x] **Task 14.1** — Build portal layout (`app/(portal)/layout.js`) with employee-focused navigation (Training, Q&A, WVPP, Documents) and Clerk UserButton
- [x] **Task 14.2** — Build portal dashboard (`app/(portal)/portal/page.js`) showing training progress, quick links
- [x] **Task 14.3** — Build welcome page (`app/(portal)/welcome/page.js`) for post-invite landing

## Phase 15: LMS Training Path & Video Player
- [x] **Task 15.1** — Create LMS API routes: `app/api/training/modules/route.js` (GET list), `app/api/training/modules/[moduleId]/route.js` (GET with questions), `app/api/training/progress/route.js` (GET employee progress), `app/api/training/progress/video/route.js` (POST update), `app/api/training/progress/quiz/route.js` (POST submit quiz), `app/api/training/complete/route.js` (POST mark complete), `app/api/training/assign/route.js` (POST assign training), `app/api/training/reports/route.js` (GET completion reports)
- [x] **Task 15.2** — Build training path UI (`app/(portal)/portal/training/page.js`) with sequential module list, progress bar, locked/unlocked states
- [x] **Task 15.3** — Build module player page (`app/(portal)/portal/training/[moduleId]/page.js`) with video player component, progress tracking, quiz component
- [ ] **Task 15.4** — Build admin training management: module management page (`app/(dashboard)/training/modules/page.js`), completion reports page update, assign training UI

## Phase 16: AI Q&A Chatbot
- [ ] **Task 16.1** — Install OpenAI SDK, create AI utilities: `lib/openai/client.js`, `lib/openai/buildSystemPrompt.js`, `lib/openai/classifyComplexity.js`
- [ ] **Task 16.2** — Create Chat API routes: `app/api/chat/message/route.js` (POST), `app/api/chat/conversations/route.js` (GET), `app/api/chat/conversations/[id]/route.js` (GET), `app/api/chat/flagged/route.js` (GET), `app/api/chat/flagged/[id]/review/route.js` (PUT)
- [ ] **Task 16.3** — Build chat interface (`app/(portal)/portal/chat/page.js`) with ChatInterface, ChatMessage, ChatInput components
- [ ] **Task 16.4** — Build flagged Q&A review page (`app/(dashboard)/training/qa-review/page.js`)

## Phase 17: Anonymous Reporting
- [ ] **Task 17.1** — Create Anonymous API routes: `app/api/anonymous/submit/route.js` (POST public), `app/api/anonymous/status/route.js` (POST public), `app/api/anonymous/respond/route.js` (POST public), `app/api/anonymous/reports/route.js` (GET admin), `app/api/anonymous/reports/[id]/route.js` (GET/PUT admin), `app/api/anonymous/reports/[id]/question/route.js` (POST admin)
- [ ] **Task 17.2** — Build public anonymous report form (`app/(public)/anonymous/page.js`) + confirmation with access token display
- [ ] **Task 17.3** — Build public status checker (`app/(public)/anonymous/status/page.js`) with token verification + thread view
- [ ] **Task 17.4** — Build admin anonymous reports dashboard (`app/(dashboard)/anonymous-reports/page.js`) + detail page (`app/(dashboard)/anonymous-reports/[reportId]/page.js`)

## Phase 18: Document Generation & Employee Invite Flow
- [ ] **Task 18.1** — Create Clerk invite utility (`lib/clerk/inviteEmployee.js`) and integrate with employee creation API
- [ ] **Task 18.2** — Create document generation utilities: training certificate (`lib/pdf/generateTrainingCertificate.js`), incident log export (`lib/pdf/generateIncidentLog.js`), compliance report (`lib/pdf/generateComplianceReport.js`)
- [ ] **Task 18.3** — Create Documents API routes and documents page (`app/(dashboard)/documents/page.js`)

## Phase 19: Integration & Polish
- [ ] **Task 19.1** — Update compliance dashboard API and page to include LMS, Q&A, and anonymous report data
- [ ] **Task 19.2** — Update sidebar navigation to include Anonymous Reports link, update proxy.js for public anonymous routes
- [ ] **Task 19.3** — Final QA: ensure build passes, lint clean, all new pages render, all new API routes respond
