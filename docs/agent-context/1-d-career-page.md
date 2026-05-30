# Task 1-d: Career Page / Public Job Portal

## Summary
Built Feature 4 of 11 - Career Page / Public Job Portal for TalentFlow AI HR & ATS Platform.

## Files Created
- `/src/app/careers/[slug]/page.tsx` - Thin wrapper with `next/dynamic` + `ssr: false`
- `/src/app/careers/[slug]/content.tsx` - Full public career page (standalone, no sidebar/auth)
- `/src/app/(company)/company/career-page/page.tsx` - Thin wrapper
- `/src/app/(company)/company/career-page/content.tsx` - Career page settings with live preview
- `/src/app/api/public/jobs/route.ts` - Public jobs API (GET, no auth, OPEN jobs only)
- `/src/app/api/public/companies/[slug]/route.ts` - Public company config API (GET, no auth)

## Files Modified
- `/src/lib/translations.ts` - Added `careerPage` section with 58 keys each in EN and AR

## Key Features
1. **Public Career Page** (`/careers/[slug]`): Hero, stats, Why Join Us, job listings with filters, job detail dialog, apply flow with resume upload + EEO survey, culture section, footer
2. **Company Career Page Settings** (`/company/career-page`): Live preview, Content/Design/SEO tabs, color presets, value/benefit management, publish toggle, social links, meta settings
3. **Public API Routes**: No-auth endpoints for jobs and company config, with DB queries and mock data fallback

## QA
- All routes return HTTP 200 ✅
- Lint: Clean ✅
- i18n: 58 keys in both EN/AR ✅
- No framer-motion, no indigo/blue ✅
