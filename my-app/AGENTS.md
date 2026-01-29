# AGENTS.md — Operational Guidelines for SafeWorkCA

## Build & Run
- `npm run dev` — Start the Next.js development server
- `npm run build` — Production build
- `npm run start` — Start production server

## Validation
- `npm run lint` — Run ESLint
- Tests: TBD (update this section when a test framework is added)

## Operational Notes
- **Next.js version**: 16.1.6 (not 14.x as in PRD). Uses Turbopack by default.
- **React version**: 19.2.3
- **Tailwind CSS v4** (not v3): Uses `@import "tailwindcss"` syntax, `@theme inline` blocks for theme registration, `@plugin` for plugins, `@custom-variant` for dark mode. No `tailwind.config.js` file needed.
- **ESLint 9** with flat config (`eslint.config.mjs`), not legacy `.eslintrc`.
- **Build warning**: Turbopack warns about multiple lockfiles (root + my-app). Not blocking but may need `turbopack.root` config later.
- **shadcn/ui theming**: Uses oklch color space CSS variables mapped via `@theme inline` in `globals.css`. All colors defined as `--color-*` Tailwind theme tokens.
- **Environment variables**: Template in `.env.example`. Clerk, MongoDB, Stripe, Resend, Vercel Blob all need keys before auth/db tasks. A `.env.local` with a valid-format `pk_test_` key is required for `npm run build` to succeed (Clerk validates key format at build time during static page prerendering).
- **Next.js 16 proxy convention**: `middleware.js` is deprecated in Next.js 16. Use `proxy.js` at project root instead. The API is identical — same `clerkMiddleware`, `createRouteMatcher` imports from `@clerk/nextjs/server`. Clerk v6 supports this naming natively.

## Codebase Patterns
- **Class merging**: Use `cn()` from `@/lib/utils` for conditional Tailwind classes (wraps clsx + tailwind-merge).
- **Path aliases**: `@/*` maps to project root via `jsconfig.json`.
- **Dark mode**: Class-based via `@custom-variant dark (&:is(.dark *))`. Toggle on `<html class="dark">`.
- **Component library**: Radix UI primitives installed for building shadcn/ui-style components in `components/ui/`.
- **Constants**: All enums, industry hazard data, and subscription plan definitions live in `constants/index.js`. Import from `@/constants` using named exports.
- **MongoDB**: Connection singleton in `lib/db.js`. Uses global cache (`global.mongoose`) to avoid multiple connections during Next.js hot reloading. Import as `import dbConnect from '@/lib/db'` and call `await dbConnect()` at the start of every API route handler. Requires `MONGODB_URI` in `.env.local` (template in `.env.example`). Mongoose v9 is installed — note that pre middleware no longer receives `next()` (use async functions instead).
- **UI components**: All shadcn/ui primitives live in `components/ui/`. Import like `import { Button } from "@/components/ui/button"`. Components that use Radix interactivity (Select, Checkbox, Switch, Tabs, Dialog, Toast, Progress, RadioGroup, Separator, DropdownMenu) are marked `"use client"`. Button, Input, Label, Card, Textarea are server-compatible (no `"use client"` directive). Also includes a Textarea component as a bonus beyond the original 14.
- **Clerk auth**: `@clerk/nextjs` v6.37.0. `ClerkProvider` wraps `<html>` in root `app/layout.js`. Auth pages use catch-all routes at `app/(auth)/sign-in/[[...sign-in]]/page.js` and `app/(auth)/sign-up/[[...sign-up]]/page.js`. Route protection via `proxy.js` using `clerkMiddleware` + `createRouteMatcher`. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`, `/api/cron(.*)`. Import `auth` from `@clerk/nextjs/server` for server-side auth checks in API routes.
- **Mongoose models**: All 6 models live in `lib/models/`. Import like `import Organization from '@/lib/models/Organization'`. Models use the `mongoose.models.X || mongoose.model('X', schema)` pattern to avoid re-compilation during hot reloading. Sub-schemas (ResponsiblePerson, HazardAssessment) are defined inline in `Plan.js`. The Incident model has a `location.type` field — when querying, be careful with Mongoose's `type` keyword collision (it's handled via explicit object nesting).
- **Dashboard layout**: `app/(dashboard)/layout.js` is a `"use client"` component providing sidebar navigation + top bar with Clerk `UserButton`. Sidebar uses lucide-react icons. Mobile responsive with hamburger menu overlay. All dashboard pages go under `app/(dashboard)/` route group. Dashboard home is at `/dashboard` (not `/`) to avoid conflicting with the marketing landing page at `app/page.js`.
- **Route conflict**: `app/page.js` (marketing landing) and `app/(dashboard)/page.js` cannot coexist — both resolve to `/`. Dashboard home is placed at `app/(dashboard)/dashboard/page.js` → `/dashboard`. All sidebar nav links use absolute paths (`/dashboard`, `/plans`, `/training`, etc.).
- **Marketing landing page**: `app/page.js` is a server component (no `"use client"`). Uses `Button` and `Card` from shadcn/ui, `SUBSCRIPTION_PLANS` from constants, and lucide-react icons. Links to `/sign-in` and `/sign-up` for auth. Includes legal disclaimer in footer as required by PRD Section 16.
