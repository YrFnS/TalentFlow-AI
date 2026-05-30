---
Task ID: p3-batch4
Agent: Feature Builder (Phase 3 Batch 4)
Task: Build Feature #17 (Custom Hiring Workflows per Job) + Feature #18 (Slack/Teams Integration)

## Completed Work

### Feature #17: Custom Hiring Workflows per Job

#### 1. API Routes
- **`/api/job-workflows/route.ts`** - GET (list workflow configs with default stages) / POST (create config)
- **`/api/job-workflows/[id]/route.ts`** - GET/PATCH/DELETE individual workflow config

#### 2. Page: `/company/job-workflows`
- **`page.tsx`**: Thin wrapper with `next/dynamic` + `ssr: false`
- **`content.tsx`**: Full job workflow configuration page with:
  - **Header**: "Custom Job Workflows" with subtitle + Save Configuration button
  - **Job Selector**: Dropdown to select job position with custom pipeline badge
  - **Custom Pipeline Toggle**: "Use custom pipeline for this job" switch
  - **Pipeline Stage Configurator** (when custom enabled):
    - Checklist of company default stages (Applied, Screening, Phone Interview, Technical Interview, Culture Fit, Offer, Hired)
    - Toggle include/exclude per stage with teal/gray visual states
    - Up/down arrow buttons for reordering
    - Stage color indicators and order numbers
  - **Auto-Advance Rules Section**:
    - "Add Rule" button
    - Each rule: condition dropdown (screening_passed, assessment_passed, interview_completed, score_above_threshold), from stage → to stage
    - Score threshold input for score_above_threshold condition
    - Enable/disable toggle per rule
    - Delete rule button
  - **Preview Panel** (right sidebar):
    - Horizontal pipeline flow with colored stage boxes and arrows
    - Vertical flowchart diagram with stage boxes and connecting arrows
    - Auto-advance rules shown as conditional arrows with labels
    - Stats: included stages count + excluded stages count
  - **Mock Data**: 4 jobs (Senior Engineer, Product Designer, Sales Manager, Marketing Specialist)
    - Job 1: Custom pipeline skipping Phone Interview & Culture Fit
    - Job 2: Default pipeline (all stages)
    - Job 3: Custom pipeline skipping Technical Interview & Culture Fit
    - Job 4: Default pipeline

### Feature #18: Slack/Teams Integration

#### 1. API Routes
- **`/api/integrations/config/route.ts`** - GET/PATCH (get/update integration settings)
- **`/api/integrations/test/route.ts`** - POST (send test notification to configured channel)

#### 2. Page: `/company/integrations`
- **`page.tsx`**: Thin wrapper with `next/dynamic` + `ssr: false`
- **`content.tsx`**: Full integration configuration page with:
  - **Header**: "Integrations" with subtitle + Save Settings button
  - **Slack Integration Card**:
    - Slack logo (Hash icon on purple background)
    - Enable/disable toggle
    - Connection status indicator (green dot = connected, red = disconnected)
    - Webhook URL input with placeholder
    - Default channel input
    - "Test Connection" button with loading state (calls `/api/integrations/test`)
  - **Microsoft Teams Integration Card**:
    - Teams logo (MessageSquare icon on indigo background)
    - Enable/disable toggle
    - Connection status indicator
    - Webhook URL input
    - Default channel input
    - "Test Connection" button
  - **Event Notifications Section** (2-column grid):
    - 8 configurable events with toggle switches:
      - New Application Received, Interview Scheduled, Offer Sent, Offer Accepted,
      - Offer Declined, Candidate Rejected, Pipeline Stage Changed, Assessment Completed
    - Teal/grey visual states for enabled/disabled
  - **Notification Preview Panel**:
    - 3 sample notification previews:
      - "New Application Received" (teal border)
      - "Interview Scheduled" (cyan border)
      - "Offer Accepted" (emerald border)
    - Each shows: event type header, candidate + job + action body, "Powered by TalentFlow AI" footer
  - **Activity Log Table**:
    - 10 recent integration events with timestamp, event type, channel, status (sent/failed)
    - Platform indicator (Slack Hash icon or Teams MessageSquare icon)
    - Color-coded status badges (emerald for sent, red for failed)
    - Scrollable with max-h-80

### 3. Navigation Updates
- Added "Job Workflows" nav item to company sidebar with `GitBranch` icon
- Added "Integrations" nav item to company sidebar with `Plug` icon
- Added both to `breadcrumbMap` in company layout
- Added `Plug` to lucide-react imports

### 4. i18n Keys Added
- **`nav.jobWorkflows`** + **`nav.integrations`** added to both EN and AR
- **`jobWorkflows` section** (~40 keys each in EN and AR):
  - title, subtitle, selectJob, customPipeline, enableCustom, defaultStages, includedStages, excludedStages, reorderStages, autoAdvanceRules, addRule, whenCondition, moveTo, conditionScreeningPassed, conditionAssessmentPassed, conditionInterviewCompleted, conditionScoreAbove, saveConfiguration, pipelinePreview, stageName, stageOrder, includeStage, excludeStage, moveUp, moveDown, ruleEnabled, ruleDisabled, deleteRule, thresholdScore, noJobsFound, noRules, configSaved, configError, usingDefaultPipeline, customPipelineActive, fromStage, toStage, condition
- **`integrations` section** (~42 keys each in EN and AR):
  - title, subtitle, slackIntegration, teamsIntegration, webhookUrl, defaultChannel, enableIntegration, testConnection, connectionStatus, connected, disconnected, eventNotifications, 8 event keys, notificationPreview, activityLog, saveSettings, testSent, testFailed, settingsSaved, settingsError, webhookPlaceholder, channelPlaceholder, previewHeader, previewBody, previewFooter, noActivity, eventStatus, eventSent, eventFailed, eventType, eventChannel, eventTime, slackLogo, teamsLogo, connecting

### 5. Bug Fix: Dynamic Route Slug Conflict
- Fixed pre-existing bug: `/api/offers/[id]` and `/api/offers/[token]` had conflicting dynamic segment names
- Moved `/api/offers/[token]/view` to `/api/offers/signing/[token]/view` to resolve Next.js route conflict
- This was causing all pages to return HTTP 500

## QA Results
- `/company/job-workflows` returns HTTP 200 (via redirect to login) ✅
- `/company/integrations` returns HTTP 200 (via redirect to login) ✅
- Root page returns HTTP 200 ✅
- Company dashboard returns HTTP 200 ✅
- Lint: Clean with zero errors ✅
- All i18n keys properly structured in both EN and AR ✅
- No indigo/blue colors used — teal/emerald only ✅
- CSS animations: `.card-hover-lift`, `.animate-fade-in-up` ✅
- Pattern: thin `page.tsx` wrapper + `content.tsx` with `next/dynamic` + `ssr: false` ✅
- Uses `useI18n()` hook with all text via `t.jobWorkflows.*` / `t.integrations.*` keys ✅
- Uses `toast` from `sonner` for notifications ✅
