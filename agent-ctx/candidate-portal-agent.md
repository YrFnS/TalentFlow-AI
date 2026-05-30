# Task: Candidate/User Portal for TalentFlow AI

## Summary
Built the complete Candidate/User portal for the TalentFlow AI HR & ATS platform with 8 files created across layout, pages, and API routes.

## Files Created

### 1. Layout: `/src/app/(candidate)/layout.tsx`
- Sidebar with candidate navigation (Dashboard, Jobs, Applications, Profile, AI Tools, Settings)
- Top bar with search, notifications dropdown, user menu
- Language toggle (EN/AR) and theme toggle (light/dark)
- RTL support via `dir` attribute and i18n store
- Mobile responsive with Sheet component for sidebar
- Teal/emerald accent colors throughout

### 2. Dashboard: `/src/app/(candidate)/candidate/page.tsx`
- Welcome section with personalized greeting
- Stats cards (Applications Sent, Interviews Scheduled, Saved Jobs, Profile Views)
- Recommended jobs section with match scores and apply buttons
- Application status mini pipeline
- Quick actions (Search Jobs, Update Profile, AI Resume Analysis)
- Profile completeness card with progress indicator
- Recent activity feed

### 3. Job Search: `/src/app/(candidate)/candidate/jobs/page.tsx`
- Search bar with keyword, location, job type, experience level filters
- Job cards in 2-column grid layout
- Save/bookmark job functionality (toggle state)
- Quick apply button with state management
- Pagination controls
- Filter sidebar (collapsible on mobile via Sheet)
- 9 demo job listings with varied types

### 4. My Applications: `/src/app/(candidate)/candidate/applications/page.tsx`
- List of applications with status badges
- Expandable timeline view for each application
- Withdraw application with confirmation dialog
- Filter by status (clickable status chips)
- Status counts overview
- Color-coded status indicators

### 5. Profile & Resume: `/src/app/(candidate)/candidate/profile/page.tsx`
- Profile editing form (name, email, phone, location, bio, current title, LinkedIn, portfolio, availability)
- Experience section (add/edit/delete with dialog)
- Education section (add/edit/delete with dialog)
- Certifications section (add/edit/delete with dialog)
- Skills tag input (add/remove)
- Resume upload area with drag-and-drop styling
- AI Resume Analysis button (placeholder)
- AI Resume Improvement button (placeholder)
- Profile completeness indicator (progress bar)
- Public profile toggle

### 6. AI Tools: `/src/app/(candidate)/candidate/ai-tools/page.tsx`
- AI Resume Analysis card with dialog showing simulated analysis results
- Cover Letter Generator card with form (target role, job description)
- Skill Gap Analysis card with form (target role)
- Interview Preparation card with form (role, interview type)
- Each opens a dialog/modal with the tool
- AI provider not configured message (conditional)
- AI Settings link
- Copy-to-clipboard for results
- Loading states with spinner animation

### 7. Profile API: `/src/app/api/candidates/profile/route.ts`
- GET: Fetch candidate profile with experiences, educations, certifications, applications, saved jobs
- PUT: Update candidate profile fields
- POST: Handle sub-actions (add/update/delete experience, education, certification, save/unsave jobs)

### 8. Apply API: `/src/app/api/applications/apply/route.ts`
- POST: Submit job application with duplicate check and pipeline stage creation
- GET: List applications with job and company details, timeline, and interviews
- PATCH: Withdraw application (updates status and exits current stage)

## Database Changes
- Added `SavedJob` model to Prisma schema
- Added relations to `CandidateProfile` and `Job` models
- Ran `db:push` successfully

## Translations
- Added comprehensive `candidate` section to both English and Arabic translations
- 60+ translation keys for all candidate portal features

## Theme
- Updated globals.css with teal/emerald color scheme
- Custom CSS variables for both light and dark modes
- Custom scrollbar styling
- Added teal and emerald color variables

## All Routes Verified
- `/candidate` (Dashboard) - 200 ✓
- `/candidate/jobs` (Job Search) - 200 ✓
- `/candidate/applications` (My Applications) - 200 ✓
- `/candidate/profile` (Profile & Resume) - 200 ✓
- `/candidate/ai-tools` (AI Tools) - 200 ✓
- API routes return 400 for missing params (expected behavior) ✓

## Lint
- All files pass ESLint ✓
