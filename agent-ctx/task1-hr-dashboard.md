# Task: Build TalentFlow AI Company HR Dashboard

## Summary
Built a comprehensive HR & ATS dashboard for the "TalentFlow AI" platform with full frontend and backend implementation.

## Files Created/Modified

### API Routes (Backend)
- `/src/app/api/seed/route.ts` - Database seeding with demo data (company, jobs, candidates, applications, pipeline stages)
- `/src/app/api/jobs/route.ts` - Jobs CRUD (GET with filters, POST to create)
- `/src/app/api/applications/route.ts` - Applications CRUD (GET with filters, PATCH status changes, POST to apply)
- `/src/app/api/candidates/route.ts` - Candidates listing (GET with search/filters)
- `/src/app/api/dashboard/route.ts` - Dashboard stats (active jobs, applications, interviews, hiring funnel, trend data)
- `/src/app/api/pipeline-stages/route.ts` - Pipeline stages CRUD (GET with applications, POST to add stage)

### Frontend Pages
- `/src/app/(company)/layout.tsx` - Company layout with sidebar navigation, top bar, notifications, language/theme switchers, RTL support, mobile responsive
- `/src/app/(company)/company/page.tsx` - HR Dashboard with stats cards, application trend chart (recharts), hiring funnel, recent applications, quick actions
- `/src/app/(company)/company/jobs/page.tsx` - Job Management with grid/list views, status filtering, search, job cards with applicant counts
- `/src/app/(company)/company/jobs/create/page.tsx` - Create Job with multi-step form, AI generation placeholder, preview, draft/publish options
- `/src/app/(company)/company/pipeline/page.tsx` - ATS Pipeline Kanban Board with @dnd-kit drag-and-drop, job filtering, add stage dialog
- `/src/app/(company)/company/candidates/page.tsx` - Candidate Management with table, AI match scores, profile drawer, bulk actions
- `/src/app/(company)/company/applications/page.tsx` - Applications Management with status filters, detail sheet with tabs (Overview, AI Analysis, Notes), status change actions

### Core Files Modified
- `/src/app/globals.css` - Updated with teal/emerald theme colors (light and dark mode)
- `/src/app/layout.tsx` - Added ThemeProvider for dark mode support
- `/src/app/page.tsx` - Redirect to /company dashboard
- `/src/lib/db.ts` - Added PrismaClient refresh mechanism for development
- `/src/app/(candidate)/candidate/jobs/page.tsx` - Fixed lint error (FilterContent component)

## Design
- Teal/emerald accent color scheme throughout
- Dark mode support via next-themes
- RTL support via i18n store
- Responsive design (mobile sidebar, adaptive layouts)
- Professional HR dashboard aesthetic
- Custom scrollbar styling

## Tech Stack Used
- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- Recharts for dashboard charts
- @dnd-kit for Kanban drag-and-drop
- Prisma with SQLite
- Zustand for state management
- Lucide React icons

## Demo Data
- 1 Company (TechVision Inc.)
- 8 Jobs (various statuses: OPEN, DRAFT, PAUSED, CLOSED)
- 12 Candidates with profiles
- 12 Applications across pipeline stages
- 6 Pipeline Stages (Applied → Screening → Interview → Offer → Hired → Rejected)
