# Task 1-a: Resume File Upload & Parsing

## Task Description
Build resume file upload and AI parsing feature for the TalentFlow AI HR & ATS platform.

## Work Completed

### 1. i18n Keys Added
- Added `resume` section with 32 keys to EN translations (after `nav`, before `dashboard`)
- Added `resume` section with 32 keys to AR translations (after `nav`, before `dashboard`)
- Keys cover: title, subtitle, uploadArea, browseFiles, supportedFormats, uploading, uploadSuccess, uploadError, parseWithAI, parsing, parseSuccess, parseError, fillProfile, fillProfileDesc, extractedInfo, name, email, phone, skills, experience, education, certifications, currentResume, removeResume, noResume, lastUploaded, fileSize, parsedAt, overview, matchScore, extractedSkills, extractedExperience, extractedEducation

### 2. API Routes Created

**Upload Route** (`/api/resume/upload/route.ts`):
- POST endpoint accepting multipart form data
- File type validation: PDF, DOC, DOCX only
- File size validation: 5MB max
- Saves files to `public/uploads/resumes/` with timestamp prefix
- Returns file URL, name, size, type, uploadedAt

**Parse Route** (`/api/resume/parse/route.ts`):
- POST endpoint accepting `resumeText` in request body
- Uses `z-ai-web-dev-sdk` with `ZAI.create()` and `chat.completions.create()`
- AI extracts: name, email, phone, skills, experience, education, certifications
- Returns parsed data as JSON with fallback structure on parse errors

### 3. Candidate Profile Page Updated

**page.tsx**: Converted from monolithic 814-line file to thin wrapper pattern:
```tsx
'use client';
import dynamic from 'next/dynamic';
const ProfileContent = dynamic(() => import('./content'), { ssr: false });
export default function ProfilePage() {
  return <ProfileContent />;
}
```

**content.tsx**: Full rewrite with resume upload section added at the top:
- Drag-and-drop upload area with `border-2 border-dashed border-teal-300 dark:border-teal-700`
- File type and size validation with toast error messages
- Animated upload progress bar (simulated progress + real API call)
- "Parse with AI" button with `Zap` icon and loading spinner
- Parsed results display with:
  - Name/email/phone cards in teal-styled info boxes
  - Skills as teal badges
  - Experience as scrollable list
  - Education as compact cards
  - Certifications as outline badges
- "Fill Profile from Resume" button that auto-populates:
  - Personal info (name, email, phone)
  - Skills (merged, deduplicated)
  - Experience entries (appended)
  - Education entries (appended)
  - Certifications (appended)
- Remove resume button with trash icon
- All existing profile content preserved (personal info, skills, experience, education, certifications, dialogs)

### 4. Technical Details
- Uses `'use client'` directive in content.tsx
- Uses `useI18n()` hook with `t.resume.*` keys throughout - NO hardcoded strings
- Uses shadcn/ui components: Card, Button, Badge, Progress, Separator, ScrollArea, Dialog
- Teal/emerald accent colors only
- CSS utilities: `.card-hover-lift`, `.animate-fade-in-up`
- Uses `getInitials()` from `@/lib/utils`
- Uses `toast` from `sonner` for notifications
- Responsive design with mobile-first approach

## Files Modified/Created
- Created: `/src/app/api/resume/upload/route.ts`
- Created: `/src/app/api/resume/parse/route.ts`
- Modified: `/src/app/(candidate)/candidate/profile/content.tsx`
- Modified: `/src/app/(candidate)/candidate/profile/page.tsx`
- Modified: `/src/lib/translations.ts`
- Created: `/public/uploads/resumes/` directory

## QA Results
- Lint: Clean (no errors in new/modified files)
- Profile page returns HTTP 200
- Dev server running stable
