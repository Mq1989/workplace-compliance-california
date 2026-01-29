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
- [ ] **Task 12.2** — Final QA: ensure build passes, lint clean, all pages render
