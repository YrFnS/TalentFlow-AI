# Feature #5: Actual Email Delivery (SMTP)

## Task ID: feature-5-email-delivery
## Agent: Email Delivery Builder

## Summary

Wired the existing email service library into auth and application flows, created new email API routes for sending and logging, built a full email logs frontend page with stats, table, preview dialog, and send email dialog, and added i18n support in both EN and AR.

## Completed Work

### 1. Wired Email Service into Auth Flows

**`src/app/api/auth/register/route.ts`**
- Added import for `sendEmail, BUILTIN_EMAIL_TEMPLATES` from `@/lib/email-service`
- After creating user and verification token, sends verification email using `BUILTIN_EMAIL_TEMPLATES.emailVerification`
- Wrapped in try/catch so registration doesn't fail if email sending fails

**`src/app/api/auth/forgot-password/route.ts`**
- Added import for `sendEmail, BUILTIN_EMAIL_TEMPLATES` from `@/lib/email-service`
- After generating reset token, sends password reset email using `BUILTIN_EMAIL_TEMPLATES.passwordReset`
- Wrapped in try/catch to prevent email enumeration

### 2. Wired Email into Application Flow

**`src/app/api/applications/apply/route.ts`**
- Added import for `sendEmail, BUILTIN_EMAIL_TEMPLATES` from `@/lib/email-service`
- After creating application, looks up candidate profile and sends `BUILTIN_EMAIL_TEMPLATES.applicationReceived` confirmation email
- Includes candidate name, job title, and company name
- Wrapped in try/catch so application doesn't fail if email fails

### 3. New Email API Routes

**`/api/emails/send/route.ts`** (POST)
- Auth: `requireCompanyMember`
- Accepts: `{ to, subject, body, templateId?, variables? }`
- If `templateId` provided: uses `sendTemplatedEmail` from email-service
- Otherwise: uses `sendEmail` directly
- Returns: `{ success, logId }`

**`/api/emails/logs/route.ts`** (GET)
- Auth: `requireCompanyMember`
- Query params: `companyId`, `status`, `page`, `limit`, `recipient`
- Returns: paginated list of EmailLog entries with `{ logs, pagination }`

**`/api/emails/[id]/route.ts`** (GET)
- Auth: `requireAuth`
- Returns: single email log with full body for preview

### 4. Frontend: Email Logs Page

**`src/app/(company)/company/email-logs/page.tsx`**
- Thin wrapper using `next/dynamic` with `ssr: false`

**`src/app/(company)/company/email-logs/content.tsx`**
- `'use client'` directive
- **Stats Row** (4 cards with `.card-hover-lift`): Total Sent, Delivered, Failed, Bounced
- **Email Logs Table**: To (with avatar), Subject, Status badge, Template, Sent At, Actions
  - Status badges: SENT (emerald), FAILED (red), BOUNCED (amber), PENDING (gray)
  - Filter by status (All/Sent/Failed/Bounced/Pending)
  - Search by recipient
  - Click row → email preview dialog
  - Pagination controls
- **Email Preview Dialog**:
  - Shows From, To, Subject, Status, Template, Sent At, Provider, Error
  - Renders HTML body in a sandboxed iframe
  - Resend button for non-pending emails
- **Send Email Dialog**:
  - To field, Subject field, Body (HTML textarea)
  - Template selector dropdown (fetches from /api/email-templates)
  - Variable substitution fields when template selected
  - Send button with loading state
  - Cancel button
- Uses `useI18n()` for ALL text
- Uses shadcn/ui components (Card, Badge, Input, Textarea, Dialog, Select, Tooltip, Button)
- Uses teal/emerald accent colors
- Uses `toast` from `sonner` for notifications
- No framer-motion — CSS animations only

### 5. i18n Keys Added

Added `emailLogs` section to both EN and AR translations with ~35 keys each:
- title, subtitle, totalSent, delivered, failed, bounced, sendEmail, recipient, subject, status, template, sentAt, preview, noLogs, selectTemplate, variables, sendSuccess, sendFailed, body, from, to, pending, sent, resend, filterAll, searchRecipient, emailPreview, sendNewEmail, close, sending, templateName, noTemplate, provider, error, date, actions

Added `emailLogs` key to `nav` section in both EN ('Email Logs') and AR ('سجل البريد الإلكتروني')

### 6. Navigation

- Added "Email Logs" nav item to company sidebar at `src/app/(company)/layout.tsx`
  - Icon: `MailCheck` from lucide-react
  - Path: `/company/email-logs`
  - Added to `navItems` array and `breadcrumbMap`

## Files Modified

- `src/app/api/auth/register/route.ts` — Added email verification sending
- `src/app/api/auth/forgot-password/route.ts` — Added password reset email sending
- `src/app/api/applications/apply/route.ts` — Added application confirmation email
- `src/app/(company)/layout.tsx` — Added MailCheck icon import, emailLogs nav item, breadcrumb
- `src/lib/translations.ts` — Added emailLogs section to EN and AR, emailLogs nav key

## Files Created

- `src/app/api/emails/send/route.ts`
- `src/app/api/emails/logs/route.ts`
- `src/app/api/emails/[id]/route.ts`
- `src/app/(company)/company/email-logs/page.tsx`
- `src/app/(company)/company/email-logs/content.tsx`

## QA Results

- Lint: Clean with zero errors ✅
- Email Logs page returns HTTP 200 ✅
- API routes return 401 (auth required) when unauthenticated ✅
- All i18n keys properly structured in both EN and AR ✅
- No framer-motion used — CSS animations only ✅
- No recharts used ✅
- Uses existing email-service.ts functions (sendEmail, sendTemplatedEmail, BUILTIN_EMAIL_TEMPLATES) ✅
