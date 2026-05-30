---
Task ID: feature-2-agentic-workflows
Agent: Agentic AI Recruiting Workflows Builder
Task: Build Feature #2 — Agentic AI Recruiting Workflows for TalentFlow AI

## Completed Work

### 1. Workflow Engine Library (`/src/lib/workflow-engine.ts`)

Created a comprehensive workflow engine with:

- **`executeWorkflowStep(workflow, execution, stepIndex, data)`** — Executes a single step based on action type
- **Step executors for each action type**:
  - `SEND_EMAIL` → calls `sendEmail` from email-service with variable substitution
  - `MOVE_STAGE` → updates application's `currentStageId` via Prisma
  - `SCHEDULE_INTERVIEW` → creates Interview record with type, duration, scheduling
  - `SEND_SCREENING` → creates ScreeningQuestion records for a job
  - `AI_SCREEN_RESUME` → uses z-ai-web-dev-sdk for AI resume analysis, updates matchScore and aiAnalysis
  - `AI_GENERATE_QUESTIONS` → uses z-ai-web-dev-sdk for interview question generation
  - `ADD_TAG` → appends tag to application notes
  - `ASSIGN_RECRUITER` → adds assignment note to application
  - `SEND_NOTIFICATION` → creates Notification record
  - `WEBHOOK` → sends HTTP POST to configured URL
  - `WAIT` → no-op with delay handling (pauses execution for delays > 60s)
  - `CONDITION_CHECK` — evaluates conditions (equals, not_equals, greater_than, less_than, contains), supports skipOnFail
- **`executeWorkflow(workflow, execution, data)`** — Executes all steps sequentially, updates execution status
- **`triggerWorkflows(event, data)`** — Finds all ACTIVE workflows matching trigger, creates WorkflowExecution, executes steps
- **4 pre-built workflow templates**:
  1. Auto-Screen New Applications (APPLICATION_RECEIVED → AI_SCREEN_RESUME → CONDITION_CHECK → MOVE_STAGE → SEND_NOTIFICATION)
  2. No Response Follow-up (CANDIDATE_NO_RESPONSE → WAIT(3 days) → SEND_EMAIL)
  3. Interview Auto-Schedule (STAGE_CHANGED → SCHEDULE_INTERVIEW → SEND_EMAIL)
  4. Offer Accepted → Onboarding (OFFER_ACCEPTED → SEND_EMAIL → SEND_NOTIFICATION)

### 2. API Routes

**`/api/workflows/route.ts`** (GET/POST)
- Auth: `requireCompanyMember`
- GET: lists workflows for company with `_count.executions`
- POST: creates workflow with name, description, trigger, triggerConfig, steps, status

**`/api/workflows/[id]/route.ts`** (GET/PATCH/DELETE)
- Auth: `requireCompanyMember`
- Full CRUD with existence checks

**`/api/workflows/[id]/trigger/route.ts`** (POST)
- Auth: `requireCompanyMember`
- Validates workflow is ACTIVE
- Creates WorkflowExecution
- Fires `executeWorkflow` in background

**`/api/workflows/[id]/executions/route.ts`** (GET)
- Auth: `requireCompanyMember`
- Lists executions with pagination (limit/offset)

**`/api/workflows/templates/route.ts`** (GET)
- Auth: `requireCompanyMember`
- Returns pre-built workflow templates

### 3. Frontend Page: REWRITTEN `/company/workflows/content.tsx`

Completely rewritten with real API data:

- **'use client'** directive
- **Stats Row** (4 cards with `.card-hover-lift`): Active Workflows, Total Executions, Running Now, Success Rate
- **Workflow List**:
  - Cards showing: name, status badge, trigger badge, step flow preview, step count, execution count
  - Status badges: ACTIVE (green/emerald), PAUSED (amber), DRAFT (gray/slate), ARCHIVED (neutral)
  - Toggle switch for active/paused
  - DropdownMenu with: Edit, Duplicate, Trigger Manually, Execution History, Delete
- **Create/Edit Workflow Dialog** (4-step stepper form):
  - Step 1: Basic Info (name, description)
  - Step 2: Trigger Setup (trigger type dropdown, conditional config fields)
  - Step 3: Add Steps (dynamic list with reorder, action type dropdowns, per-action config fields)
  - Step 4: Review & Save (summary card)
- **Use Template Dialog**: 4 pre-built templates with trigger badge, step preview, one-click apply
- **Execution History Dialog**: 
  - Table with triggeredBy, status badge, step progress, started/completed times
  - Click row → execution detail with step-by-step progress (green check for success, red X for failed)
- **Delete Confirmation Dialog** with warning
- All text uses `t.workflows.*` i18n keys
- Uses shadcn/ui components (Card, Dialog, Table, Badge, Button, Select, DropdownMenu)
- Uses teal/emerald accent colors
- CSS classes: `.card-hover-lift`, `.animate-fade-in-up`
- Toast notifications via `sonner`

### 4. i18n Keys

Added ~75 new keys to BOTH `en.json` and `ar.json` under `workflows` section:
- title, subtitle, activeWorkflows, totalExecutions, runningNow, successRate
- createWorkflow, editWorkflow, useTemplate
- workflowName, description, trigger, triggerConfig, steps, addAction, removeStep
- actionType + all 12 action labels (sendEmail, moveStage, scheduleInterview, etc.)
- actionConfig, delayMinutes, delayHours, delayDays
- executionHistory, triggeredBy, system, manual
- running, completed, failed, paused, active, draft, archived
- toggleActive, triggerManually, duplicate, deleteWorkflow, saveWorkflow
- noWorkflows, templates
- 4 template names + descriptions (autoScreen, noResponseFollowup, interviewSchedule, offerOnboarding)
- All trigger labels (applicationReceived, stageChanged, etc.)
- stepProgress, of
- basicInfo, triggerSetup, addSteps, reviewAndSave, next, previous
- confirmDelete, duplicateName, selectTemplate
- Toast messages: templateApplied, workflowCreated, workflowUpdated, workflowDeleted, workflowTriggered, workflowToggled
- emptyTitle, emptyDesc

### 5. Navigation

Verified that `/company/workflows` nav item already exists in the company sidebar layout with `GitMerge` icon and `workflows` labelKey. Breadcrumb map also exists.

## QA Results
- Lint: Clean with zero errors ✅
- Page `/company/workflows` returns HTTP 200 ✅
- API `/api/workflows` returns 401 (auth required) ✅
- All i18n keys properly structured in both EN and AR ✅
- No framer-motion used — CSS animations only ✅
- No recharts used ✅
- Uses z-ai-web-dev-sdk in backend only ✅
- All API routes use `requireCompanyMember` auth guard ✅
