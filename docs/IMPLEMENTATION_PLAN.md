# TalentFlow AI — 30 Feature Implementation Plan (2026)

> **Generated:** Based on 2026 HR/ATS market research, competitor analysis (Greenhouse, Ashby, Lever, BambooHR, Workday), and deep codebase audit.
> **Stack:** Next.js 16, Prisma/SQLite, Zustand, NextAuth v4, z-ai-web-dev-sdk, shadcn/ui, Tailwind CSS 4
> **Current State:** 60+ pages, 55+ APIs, 37 Prisma models, 13 AI features, EN+AR i18n

---

## Table of Contents

1. [Implementation Phases](#implementation-phases)
2. [Phase 1: Infrastructure & Legal (Features 1-5)](#phase-1)
3. [Phase 2: Market Parity — Recruiting (Features 6-10)](#phase-2)
4. [Phase 3: Market Parity — Hiring Operations (Features 11-18)](#phase-3)
5. [Phase 4: Market Leadership (Features 19-24)](#phase-4)
6. [Phase 5: Polish & Enterprise (Features 25-30)](#phase-5)
7. [Shared Infrastructure Tasks](#shared-infrastructure)
8. [Prisma Schema Changes Summary](#prisma-schema-changes)
9. [New API Routes Summary](#new-api-routes)
10. [New Page Routes Summary](#new-page-routes)
11. [i18n Keys Estimate](#i18n-keys-estimate)
12. [Risk & Mitigation](#risk--mitigation)

---

## Implementation Phases

| Phase | Features | Focus | Est. Time | Can Parallel? |
|-------|----------|-------|-----------|---------------|
| **Phase 1** | #1-5 | Infrastructure & Legal | 8-10 days | Partial |
| **Phase 2** | #6-10 | Recruiting Market Parity | 7-9 days | Partial |
| **Phase 3** | #11-18 | Hiring Operations Parity | 10-12 days | High |
| **Phase 4** | #19-24 | Market Leadership | 7-9 days | Partial |
| **Phase 5** | #25-30 | Polish & Enterprise | 6-8 days | High |
| | | **TOTAL** | **38-48 days** | |

---

<a id="phase-1"></a>
## Phase 1: Infrastructure & Legal (Features #1-5)

These are **must-haves** — legal compliance (EU AI Act Aug 2026), basic email infrastructure, and revenue generation.

---

### Feature #1: AI Bias Detection & Fair Hiring Audits

**Priority:** 🔴 CRITICAL (EU AI Act compliance, effective Aug 2, 2026)
**Market:** Every ATS that uses AI for screening must provide bias audits. NYC Local Law 144 already requires this.
**Status:** ❌ None — we use AI for screening/ranking but have zero bias detection.

#### Prisma Schema Changes

```prisma
// NEW MODEL: BiasAudit
model BiasAudit {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  auditType       String   // "SCREENING", "MATCH_SCORING", "RISK_ANALYSIS", "OVERALL"
  dateRange       String   // JSON: { from: "2026-01-01", to: "2026-06-01" }
  totalCandidates Int      @default(0)
  metrics         String   // JSON: { demographicGroups: [...], selectionRates: [...] }
  adverseImpact   String   // JSON: { fourFifthsRule: bool, disparateImpact: bool, details: [...] }
  recommendations String   // JSON: array of recommendation strings
  status          String   @default("PENDING") // PENDING, COMPLETED, FLAGGED
  createdAt       DateTime @default(now())
}

// NEW MODEL: FairHiringConfig
model FairHiringConfig {
  id                      String  @id @default(cuid())
  companyId               String  @unique
  company                 Company @relation(fields: [companyId], references: [id])
  biasDetectionEnabled    Boolean @default(true)
  protectedAttributes     String  @default('["gender","ethnicity","veteranStatus","disabilityStatus"]') // JSON
  autoFlagThreshold       Float   @default(0.8) // 4/5ths rule threshold
  excludeFromScoring      String  @default('["gender","ethnicity","age"]') // JSON
  auditFrequency          String  @default("MONTHLY") // WEEKLY, MONTHLY, QUARTERLY
  lastAuditAt             DateTime?
}

// Add relation to Company model:
// biasAudits BiasAudit[]
// fairHiringConfig FairHiringConfig?
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/bias-audit` | POST | Run AI bias audit on screening/scoring data using z-ai-web-dev-sdk |
| `/api/ai/bias-audit` | GET | List past bias audits |
| `/api/ai/bias-audit/[id]` | GET | Get audit details |
| `/api/companies/fair-hiring-config` | GET/PATCH | Get/update fair hiring configuration |

#### AI Bias Audit Algorithm

```
1. Query all applications in date range for the company
2. Group by protected attributes (gender, ethnicity, veteran, disability)
3. Calculate selection rate per group (hired / applied)
4. Apply 4/5ths rule: if any group's selection rate < 80% of highest group's rate → ADVERSE IMPACT
5. Calculate disparate impact ratio
6. Use z-ai-web-dev-sdk to generate recommendations for flagged areas
7. Store audit results in BiasAudit model
```

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/fair-hiring` | Company | Fair hiring dashboard, bias audit reports, config |
| `/admin/ai-compliance` | Admin | Platform-wide AI compliance monitoring |

#### i18n Keys (~60 per language)

- `fairHiring.*`: title, subtitle, runAudit, auditHistory, adverseImpact, fourFifthsRule, disparateImpact, selectionRate, demographicGroup, flagged, passed, recommendations, etc.
- `aiCompliance.*`: title, subtitle, platformAudits, complianceStatus, euAiAct, etc.

#### Frontend Components

- **BiasAuditDashboard**: Shows audit history, latest results, trend charts
- **AdverseImpactMatrix**: Table showing selection rates by demographic group with color coding (green/yellow/red)
- **FairHiringConfigForm**: Toggle bias detection, set thresholds, choose protected attributes
- **AuditDetailDialog**: Full audit report with recommendations

---

### Feature #2: Agentic AI Recruiting Workflows

**Priority:** 🔴 CRITICAL (#1 2026 trend)
**Market:** Agentic AI is the biggest 2026 recruiting trend. Autonomous multi-step hiring workflows.
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW ENUM: WorkflowTrigger
enum WorkflowTrigger {
  APPLICATION_RECEIVED
  STAGE_CHANGED
  INTERVIEW_COMPLETED
  OFFER_ACCEPTED
  OFFER_DECLINED
  CANDIDATE_NO_RESPONSE
  SCHEDULED_TIME
  MANUAL_TRIGGER
}

// NEW ENUM: WorkflowActionType
enum WorkflowActionType {
  SEND_EMAIL
  MOVE_STAGE
  SCHEDULE_INTERVIEW
  SEND_SCREENING
  AI_SCREEN_RESUME
  AI_GENERATE_QUESTIONS
  ADD_TAG
  ASSIGN_RECRUITER
  SEND_NOTIFICATION
  WEBHOOK
  WAIT
  CONDITION_CHECK
}

// NEW ENUM: WorkflowStatus
enum WorkflowStatus {
  ACTIVE
  PAUSED
  DRAFT
  ARCHIVED
}

// NEW MODEL: HiringWorkflow
model HiringWorkflow {
  id          String          @id @default(cuid())
  companyId   String
  company     Company         @relation(fields: [companyId], references: [id])
  name        String
  description String?
  trigger     WorkflowTrigger
  triggerConfig String?       // JSON: e.g., { stageId: "xxx", jobTypes: ["FULL_TIME"] }
  steps       String          // JSON: [{ order: 1, action: "AI_SCREEN_RESUME", config: {...}, delay: 0 }, ...]
  status      WorkflowStatus  @default(DRAFT)
  executions  WorkflowExecution[]
  isDefault   Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

// NEW MODEL: WorkflowExecution
model WorkflowExecution {
  id          String   @id @default(cuid())
  workflowId  String
  workflow    HiringWorkflow @relation(fields: [workflowId], references: [id])
  applicationId String?
  candidateId String?
  status      String   @default("RUNNING") // RUNNING, COMPLETED, FAILED, PAUSED
  currentStep Int      @default(0)
  stepResults String   // JSON: array of step execution results
  triggeredBy String   // userId who triggered or "SYSTEM"
  startedAt   DateTime @default(now())
  completedAt DateTime?
  error       String?
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/workflows` | GET/POST | List/create workflows |
| `/api/workflows/[id]` | GET/PATCH/DELETE | Get/update/delete workflow |
| `/api/workflows/[id]/trigger` | POST | Manually trigger a workflow |
| `/api/workflows/[id]/executions` | GET | List executions for a workflow |
| `/api/workflows/[id]/executions/[execId]` | GET | Get execution detail |

#### Workflow Engine (New mini-service or in-app)

**Option A (Recommended):** In-app API route with background processing
- When trigger event occurs (application received, stage changed, etc.), middleware checks active workflows
- Executes steps sequentially with delays
- Each step: call the corresponding API (send email, move stage, AI screen, etc.)

**Step execution logic:**
```
1. Trigger fires → check all ACTIVE workflows matching this trigger
2. Check triggerConfig conditions (job type, stage, etc.)
3. Create WorkflowExecution record
4. Execute steps in order:
   - AI_SCREEN_RESUME → call /api/ai/analyze-resume
   - MOVE_STAGE → call /api/applications PATCH
   - SEND_EMAIL → call /api/emails/send (new)
   - SCHEDULE_INTERVIEW → call /api/interviews POST
   - WAIT → setTimeout (for delays)
   - CONDITION_CHECK → evaluate condition, branch
5. Record step result in stepResults JSON
6. Advance currentStep
7. If all steps done → status = COMPLETED
```

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/workflows` | Company | **Rewrite existing page** — currently UI-only, wire to real API |

#### Frontend Components

- **WorkflowBuilder**: Visual step-by-step workflow builder
  - Step cards: drag to reorder, configure action, set delays
  - Trigger selector: choose when workflow runs
  - Action config: each action type has its own config form
  - Preview: show what the workflow will do
- **WorkflowExecutionList**: Shows running/past executions with step-by-step progress
- **WorkflowTemplates**: Pre-built workflow templates (auto-screen → auto-respond, no-response follow-up, etc.)

#### i18n Keys (~80 per language)

- `workflows.*`: title, subtitle, createWorkflow, editWorkflow, trigger, triggerConfig, steps, addAction, actionTypes.*, executionHistory, running, completed, failed, etc.

---

### Feature #3: Skills-Based Hiring Engine

**Priority:** 🔴 CRITICAL (85% of employers use skills-based hiring in 2026)
**Market:** iMocha, HackerRank, TestGorilla are standalone platforms. ATS platforms are integrating assessment engines.
**Status:** ⚠️ We have basic `Assessment` + `AssessmentResult` models but NO skills-based scoring, skills taxonomy, or skills matching engine.

#### Prisma Schema Changes

```prisma
// NEW MODEL: SkillsTaxonomy
model SkillsTaxonomy {
  id          String   @id @default(cuid())
  name        String   // e.g., "JavaScript", "Project Management"
  category    String   // e.g., "TECHNICAL", "SOFT_SKILL", "DOMAIN", "TOOL", "CERTIFICATION"
  subcategory String?  // e.g., "Frontend", "Leadership"
  description String?
  aliases     String?  // JSON: ["JS", "ECMAScript"]
  relatedSkills String? // JSON: ["TypeScript", "React"]
  demandLevel String?  // HIGH, MEDIUM, LOW
  isActive    Boolean  @default(true)
}

// NEW MODEL: SkillAssessment
model SkillAssessment {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  title           String
  description     String?
  skillIds        String   // JSON: array of skill taxonomy IDs
  questions       String   // JSON: [{ question, type, options, correctAnswer, skillId, difficulty }]
  timeLimitMinutes Int?
  passingScore    Float    @default(70.0)
  type            String   @default("CUSTOM") // CUSTOM, CODING, SITUATIONAL, BEHAVIORAL
  isActive        Boolean  @default(true)
  results         SkillAssessmentResult[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// NEW MODEL: SkillAssessmentResult
model SkillAssessmentResult {
  id              String   @id @default(cuid())
  assessmentId    String
  assessment      SkillAssessment @relation(fields: [assessmentId], references: [id])
  candidateId     String
  answers         String   // JSON
  score           Float?
  skillScores     String?  // JSON: { "skillId": { score: 85, level: "ADVANCED" } }
  overallLevel    String?  // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  aiFeedback      String?  // JSON: AI-generated feedback per skill
  completedAt     DateTime @default(now())
}

// NEW MODEL: CandidateSkill
model CandidateSkill {
  id              String   @id @default(cuid())
  candidateId     String
  skillId         String   // SkillsTaxonomy ID
  level           String   // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  verified        Boolean  @default(false) // Verified by assessment
  verifiedAt      DateTime?
  yearsExperience Int?
  source          String   @default("SELF_REPORTED") // SELF_REPORTED, ASSESSMENT, AI_EXTRACTED, REFERENCE
}

// Add relations to existing models:
// Company.skillAssessments SkillAssessment[]
// CandidateProfile.candidateSkills CandidateSkill[]
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/skills/taxonomy` | GET | Browse/search skills taxonomy |
| `/api/skills/match` | POST | Match candidate skills to job requirements, return match score + gaps |
| `/api/skill-assessments` | GET/POST | List/create skill assessments |
| `/api/skill-assessments/[id]` | GET/PATCH/DELETE | CRUD |
| `/api/skill-assessments/[id]/take` | POST | Candidate submits assessment answers |
| `/api/skill-assessments/[id]/results` | GET | Get results |
| `/api/skill-assessments/[id]/ai-generate` | POST | AI-generate assessment questions for given skills |
| `/api/candidates/[id]/skills` | GET/PATCH | Get/update candidate's skill profile |

#### AI Integration

- **Skills Matching**: Use z-ai-web-dev-sdk to compare candidate skills vs job requirements → match score + gap analysis
- **Assessment Generation**: AI generates questions for specified skills
- **Answer Evaluation**: AI evaluates open-ended answers and assigns skill levels

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/skill-assessments` | Company | Create/manage skill assessments |
| `/company/skills-dashboard` | Company | Skills gap analytics across company |
| `/candidate/skills` | Candidate | **Rewrite existing page** — add verified skills, skill assessments |
| `/candidate/take-assessment/[id]` | Candidate | Take a skill assessment |

#### i18n Keys (~70 per language)

- `skillAssessment.*`: title, subtitle, createAssessment, generateWithAI, questionTypes.*, skillScores, overallLevel, verified, selfReported, etc.

---

### Feature #4: Job Board Multi-Posting

**Priority:** 🔴 CRITICAL (every ATS has this)
**Market:** Post to LinkedIn, Indeed, Glassdoor, ZipRecruiter, etc. from one click.
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW ENUM: JobBoardStatus
enum JobBoardStatus {
  PENDING
  POSTED
  FAILED
  EXPIRED
  REMOVED
}

// NEW MODEL: JobBoard
model JobBoard {
  id          String   @id @default(cuid())
  name        String   // "LinkedIn", "Indeed", "Glassdoor"
  logo?       String?
  apiBaseUrl  String?
  apiVersion? String?
  isActive    Boolean  @default(true)
  config      String?  // JSON: { authType, fields, mapping }
}

// NEW MODEL: JobBoardPosting
model JobBoardPosting {
  id          String         @id @default(cuid())
  jobId       String
  job         Job            @relation(fields: [jobId], references: [id])
  boardId     String
  board       JobBoard       @relation(fields: [boardId], references: [id])
  status      JobBoardStatus @default(PENDING)
  externalId  String?        // ID on the external board
  externalUrl String?        // URL of the posted job on the board
  postedAt    DateTime?
  expiresAt   DateTime?
  views       Int            @default(0)
  clicks      Int            @default(0)
  applications Int           @default(0)
  error       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([jobId, boardId])
}
```

#### Implementation Approach

Since we can't integrate with actual job board APIs (requires API keys, partnerships, and complex OAuth flows), we implement:

1. **Simulated Multi-Posting UI** — Show available boards, toggle which to post to, track status
2. **Webhook/Callback Architecture** — Design the API so real integrations can be plugged in later
3. **Analytics Dashboard** — Track views, clicks, applications per board

For the initial implementation:
- Pre-seed JobBoard entries for: LinkedIn, Indeed, Glassdoor, ZipRecruiter, AngelList, Wellfound, Bayt (MENA), Naukrigulf (MENA)
- "Post" creates JobBoardPosting records with PENDING → POSTED after simulated delay
- Track analytics per board

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/job-boards` | GET | List available job boards |
| `/api/jobs/[id]/post-to-boards` | POST | Post a job to selected boards |
| `/api/jobs/[id]/postings` | GET | Get posting status across boards |
| `/api/jobs/[id]/postings/[postingId]` | PATCH/DELETE | Update/remove a posting |
| `/api/job-boards/analytics` | GET | Analytics across all postings |

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/jobs/create` | Company | **Extend existing** — add "Post to Job Boards" step |
| `/company/job-boards` | Company | Job board management, analytics |

#### Frontend Components

- **JobBoardSelector**: Toggle board selection with logos, show estimated reach
- **PostingStatusTable**: Per-board status with views/clicks/applications
- **JobBoardAnalytics**: Charts showing performance across boards

#### i18n Keys (~40 per language)

- `jobBoards.*`: title, subtitle, postToBoards, selectBoards, postingStatus, views, clicks, applications, boardNames.*, etc.

---

### Feature #5: Actual Email Delivery (SMTP)

**Priority:** 🔴 CRITICAL (basic infrastructure)
**Market:** Every ATS sends emails. Ours logs verification tokens to console.
**Status:** ❌ No email infrastructure at all.

#### Prisma Schema Changes

```prisma
// NEW MODEL: EmailLog
model EmailLog {
  id          String   @id @default(cuid())
  companyId   String?
  userId      String?
  to          String
  from        String   @default("noreply@talentflow.ai")
  subject     String
  body        String   // HTML
  templateId  String?
  status      String   @default("PENDING") // PENDING, SENT, FAILED, BOUNCED
  provider    String?  // "RESEND", "SMTP", "CONSOLE"
  providerId  String?  // External ID from provider
  openedAt    DateTime?
  clickedAt   DateTime?
  error       String?
  sentAt      DateTime?
  createdAt   DateTime @default(now())
}
```

#### Implementation Approach

**Option A (Recommended for sandbox): Resend API**
- Free tier: 100 emails/day, 3,000/month
- Simple REST API, no SMTP server setup
- Works perfectly in sandbox environment

**Option B: Console logging with UI preview**
- In development/sandbox: log emails to console + store in EmailLog
- Show email preview in notification center
- When deployed: swap to Resend/SendGrid

**Implementation steps:**
1. Create `src/lib/email-service.ts` — unified email sending service
2. Create `src/lib/email-templates/` — template rendering functions
3. Wire up existing email templates (EmailTemplate model) to actual sending
4. Replace all `console.log('Verification token:', token)` with actual email sending
5. Add email queue for bulk sending (uses existing BulkEmailCampaign model)

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/emails/send` | POST | Send single email (auth required) |
| `/api/emails/logs` | GET | Email sending history |
| `/api/emails/preview/[id]` | GET | Preview sent email |

#### Email Templates to Implement

1. **Email Verification** — `/auth/verify-email` flow
2. **Password Reset** — `/auth/forgot-password` flow
3. **Application Received** — Candidate confirmation
4. **Interview Scheduled** — Interview details to candidate
5. **Interview Reminder** — 24h before interview
6. **Offer Letter** — Offer sent notification
7. **Rejection** — Post-interview rejection
8. **Welcome Aboard** — After offer accepted
9. **Bulk Campaign** — Use existing BulkEmailCampaign model

#### i18n Keys (~20 per language)

- `email.*`: sent, failed, bounced, preview, logs, resend, etc.

---

<a id="phase-2"></a>
## Phase 2: Market Parity — Recruiting (Features #6-10)

---

### Feature #6: Talent Rediscovery / AI-Powered CRM

**Priority:** 🔴 HIGH (Ashby just launched this, key differentiator)
**Market:** 70% of past candidates are never re-engaged. AI rediscovery surfaces them.
**Status:** ⚠️ We have TalentPool + TalentPoolMember but no AI-powered rediscovery, no re-engagement, no sourcing.

#### Prisma Schema Changes

```prisma
// Add to existing TalentPoolMember model:
// lastMatchScore Float?
// lastMatchedAt  DateTime?
// notes          String?  // Already exists

// NEW MODEL: SourcingCampaign
model SourcingCampaign {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  jobId       String?  // Optional: link to specific job
  criteria    String   // JSON: { skills: [...], experience: "3+ years", location: "Remote", ... }
  status      String   @default("ACTIVE") // ACTIVE, PAUSED, COMPLETED
  matchedCandidates String // JSON: [{ candidateId, matchScore, matchReasons }]
  contactedCount Int   @default(0)
  respondedCount  Int  @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// NEW MODEL: CandidateEngagement
model CandidateEngagement {
  id           String   @id @default(cuid())
  candidateId  String
  companyId    String
  type         String   // EMAIL_SENT, EMAIL_OPENED, EMAIL_CLICKED, INTERVIEW_SCHEDULED, APPLIED, VIEWED_PROFILE
  campaignId   String?  // Link to SourcingCampaign
  details      String?  // JSON
  createdAt    DateTime @default(now())
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/talent-rediscovery/search` | POST | AI-powered search for past candidates matching job criteria |
| `/api/talent-rediscovery/recommend` | POST | Get AI recommendations for re-engaging past candidates |
| `/api/sourcing-campaigns` | GET/POST | List/create sourcing campaigns |
| `/api/sourcing-campaigns/[id]` | GET/PATCH/DELETE | CRUD |
| `/api/candidate-engagement` | GET/POST | Track/log candidate engagement events |

#### AI Integration

- **Talent Rediscovery Search**: Given job requirements → search all past applicants → rank by relevance using z-ai-web-dev-sdk
- **Re-engagement Recommendations**: AI suggests which past candidates to contact and with what messaging
- **Matching**: Compare candidate profile (skills, experience) vs job requirements → match score + reasons

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/talent-pool` | Company | **Extend existing** — add Rediscovery tab |
| `/company/sourcing` | Company | Sourcing campaigns, AI candidate search |

#### i18n Keys (~50 per language)

- `talentRediscovery.*`: title, subtitle, searchPastCandidates, matchScore, matchReasons, reEngage, lastActive, etc.
- `sourcing.*`: title, subtitle, createCampaign, criteria, matchedCandidates, contacted, responded, etc.

---

### Feature #7: Self-Scheduling Interviews

**Priority:** 🔴 HIGH (every modern ATS has this)
**Market:** Calendly-style scheduling built into the ATS. Candidates pick their own time slots.
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: InterviewScheduleSlot
model InterviewScheduleSlot {
  id            String   @id @default(cuid())
  interviewerId String
  interviewer   User     @relation(fields: [interviewerId], references: [id])
  startTime     DateTime
  endTime       DateTime
  isBooked      Boolean  @default(false)
  applicationId String?  // If booked, which application
  interviewId   String?  // If booked, which interview
  recurrence    String?  // JSON: { days: [1,2,3,4,5], startTime: "09:00", endTime: "17:00", duration: 60 }
  createdAt     DateTime @default(now())
}

// NEW MODEL: InterviewerAvailability
model InterviewerAvailability {
  id            String   @id @default(cuid())
  interviewerId String
  interviewer   User     @relation(fields: [interviewerId], references: [id])
  companyId     String
  dayOfWeek     Int      // 0=Sunday, 6=Saturday
  startTime     String   // "09:00"
  endTime       String   // "17:00"
  slotDuration  Int      @default(60) // minutes
  bufferBetween Int      @default(15) // minutes between slots
  isActive      Boolean  @default(true)
  timezone      String   @default("UTC")
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/interviews/availability` | GET/POST | Get/set interviewer availability |
| `/api/interviews/slots` | GET | Get available slots for an interview |
| `/api/interviews/self-schedule` | POST | Candidate books a slot |
| `/api/interviews/self-schedule/[token]` | GET | Verify scheduling token & show form |

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/interviews` | Company | **Extend existing** — add availability management |
| `/schedule/[token]` | Public | Candidate self-scheduling page (no auth required) |

#### i18n Keys (~45 per language)

- `selfScheduling.*`: title, subtitle, pickTime, availableSlots, noSlotsAvailable, confirmBooking, bookingConfirmed, etc.

---

### Feature #8: Mobile-Optimized Apply Flow

**Priority:** 🔴 HIGH (most candidates apply from phones)
**Market:** Text-to-apply, one-click apply, mobile-first forms.
**Status:** ⚠️ Responsive UI exists but no mobile-specific apply flow

#### Prisma Schema Changes

```prisma
// NEW MODEL: QuickApplyConfig
model QuickApplyConfig {
  id              String  @id @default(cuid())
  jobId           String  @unique
  job             Job     @relation(fields: [jobId], references: [id])
  enableOneClick  Boolean @default(false) // LinkedIn-style one-click with profile data
  enableQuickApply Boolean @default(true) // Name + Email + Resume only
  minFields       String  @default('["name","email","resume"]') // JSON
  enableTextApply Boolean @default(false) // Text-to-apply
  textApplyCode   String? // Short code like "TF-1234"
  qrCodeUrl       String? // Generated QR code URL
}

// NEW MODEL: TextApplySession
model TextApplySession {
  id          String   @id @default(cuid())
  jobId       String
  phoneNumber String
  status      String   @default("STARTED") // STARTED, LINK_SENT, APPLIED, EXPIRED
  applyLink   String   // Unique link sent via SMS
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jobs/[id]/quick-apply` | POST | One-click/quick apply (minimal fields) |
| `/api/text-apply/start` | POST | Start text-to-apply flow |
| `/api/text-apply/verify` | POST | Verify text-apply code |
| `/api/jobs/[id]/qr-apply` | GET | Generate QR code for job |

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/apply/[jobSlug]` | Public | Mobile-optimized quick apply page |
| `/apply/quick/[token]` | Public | Text-apply landing page |

#### Frontend Components

- **QuickApplyForm**: Minimal form (name, email, resume upload) → one submit
- **OneClickApply**: "Apply with LinkedIn" button using profile data
- **QRCodeDisplay**: Generate and display QR code per job
- **MobileApplyProgress**: Stepper optimized for small screens

#### i18n Keys (~30 per language)

- `quickApply.*`: title, subtitle, applyNow, oneClick, quickApply, textApply, scanQRCode, etc.

---

### Feature #9: In-App Recruiting Chatbot

**Priority:** 🟠 HIGH (24/7 candidate engagement)
**Market:** Recruitment chatbots handle FAQ, schedule interviews, screen candidates.
**Status:** ⚠️ Landing page chatbot exists but NOT in candidate/company portals.

#### Prisma Schema Changes

```prisma
// Extend existing ChatConversation model:
// Add source values: "LANDING", "CANDIDATE_PORTAL", "COMPANY_PORTAL"

// NEW MODEL: ChatbotConfig
model ChatbotConfig {
  id                String  @id @default(cuid())
  companyId         String  @unique
  company           Company @relation(fields: [companyId], references: [id])
  welcomeMessage    String  @default("Hi! I'm your AI recruiting assistant. How can I help?")
  personality       String  @default("professional") // professional, friendly, casual
  enabledFeatures   String  @default('["job_search","application_status","faq","interview_prep"]') // JSON
  knowledgeBase     String? // JSON: company FAQ, policies, benefits
  isActive          Boolean @default(true)
  leadCaptureEnabled Boolean @default(true)
  leadCaptureFields String  @default('["name","email","phone"]') // JSON
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chatbot/company` | POST | Company portal chatbot (context: company jobs, FAQ) |
| `/api/chatbot/candidate` | POST | Candidate portal chatbot (context: applications, interviews) |
| `/api/chatbot/config` | GET/PATCH | Get/update chatbot configuration |

#### AI Integration

- **Company Chatbot**: Answers job-related FAQs, helps candidates find jobs, captures leads
- **Candidate Chatbot**: Checks application status, provides interview tips, answers process questions
- **Context Injection**: Inject company knowledge base, job listings, and candidate's application data into system prompt

#### Page Integration

- Add floating chatbot widget to candidate portal layout
- Add configurable chatbot widget to company career pages
- Extend existing `src/components/shared/ai-chatbot.tsx`

#### i18n Keys (~25 per language)

- `chatbot.*`: welcomeMessage, candidateHelp, companyHelp, jobSearch, applicationStatus, interviewTips, etc.

---

### Feature #10: Stripe Payment Integration

**Priority:** 🟠 HIGH (revenue generation)
**Market:** Every SaaS ATS needs actual payment processing.
**Status:** ⚠️ Billing models exist but no Stripe — subscriptions are just DB records.

#### Prisma Schema Changes

```prisma
// Add to existing Subscription model:
// stripeCustomerId     String?
// stripeSubscriptionId String?
// stripePriceId        String?
// currentPeriodStart   DateTime?
// currentPeriodEnd     DateTime?

// Add to existing Invoice model:
// stripeInvoiceId String?
// hostedInvoiceUrl String?
// invoicePdf      String?

// Add to existing Company model:
// stripeCustomerId String?

// Add to existing Plan model:
// stripePriceId String?
```

#### Implementation Approach

Since we're in a sandbox, we implement a **simulated Stripe flow**:

1. Create `/api/stripe/checkout-session` — simulates creating a Stripe checkout session
2. Create `/api/stripe/webhook` — simulates receiving Stripe webhooks
3. Create `/api/stripe/portal` — simulates Stripe customer portal
4. Use Stripe.js for the checkout UI flow (test mode)
5. Track subscription lifecycle in our DB

For production deployment:
- Replace simulated endpoints with real Stripe API calls
- Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` env vars

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/checkout-session` | POST | Create checkout session |
| `/api/stripe/portal` | POST | Create billing portal session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/api/stripe/subscription` | GET | Get current subscription details |
| `/api/stripe/invoices` | GET | Get invoice history |

#### Page Changes

- Extend `/company/billing` page with actual Stripe checkout
- Extend `/admin/billing` with revenue analytics from Stripe data

#### i18n Keys (~30 per language)

- `stripe.*`: checkout, subscribe, upgrade, downgrade, cancelSubscription, billingPortal, paymentMethod, etc.

---

<a id="phase-3"></a>
## Phase 3: Market Parity — Hiring Operations (Features #11-18)

These 8 features can be developed with **high parallelism** — they're largely independent.

---

### Feature #11: Structured Interview Scorecards

**Priority:** 🟠 HIGH
**Status:** ⚠️ InterviewAssignment has scorecard/rating fields but NO structured rubric

#### Prisma Schema Changes

```prisma
// NEW MODEL: ScorecardTemplate
model ScorecardTemplate {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String   // e.g., "Engineering Interview Scorecard"
  criteria    String   // JSON: [{ name: "Technical Skills", description: "...", weight: 30, ratingLevels: [...] }]
  totalWeight Int      @default(100)
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// Update InterviewAssignment scorecard field to be structured:
// scorecard JSON format:
// { templateId: "xxx", criteria: [{ name: "Technical Skills", rating: 4, notes: "Strong algorithm skills", weight: 30 }], overallRating: 4, recommendation: "STRONG_HIRE", notes: "..." }
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scorecard-templates` | GET/POST | List/create scorecard templates |
| `/api/scorecard-templates/[id]` | GET/PATCH/DELETE | CRUD |
| `/api/interviews/[id]/scorecard` | POST | Submit scorecard for an interview |

#### Page Changes

- Extend `/company/interviews` — add scorecard submission dialog after interview
- Add scorecard template management to company settings

#### i18n Keys (~35 per language)

---

### Feature #12: Offer E-Signatures

**Priority:** 🟠 HIGH
**Status:** ❌ None — offers can be created but not signed

#### Prisma Schema Changes

```prisma
// Add to Offer model:
// signingToken       String?   @unique
// signingTokenExpiry DateTime?
// candidateSignedAt  DateTime?
// candidateSignature String?   // Base64 signature image or typed name
// companySignedAt    DateTime?
// companySignerId    String?   // Who signed on behalf of company
// signingStatus      String    @default("PENDING") // PENDING, SENT, CANDIDATE_SIGNED, COMPLETED, EXPIRED, DECLINED
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/offers/[id]/send-for-signature` | POST | Send offer to candidate for signing |
| `/api/offers/[id]/sign` | POST | Candidate signs the offer |
| `/api/offers/[id]/signing-status` | GET | Check signing status |
| `/api/offers/[token]/view` | GET | Public view of offer for candidate (no auth) |

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/offer/[token]` | Public | Candidate offer review & signing page |

#### Frontend Components

- **SignaturePad**: Canvas-based signature drawing component
- **OfferReviewPage**: Full offer details, accept/decline buttons, signature pad

#### i18n Keys (~30 per language)

---

### Feature #13: Internal Mobility / Internal Job Board

**Priority:** 🟠 HIGH
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: InternalJobPosting
model InternalJobPosting {
  id              String   @id @default(cuid())
  jobId           String   @unique
  job             Job      @relation(fields: [jobId], references: [id])
  companyId       String
  postedById      String
  postedBy        User     @relation(fields: [postedById], references: [id])
  isInternalOnly  Boolean  @default(true)
  minTenureMonths Int      @default(6)  // Minimum tenure to apply
  notifyEmployees Boolean  @default(true)
  internalNotes   String?
  createdAt       DateTime @default(now())
}

// NEW MODEL: InternalApplication
model InternalApplication {
  id              String   @id @default(cuid())
  jobId           String
  candidateId     String   // The employee (has CandidateProfile)
  currentRoleId   String?  // Current position
  managerNotified Boolean  @default(false)
  managerApproved Boolean?
  status          String   @default("PENDING") // PENDING, MANAGER_APPROVED, INTERVIEW, OFFERED, HIRED, REJECTED
  notes           String?
  createdAt       DateTime @default(now())
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/internal-jobs` | GET | List internal job openings |
| `/api/internal-jobs/[id]/apply` | POST | Apply for internal position |
| `/api/internal-applications` | GET | List internal applications |

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/internal-jobs` | Company | Internal job board |
| `/candidate/internal-jobs` | Candidate | Browse internal openings (if employee) |

#### i18n Keys (~40 per language)

---

### Feature #14: Automated Onboarding Workflows

**Priority:** 🟠 HIGH
**Status:** ⚠️ Onboarding models exist but pages use mock data

This is primarily about **wiring existing pages to real APIs**.

#### What's Already There

- `OnboardingPlan`, `OnboardingAssignment`, `OnboardingTask` models in Prisma
- `/company/onboarding` page (UI-only)
- `/api/onboarding` route (exists)

#### Work Needed

1. Wire `/company/onboarding` page to `/api/onboarding` API
2. Add workflow triggers: offer accepted → auto-create onboarding assignment
3. Add task categories: IT Setup, HR Paperwork, Team Introduction, Training, etc.
4. Add progress tracking dashboard
5. Add new hire portal view for candidates who accepted offers
6. Add email notifications for task deadlines

#### New API Routes (extend existing)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/onboarding/trigger` | POST | Auto-trigger onboarding when offer accepted |
| `/api/onboarding/[id]/progress` | PATCH | Update task completion status |

#### i18n Keys (~30 per language)

---

### Feature #15: Real-Time Collaboration (Comments/Mentions)

**Priority:** 🟠 HIGH
**Status:** ❌ No threaded comments, @mentions, or real-time co-viewing

#### Prisma Schema Changes

```prisma
// NEW MODEL: Comment
model Comment {
  id          String    @id @default(cuid())
  entityType  String    // "APPLICATION", "CANDIDATE", "JOB", "INTERVIEW"
  entityId    String    // ID of the entity
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  parentId    String?   // For threaded replies
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  content     String
  mentions    String?   // JSON: array of mentioned userIds
  isPinned    Boolean   @default(false)
  isResolved  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// NEW MODEL: CommentReaction
model CommentReaction {
  id        String  @id @default(cuid())
  commentId String
  comment   Comment @relation(fields: [commentId], references: [id])
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  emoji     String  // "👍", "❤️", "🎉", etc.
  createdAt DateTime @default(now())

  @@unique([commentId, userId, emoji])
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/comments` | GET/POST | List/create comments |
| `/api/comments/[id]` | PATCH/DELETE | Update/delete comment |
| `/api/comments/[id]/reactions` | POST | Add reaction |
| `/api/mentions` | GET | Get user's mentions |

#### Real-Time Integration

- Push new comments via existing WebSocket service (port 3003)
- Send notification when @mentioned

#### i18n Keys (~25 per language)

---

### Feature #16: Source Tracking & Attribution

**Priority:** 🟠 HIGH
**Status:** ❌ None — Application has `source?` field but no tracking infrastructure

#### Prisma Schema Changes

```prisma
// NEW MODEL: ApplicationSource
model ApplicationSource {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String   // "LinkedIn", "Referral", "Career Page", "Indeed"
  type        String   // "JOB_BOARD", "REFERRAL", "SOCIAL", "CAREER_PAGE", "AGENCY", "DIRECT", "OTHER"
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
}

// Add to Application model:
// sourceId          String?  // Link to ApplicationSource
// utmSource         String?  // UTM parameters
// utmMedium         String?
// utmCampaign       String?
// utmContent        String?
// referralLinkId    String?  // Link to referral if applicable
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sources` | GET/POST | List/create application sources |
| `/api/sources/analytics` | GET | Source performance analytics |
| `/api/applications/by-source` | GET | Applications grouped by source |

#### Frontend Components

- **SourceAttributionTable**: Show applications, hires, time-to-hire, cost-per-hire by source
- **UTMParameterCapture**: Auto-capture UTM params from URL when candidate applies
- **SourceDropdown**: Add source selection to application form

#### i18n Keys (~25 per language)

---

### Feature #17: Custom Hiring Workflows per Job

**Priority:** 🟠 HIGH
**Status:** ⚠️ Pipeline stages exist but are per-company, not per-job

#### Prisma Schema Changes

```prisma
// Add to Job model:
// customPipelineEnabled Boolean @default(false)
// customStageIds       String? // JSON: array of PipelineStage IDs for this job

// NEW MODEL: JobWorkflowConfig
model JobWorkflowConfig {
  id          String   @id @default(cuid())
  jobId       String   @unique
  job         Job      @relation(fields: [jobId], references: [id])
  stageIds    String   // JSON: ordered array of stage IDs
  autoAdvanceRules String? // JSON: [{ fromStage: "xxx", toStage: "yyy", condition: "screening_passed" }]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Implementation

- When creating/editing a job, allow selecting which pipeline stages apply
- Each job can have a subset or reordered version of the company's stages
- Auto-advance rules: if screening passed → move to interview automatically

#### i18n Keys (~20 per language)

---

### Feature #18: Slack/Teams Integration

**Priority:** 🟠 HIGH
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: IntegrationConfig
model IntegrationConfig {
  id            String  @id @default(cuid())
  companyId     String  @unique
  company       Company @relation(fields: [companyId], references: [id])
  slackEnabled  Boolean @default(false)
  slackWebhookUrl String?
  slackChannel   String? // Default channel
  teamsEnabled   Boolean @default(false)
  teamsWebhookUrl String?
  teamsChannel    String?
  events         String  // JSON: ["application.created", "interview.scheduled", "offer.sent"]
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### Implementation

- Create webhook dispatcher service that sends notifications to Slack/Teams
- When configured events fire, POST to webhook URL with formatted message
- Add Slack Block Kit formatting for rich notifications
- Microsoft Teams Adaptive Cards for Teams integration

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/integrations/config` | GET/PATCH | Get/update integration settings |
| `/api/integrations/test` | POST | Send test notification to configured channel |

#### i18n Keys (~20 per language)

---

<a id="phase-4"></a>
## Phase 4: Market Leadership (Features #19-24)

---

### Feature #19: Candidate NPS / Experience Surveys

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: ExperienceSurvey
model ExperienceSurvey {
  id            String   @id @default(cuid())
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  type          String   // "POST_INTERVIEW", "POST_REJECTION", "POST_OFFER", "POST_ONBOARDING"
  triggerEvent  String   // What triggers the survey
  questions     String   // JSON: [{ question, type: "RATING"|"TEXT"|"NPS", required }]
  isActive      Boolean  @default(true)
}

// NEW MODEL: SurveyResponse
model SurveyResponse {
  id          String   @id @default(cuid())
  surveyId    String
  survey      ExperienceSurvey @relation(fields: [surveyId], references: [id])
  candidateId String
  applicationId String?
  responses   String   // JSON: [{ questionId, answer }]
  npsScore    Int?     // 0-10
  submittedAt DateTime @default(now())
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/experience-surveys` | GET/POST | List/create surveys |
| `/api/experience-surveys/[id]/submit` | POST | Submit survey response |
| `/api/experience-surveys/analytics` | GET | NPS scores, response rates, trends |
| `/api/experience-surveys/[token]` | GET | Public survey form (no auth) |

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/experience-surveys` | Company | Survey management & analytics |
| `/survey/[token]` | Public | Candidate survey form |

#### i18n Keys (~35 per language)

---

### Feature #20: Background Check Integration

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: BackgroundCheck
model BackgroundCheck {
  id              String   @id @default(cuid())
  applicationId   String
  application     Application @relation(fields: [applicationId], references: [id])
  candidateId     String
  type            String   // "CRIMINAL", "EDUCATION", "EMPLOYMENT", "CREDIT", "DRUG", "COMPREHENSIVE"
  provider        String   @default("INTERNAL") // "CHECKR", "STERLING", "INTERNAL"
  providerRequestId String?
  status          String   @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED, FLAGGED, FAILED
  results         String?  // JSON
  reportUrl       String?
  requestedAt     DateTime @default(now())
  completedAt     DateTime?
  notes           String?
}
```

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/background-checks` | GET/POST | List/request background checks |
| `/api/background-checks/[id]` | GET/PATCH | Get/update background check |

#### i18n Keys (~25 per language)

---

### Feature #21: Real Salary Benchmarking Data

**Priority:** 🟡 MEDIUM
**Status:** ⚠️ Page exists but uses mock data

#### Prisma Schema Changes

```prisma
// NEW MODEL: SalaryBenchmark
model SalaryBenchmark {
  id            String   @id @default(cuid())
  jobTitle      String
  location      String
  industry      String?
  experienceMin Int?
  experienceMax Int?
  currency      String   @default("USD")
  percentile25  Float
  percentile50  Float    // Median
  percentile75  Float
  percentile90  Float?
  source        String   @default("AI_ESTIMATED") // "AI_ESTIMATED", "BLS", "GLASSDOOR", "USER_REPORTED"
  year          Int      @default(2026)
  updatedAt     DateTime @updatedAt
}
```

#### AI Integration

- Use z-ai-web-dev-sdk to generate salary estimates based on job title, location, industry
- Cache results in SalaryBenchmark model
- Show percentile ranges with comparison to company's offered salary

#### i18n Keys (~20 per language)

---

### Feature #22: I-9 / Work Authorization Tracking

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: WorkAuthorization
model WorkAuthorization {
  id              String   @id @default(cuid())
  candidateId     String   @unique
  candidate       CandidateProfile @relation(fields: [candidateId], references: [id])
  authorizationType String // "US_CITIZEN", "PERMANENT_RESIDENT", "H1B", "L1", "OPT", "EAD", "TN", "OTHER"
  documentType    String?  // "PASSPORT", "GREEN_CARD", "VISA", "EAD_CARD"
  documentNumber  String?  // Encrypted
  documentExpiry  DateTime?
  i9Completed     Boolean  @default(false)
  i9CompletedAt   DateTime?
  i9DocumentSection String? // JSON: List A/B/C documents
  eVerifyStatus   String?  // "PENDING", "VERIFIED", "MISMATCH"
  eVerifyCaseNumber String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### i18n Keys (~25 per language)

---

### Feature #23: Offer Approval Workflow

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: OfferApproval
model OfferApproval {
  id          String   @id @default(cuid())
  offerId     String
  offer       Offer    @relation(fields: [offerId], references: [id])
  approverId  String
  approver    User     @relation(fields: [approverId], references: [id])
  order       Int      // Approval order (1 = first approver)
  status      String   @default("PENDING") // PENDING, APPROVED, REJECTED, SKIPPED
  comments    String?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
}
```

#### Implementation

- Configure approval chain per company (e.g., HR Manager → VP → CEO)
- When offer created with approval required → create OfferApproval records
- Each approver gets notification → approve/reject with comments
- Offer can only be sent after all approvals received

#### i18n Keys (~20 per language)

---

### Feature #24: Requisition Management

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW ENUM: RequisitionStatus
enum RequisitionStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  FILLED
  CANCELLED
}

// NEW MODEL: Requisition
model Requisition {
  id              String            @id @default(cuid())
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id])
  title           String            // "Senior Frontend Developer"
  department      String?
  reportingTo     String?           // Manager name
  headcount       Int               @default(1)
  filledCount     Int               @default(0)
  salaryRange     String?           // JSON: { min, max, currency }
  justification   String?
  targetStartDate DateTime?
  priority        String            @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  status          RequisitionStatus @default(DRAFT)
  approvals       RequisitionApproval[]
  jobId           String?           // Once approved, link to created job
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

// NEW MODEL: RequisitionApproval
model RequisitionApproval {
  id            String      @id @default(cuid())
  requisitionId String
  requisition   Requisition @relation(fields: [requisitionId], references: [id])
  approverId    String
  approver      User        @relation(fields: [approverId], references: [id])
  order         Int
  status        String      @default("PENDING") // PENDING, APPROVED, REJECTED
  comments      String?
  approvedAt    DateTime?
}
```

#### New Page Routes

| Route | Portal | Purpose |
|-------|--------|---------|
| `/company/requisitions` | Company | Requisition management |

#### i18n Keys (~35 per language)

---

<a id="phase-5"></a>
## Phase 5: Polish & Enterprise (Features #25-30)

These can be developed with **high parallelism**.

---

### Feature #25: AI Resume Optimization for Candidates

**Priority:** 🟡 MEDIUM
**Status:** ⚠️ We have resume analysis but not job-specific optimization

#### Implementation

- Extend existing `/api/ai/analyze-resume` to add an "optimize for job" mode
- Compare resume against specific job requirements → suggest changes
- Show ATS compatibility score (how well the resume would pass ATS screening)
- Provide before/after comparison

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/optimize-resume` | POST | AI-powered resume optimization for specific job |

#### i18n Keys (~20 per language)

---

### Feature #26: Calendar Sync (Google/Outlook)

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: CalendarSync
model CalendarSync {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  provider        String   // "GOOGLE", "OUTLOOK"
  accessToken     String?  // Encrypted
  refreshToken    String?  // Encrypted
  calendarId      String?  // Primary calendar ID
  syncEnabled     Boolean  @default(true)
  syncInterviews  Boolean  @default(true)
  syncEvents      Boolean  @default(true)
  lastSyncedAt    DateTime?
  createdAt       DateTime @default(now())
}
```

#### Implementation

- OAuth flow for Google Calendar / Microsoft Graph
- Two-way sync: interviews created in TalentFlow → appear in Google/Outlook calendar
- One-way sync: show external calendar availability for self-scheduling

#### i18n Keys (~20 per language)

---

### Feature #27: Document Management

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: Document
model Document {
  id          String   @id @default(cuid())
  companyId   String?
  company     Company? @relation(fields: [companyId], references: [id])
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  name        String
  type        String   // "OFFER_LETTER", "CONTRACT", "NDA", "POLICY", "RESUME", "OTHER"
  fileUrl     String
  fileSize    Int?
  mimeType    String?
  version     Int      @default(1)
  isTemplate  Boolean  @default(false)
  tags        String?  // JSON: array of tag strings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Implementation

- File upload to `public/uploads/documents/`
- Version history for documents
- Template documents that can be cloned
- Access control per document

#### i18n Keys (~20 per language)

---

### Feature #28: Duplicate Candidate Detection

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: DuplicateCandidate
model DuplicateCandidate {
  id             String   @id @default(cuid())
  candidateId1   String
  candidateId2   String
  matchType      String   // "EMAIL", "NAME_PHONE", "NAME_COMPANY", "AI_FUZZY"
  matchScore     Float    // 0-1 confidence
  isResolved     Boolean  @default(false)
  resolution     String?  // "MERGED", "NOT_DUPLICATE", "PENDING"
  resolvedById   String?
  resolvedAt     DateTime?
  createdAt      DateTime @default(now())
}
```

#### Implementation

- On new application: check for existing candidates with same email, similar name+phone, or similar name+company
- Use z-ai-web-dev-sdk for fuzzy matching on name variations
- Show merge dialog when duplicates detected
- Merge: combine profiles, consolidate applications

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/duplicates/check` | POST | Check for duplicates |
| `/api/duplicates` | GET | List unresolved duplicates |
| `/api/duplicates/[id]/resolve` | POST | Resolve (merge or dismiss) |

#### i18n Keys (~20 per language)

---

### Feature #29: Webhooks & API for Integrations

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Prisma Schema Changes

```prisma
// NEW MODEL: WebhookConfig
model WebhookConfig {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  url         String
  secret      String   // For signature verification
  events      String   // JSON: ["application.created", "interview.scheduled", ...]
  isActive    Boolean  @default(true)
  lastTriggeredAt DateTime?
  failureCount Int     @default(0)
  createdAt   DateTime @default(now())
}

// NEW MODEL: WebhookDelivery
model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  event       String
  payload     String   // JSON
  statusCode  Int?
  response    String?
  success     Boolean
  attemptCount Int    @default(1)
  createdAt   DateTime @default(now())
}
```

#### Implementation

- Register webhook URLs with event subscriptions
- When event fires → POST to URL with signed payload (HMAC)
- Retry on failure (up to 3 attempts with exponential backoff)
- Delivery log for debugging

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks` | GET/POST | List/create webhooks |
| `/api/webhooks/[id]` | GET/PATCH/DELETE | CRUD |
| `/api/webhooks/[id]/deliveries` | GET | Delivery history |
| `/api/webhooks/[id]/test` | POST | Send test payload |

#### i18n Keys (~20 per language)

---

### Feature #30: Bulk Actions on Candidates

**Priority:** 🟡 MEDIUM
**Status:** ❌ None

#### Implementation

No new Prisma models needed — this is a UI/API feature.

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bulk-actions` | POST | Execute bulk action |
| | | Body: `{ action: "REJECT"|"MOVE_STAGE"|"SEND_EMAIL"|"ADD_TAG"|"EXPORT", candidateIds: [...], config: {...} }` |

#### Frontend Components

- **BulkActionToolbar**: Appears when candidates are selected in table
- Shows count of selected, dropdown of available actions
- Confirmation dialog before execution
- Progress indicator for long-running actions

#### i18n Keys (~15 per language)

---

<a id="shared-infrastructure"></a>
## Shared Infrastructure Tasks

These cross-cutting tasks support all 30 features:

### A. Email Service (`src/lib/email-service.ts`)
- Unified email sending abstraction
- Template rendering with variable substitution
- Support for: Resend API, console logging (dev), SMTP
- Queue for bulk sending
- **Used by:** Features #2, #5, #7, #8, #9, #14, #18

### B. Workflow Engine (`src/lib/workflow-engine.ts`)
- Event listener system for workflow triggers
- Step executor with retry logic
- Integration points: email, stage changes, AI, notifications
- **Used by:** Features #2, #14, #17, #23, #24

### C. Notification Service Enhancement
- Extend existing WebSocket service with typed events
- Add push notification support
- Add email notification fallback
- **Used by:** Features #7, #12, #15, #18, #23, #24

### D. AI Service Standardization
- Standardize on `ai-service.ts` pattern (provider management + usage logging)
- Keep z-ai-web-dev-sdk as fallback when no user provider configured
- **Used by:** Features #1, #3, #6, #9, #21, #25, #28

### E. File Upload Service
- Unified file upload with validation, virus scanning placeholder
- Support for: resumes, documents, signatures, avatars
- Storage: local filesystem (dev), S3-compatible (prod)
- **Used by:** Features #5, #12, #14, #22, #27

### F. Zod Request Validation
- Add schema validation to all API routes
- Replace manual `if (!field)` checks with Zod schemas
- **Used by:** All features

---

<a id="prisma-schema-changes"></a>
## Prisma Schema Changes Summary

### New Models (24)
| # | Model | Feature |
|---|-------|---------|
| 1 | BiasAudit | #1 |
| 2 | FairHiringConfig | #1 |
| 3 | HiringWorkflow | #2 |
| 4 | WorkflowExecution | #2 |
| 5 | SkillsTaxonomy | #3 |
| 6 | SkillAssessment | #3 |
| 7 | SkillAssessmentResult | #3 |
| 8 | CandidateSkill | #3 |
| 9 | JobBoard | #4 |
| 10 | JobBoardPosting | #4 |
| 11 | EmailLog | #5 |
| 12 | SourcingCampaign | #6 |
| 13 | CandidateEngagement | #6 |
| 14 | InterviewScheduleSlot | #7 |
| 15 | InterviewerAvailability | #7 |
| 16 | QuickApplyConfig | #8 |
| 17 | TextApplySession | #8 |
| 18 | ChatbotConfig | #9 |
| 19 | ScorecardTemplate | #11 |
| 20 | InternalJobPosting | #13 |
| 21 | InternalApplication | #13 |
| 22 | Comment | #15 |
| 23 | CommentReaction | #15 |
| 24 | ApplicationSource | #16 |
| 25 | JobWorkflowConfig | #17 |
| 26 | IntegrationConfig | #18 |
| 27 | ExperienceSurvey | #19 |
| 28 | SurveyResponse | #19 |
| 29 | BackgroundCheck | #20 |
| 30 | SalaryBenchmark | #21 |
| 31 | WorkAuthorization | #22 |
| 32 | OfferApproval | #23 |
| 33 | Requisition | #24 |
| 34 | RequisitionApproval | #24 |
| 35 | CalendarSync | #26 |
| 36 | Document | #27 |
| 37 | DuplicateCandidate | #28 |
| 38 | WebhookConfig | #29 |
| 39 | WebhookDelivery | #29 |

### New Enums (4)
| Enum | Values |
|------|--------|
| WorkflowTrigger | 8 values |
| WorkflowActionType | 11 values |
| WorkflowStatus | 4 values |
| RequisitionStatus | 6 values |

### Modified Existing Models (8)
| Model | Changes |
|-------|---------|
| Company | Add relations: biasAudits, fairHiringConfig, sourcingCampaigns, etc. + stripeCustomerId |
| User | Add relations: interviewScheduleSlots, interviewerAvailability, comments |
| CandidateProfile | Add relation: candidateSkills, workAuthorization |
| Application | Add fields: sourceId, UTM params, referralLinkId + relation: backgroundChecks |
| Offer | Add fields: signingToken, signingStatus, candidateSignedAt, candidateSignature, etc. |
| Subscription | Add fields: stripeCustomerId, stripeSubscriptionId, stripePriceId, currentPeriod* |
| Invoice | Add fields: stripeInvoiceId, hostedInvoiceUrl, invoicePdf |
| Plan | Add field: stripePriceId |

---

<a id="new-api-routes"></a>
## New API Routes Summary

| Phase | Feature | New Routes | Count |
|-------|---------|-----------|-------|
| 1 | #1 Bias Detection | 4 | 4 |
| 1 | #2 Agentic Workflows | 5 | 5 |
| 1 | #3 Skills Engine | 8 | 8 |
| 1 | #4 Job Board Multi-Post | 5 | 5 |
| 1 | #5 Email Delivery | 3 | 3 |
| 2 | #6 Talent Rediscovery | 5 | 5 |
| 2 | #7 Self-Scheduling | 4 | 4 |
| 2 | #8 Mobile Apply | 4 | 4 |
| 2 | #9 In-App Chatbot | 3 | 3 |
| 2 | #10 Stripe Payments | 5 | 5 |
| 3 | #11 Scorecards | 3 | 3 |
| 3 | #12 E-Signatures | 4 | 4 |
| 3 | #13 Internal Mobility | 3 | 3 |
| 3 | #14 Onboarding Automation | 2 | 2 |
| 3 | #15 Collaboration | 4 | 4 |
| 3 | #16 Source Tracking | 3 | 3 |
| 3 | #17 Custom Workflows | 0 (extend existing) | 0 |
| 3 | #18 Slack/Teams | 2 | 2 |
| 4 | #19 NPS Surveys | 4 | 4 |
| 4 | #20 Background Checks | 2 | 2 |
| 4 | #21 Salary Benchmarking | 0 (extend AI) | 0 |
| 4 | #22 Work Authorization | 0 (extend profile) | 0 |
| 4 | #23 Offer Approval | 0 (extend offer) | 0 |
| 4 | #24 Requisitions | 0 (CRUD on model) | 2 |
| 5 | #25 Resume Optimization | 1 | 1 |
| 5 | #26 Calendar Sync | 3 | 3 |
| 5 | #27 Document Management | 3 | 3 |
| 5 | #28 Duplicate Detection | 3 | 3 |
| 5 | #29 Webhooks | 4 | 4 |
| 5 | #30 Bulk Actions | 1 | 1 |
| | | **TOTAL** | **~87** |

---

<a id="new-page-routes"></a>
## New Page Routes Summary

| Phase | Feature | Route | Portal |
|-------|---------|-------|--------|
| 1 | #1 | `/company/fair-hiring` | Company |
| 1 | #1 | `/admin/ai-compliance` | Admin |
| 1 | #3 | `/company/skill-assessments` | Company |
| 1 | #3 | `/company/skills-dashboard` | Company |
| 1 | #3 | `/candidate/take-assessment/[id]` | Candidate |
| 1 | #4 | `/company/job-boards` | Company |
| 2 | #6 | `/company/sourcing` | Company |
| 2 | #7 | `/schedule/[token]` | Public |
| 2 | #8 | `/apply/[jobSlug]` | Public |
| 2 | #8 | `/apply/quick/[token]` | Public |
| 4 | #19 | `/company/experience-surveys` | Company |
| 4 | #19 | `/survey/[token]` | Public |
| 4 | #24 | `/company/requisitions` | Company |
| | | **TOTAL** | **~13 new** |

**Rewrite/extend existing pages:** ~8 (workflows, skills, onboarding, interviews, billing, salary, talent-pool, jobs/create)

---

<a id="i18n-keys-estimate"></a>
## i18n Keys Estimate

| Phase | Features | New EN Keys | New AR Keys |
|-------|----------|-------------|-------------|
| 1 | #1-5 | ~280 | ~280 |
| 2 | #6-10 | ~220 | ~220 |
| 3 | #11-18 | ~210 | ~210 |
| 4 | #19-24 | ~160 | ~160 |
| 5 | #25-30 | ~120 | ~120 |
| | **TOTAL** | **~990** | **~990** |

---

<a id="risk--mitigation"></a>
## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **SQLite performance with 39+ models** | Medium — large schema, many joins | Add proper indexes, consider pagination on all list queries, monitor query performance |
| **i18n file size** | Low — 3,157 lines + 990 new = ~4,150 lines | Split into per-feature JSON files if needed |
| **Feature creep** | High — 30 features is a lot | Strict phased delivery, each phase must be complete before next |
| **AI API costs** | Medium — more AI features = more API calls | Cache AI results, use cheaper models for simple tasks, rate limit |
| **Real integrations** | High — Stripe, Google, Slack need real API keys | Implement simulated versions first, add real API calls behind feature flags |
| **Client bundle size** | Medium — many new pages/components | Use dynamic imports, code splitting, lazy loading |
| **Prisma migration complexity** | High — 24 new models, 8 modified | Add models incrementally per phase, run `db:push` after each phase |

---

## Execution Strategy

### Per-Feature Checklist (repeat for each feature)

1. **Prisma Schema** → Add model(s) → `bun run db:push`
2. **API Routes** → Create backend endpoints → Test with curl
3. **i18n Keys** → Add to en.json + ar.json
4. **Frontend Page** → Create/extend content.tsx + page.tsx
5. **Wire to Navigation** → Add to sidebar nav items
6. **Test** → Lint + dev server + agent-browser QA
7. **Worklog** → Update /home/z/my-project/worklog.md

### Parallelization Strategy

**Phase 1:** Features #1, #3, #4, #5 can be developed in parallel (independent). Feature #2 depends on #5 (email) and partially on #3 (AI screening step).

**Phase 2:** Features #6, #7, #8 can be parallel. #9 depends on existing chatbot. #10 is standalone.

**Phase 3:** ALL 8 features (#11-18) can be developed in parallel — they're fully independent.

**Phase 4:** Features #19, #20, #21, #22 can be parallel. #23 depends on Offer model. #24 is standalone.

**Phase 5:** ALL 6 features (#25-30) can be developed in parallel — they're fully independent.

### Maximum Parallelism

With subagents, we can run **4-6 features simultaneously** per phase. This reduces total wall-clock time from 38-48 days to approximately **15-20 days** with parallel execution.
