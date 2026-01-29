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
- **Environment variables**: Template in `.env.example`. Clerk, MongoDB, Stripe, Resend, Vercel Blob all need keys before auth/db tasks.

## Codebase Patterns
- **Class merging**: Use `cn()` from `@/lib/utils` for conditional Tailwind classes (wraps clsx + tailwind-merge).
- **Path aliases**: `@/*` maps to project root via `jsconfig.json`.
- **Dark mode**: Class-based via `@custom-variant dark (&:is(.dark *))`. Toggle on `<html class="dark">`.
- **Component library**: Radix UI primitives installed for building shadcn/ui-style components in `components/ui/`.
- **Constants**: All enums, industry hazard data, and subscription plan definitions live in `constants/index.js`. Import from `@/constants` using named exports.
- **UI components**: All shadcn/ui primitives live in `components/ui/`. Import like `import { Button } from "@/components/ui/button"`. Components that use Radix interactivity (Select, Checkbox, Switch, Tabs, Dialog, Toast, Progress, RadioGroup, Separator, DropdownMenu) are marked `"use client"`. Button, Input, Label, Card, Textarea are server-compatible (no `"use client"` directive). Also includes a Textarea component as a bonus beyond the original 14.
