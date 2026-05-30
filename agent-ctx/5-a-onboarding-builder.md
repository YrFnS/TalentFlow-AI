Task ID: 5-a
Agent: Onboarding Automation Page Builder
Task: Build Onboarding Automation feature for the TalentFlow AI Company portal

## Completed Work

### 1. Rewritten Onboarding Page (`/company/onboarding`)

**`page.tsx`**: Already existed with correct thin wrapper pattern (next/dynamic + ssr: false). Confirmed correct, no changes needed.

**`content.tsx`**: Completely rewritten from simple task list to comprehensive onboarding management page with:

- **Stats Row** (4 cards with `.card-hover-lift`):
  - Active Onboardings (teal gradient), Completed This Month (emerald), Avg Completion (amber), Pending Tasks (cyan)
  - Gradient backgrounds, animated with `animate-fade-in-up`

- **Onboarding Plans Section**:
  - Grid of plan cards (2 default plans + create button)
  - Each plan card: name, description, task count, duration, category badges (Document/blue, Training/purple, Setup/teal, Introduction/amber, General/gray), active/inactive status badge
  - "Create Plan" dialog with: name input, description textarea, duration (days) input, add tasks (title, category select, due day number, required toggle), remove task button
  - Toggle plan active/inactive button
  - Dashed border "Create Plan" card with Plus icon

- **Active Onboardings Table**:
  - Columns: Employee (avatar + name + email), Plan, Progress (progress bar + %), Start Date, Due Date, Status, Actions
  - Status badges: Pending (gray), In Progress (teal), Completed (emerald), Overdue (red)
  - Actions: View Details, Mark Complete (for non-completed)
  - Filter by status dropdown, search by employee name

- **Onboarding Detail Dialog**:
  - Employee info card with avatar (getInitials), name, email, plan name, status badge
  - Progress bar showing completion percentage with start/due dates
  - Task checklist grouped by categories (Document/blue, Training/purple, Setup/teal, Introduction/amber, General/gray)
  - Each task: checkbox, title, category badge, due day, required/optional badge
  - Interactive task toggling (checking/unchecking updates progress in real-time)
  - "Send Reminder" button, "Mark All Complete" button

- **Mock Data**:
  - 2 default plans: "Standard Onboarding" (14 days, 8 tasks), "Executive Onboarding" (30 days, 12 tasks)
  - 6 active onboarding assignments with varied progress
  - Rich task lists per assignment with category distribution

- Uses `toast` from `sonner` for notifications
- Uses `getInitials()` from `@/lib/utils` for avatar initials

### 2. API Route (`/api/onboarding/route.ts`)

- GET: List onboarding plans and assignments for a company (requires companyId)
- POST: Create new onboarding plan (requires companyId and name)
- Uses Prisma `db.onboardingPlan.findMany()`, `db.onboardingAssignment.findMany()`

### 3. i18n Keys Updated

Replaced basic `onboarding` section (15 keys) with comprehensive section (~55 keys) in both EN and AR.
Nav key "onboarding" already existed in both languages.

## QA Results
- `/company/onboarding` returns HTTP 200
- `/api/onboarding` returns proper 400 for missing companyId
- Lint: Clean with zero errors
- All i18n keys properly structured in both EN and AR
- Teal/emerald accent colors only
- Pattern: thin `page.tsx` wrapper + `content.tsx` with `next/dynamic` + `ssr: false`
