---
Task ID: p2-f7
Agent: Self-Scheduling Interviews Builder
Task: Build Feature #7 — Self-Scheduling Interviews for TalentFlow AI

## Completed Work

### 1. i18n Keys Added (~45 keys in both EN and AR)

Added `selfScheduling` section to translations.ts after the `interviews` section in both English and Arabic:

**EN keys**: title, subtitle, availabilityTab, slotsTab, availabilitySettings, dayOfWeek, startTime, endTime, slotDuration, bufferBetween, timezone, saveAvailability, availabilitySaved, generateSlots, generateSlotsDesc, daysToGenerate, generating, slotsGenerated, available, booked, totalSlots, availableSlots, bookedSlots, noSlots, noSlotsDesc, candidateName, candidateEmail, bookedBy, slotTime, slotStatus, monday–sunday (7 day keys), scheduleInterview, scheduleDesc, jobTitle, interviewerName, companyName, selectDate, availableTimes, noSlotsAvailable, confirmBooking, bookingConfirmed, bookingConfirmedDesc, interviewDate, interviewTime, location, yourName, yourEmail, enterName, enterEmail, nameRequired, emailRequired, bookingSuccess, bookingError, slotAlreadyBooked, invalidToken, backToSlots, minutes

**AR keys**: Full Arabic translations for all ~45 keys

### 2. API Routes Created

**`/api/interviews/availability`** (GET/POST):
- GET: Returns availability settings for an interviewer (default interviewer-1), includes weekly time slots, slot duration, buffer, timezone
- POST: Saves/updates availability settings with validation (interviewerId required, at least 1 slot required)
- Seeded with default availability: Mon-Fri, various time windows

**`/api/interviews/slots`** (GET):
- GET: Returns generated slots for an interviewer with optional date range filtering
- Supports `generate=true` query param with `days` parameter to auto-generate slots from availability config
- Slots are sorted by start time
- Seeded with 5 mock available slots across the next 5 business days

**`/api/interviews/self-schedule`** (POST):
- POST: Candidate books a slot (slotId, candidateName, candidateEmail required)
- Validates slot exists and isn't already booked (returns 409 if booked)
- Marks slot as booked with candidate info

**`/api/interviews/self-schedule/[token]`** (GET):
- GET: Verifies scheduling token, returns slot details + all available slots for the same interviewer
- Returns 404 for invalid/expired tokens
- Candidate-facing data includes: interviewerName, jobTitle, companyName, location

### 3. Extended Interviews Page (`/company/interviews`)

**content.tsx** rewritten with Tabs component:

- **Interviews Tab** (existing content preserved):
  - Stats cards (Scheduled, In Progress, Completed, Cancelled)
  - Search & status filter
  - Interview cards grouped by date
  - Interview details sheet
  - Schedule dialog, cancel confirmation
  - AI Generate Questions dialog

- **Self-Scheduling Tab** (new):
  - **Stats Row**: 3 cards — Total Slots, Available (emerald), Booked (amber)
  - **Sub-tabs**: Availability | Time Slots
  - **Availability Settings**:
    - Slot duration selector (15/30/45/60 min)
    - Buffer between slots (0/5/10/15/30 min)
    - Timezone selector (13 major timezones)
    - Weekly schedule editor with day-of-week + time range rows
    - Add/remove availability slots
    - Save availability button with toast
  - **Generate Slots Card**: 
    - Days-to-generate input (1-30)
    - Generate button with loading state
    - Auto-generates slots from availability for next N days
  - **Time Slots View**:
    - Calendar-like view grouped by date
    - Each slot card shows: time range, duration, interviewer name
    - Available slots: teal border + badge
    - Booked slots: amber border + badge + candidate name/email
    - Copy scheduling link button on available slots
    - Empty state when no slots generated

### 4. Public Schedule Page (`/schedule/[token]`)

**`page.tsx`**: Thin wrapper with `'use client'` + `next/dynamic` + `ssr: false`

**`content.tsx`**: Full candidate self-scheduling page with:

- **Standalone layout**: No sidebar, branded header with TalentFlow AI logo
- **Header Card**: Job title, interviewer name, company name with colored badges
- **Date Selector**: Horizontal scrollable date chips showing day + date + slot count, navigation arrows
- **Time Slot Cards**: Grid of time slots for selected date, click to select (teal highlight)
- **3-Step Flow**:
  1. **Select**: Pick date + time slot
  2. **Confirm**: Enter name + email, see booking summary
  3. **Done**: Confirmation screen with all interview details (date, time, interviewer, company, location)
- **Loading state**: Spinner with centered layout
- **Error state**: Invalid/expired token message
- **Mobile-first**: Responsive grid, touch-friendly buttons
- **Footer**: Powered by TalentFlow AI
- **Teal accent**: All interactive elements use teal/emerald colors
- **CSS animations**: `.animate-fade-in-up`, `.card-hover-lift`

### 5. Technical Details

- Uses `'use client'` in both content.tsx files
- Uses `useI18n()` hook with `t.selfScheduling.*` keys — NO hardcoded English strings
- Uses `toast` from `sonner` for notifications
- Uses `cn()` from `@/lib/utils` for conditional classnames
- Teal/emerald accent colors only — no indigo/blue
- CSS animations: `.card-hover-lift`, `.animate-fade-in-up`
- Responsive design with mobile-first approach
- All API routes use proper error handling with status codes

## QA Results
- Lint: Clean (zero errors) ✅
- `/company/interviews` returns HTTP 200 ✅
- `/schedule/[token]` returns HTTP 200 ✅
- API routes return HTTP 200 ✅
- i18n keys properly structured in both EN and AR ✅
- No framer-motion — CSS animations only ✅
- No indigo/blue colors ✅

## Files Created
- `/src/app/api/interviews/availability/route.ts`
- `/src/app/api/interviews/slots/route.ts`
- `/src/app/api/interviews/self-schedule/route.ts`
- `/src/app/api/interviews/self-schedule/[token]/route.ts`
- `/src/app/schedule/[token]/page.tsx`
- `/src/app/schedule/[token]/content.tsx`

## Files Modified
- `/src/app/(company)/company/interviews/content.tsx` — Added Self-Scheduling tab with Tabs component
- `/src/lib/translations.ts` — Added selfScheduling section (~45 keys each in EN and AR)
