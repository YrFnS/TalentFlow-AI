# Task 1-c: Candidate Comparison Tool

## Summary
Built Feature 3 of 11 for TalentFlow AI HR & ATS platform - a comprehensive Candidate Comparison Tool at `/company/candidates/compare`.

## Files Created
1. `/home/z/my-project/src/app/(company)/company/candidates/compare/page.tsx` - Thin wrapper with next/dynamic + ssr: false
2. `/home/z/my-project/src/app/(company)/company/candidates/compare/content.tsx` - Full page content (~650 lines)
3. `/home/z/my-project/src/app/api/candidates/compare/route.ts` - API route using z-ai-web-dev-sdk

## Files Modified
1. `/home/z/my-project/src/lib/translations.ts` - Added `comparison` section to both EN and AR (~42 keys each)

## Key Features
- Job selection dropdown with 3 mock jobs
- Candidate selector grid with search, max 3 selection, teal border highlight
- Side-by-side profile comparison
- Skills match visualization (matched=green, missing=red, extra=cyan)
- Custom SVG radar chart (6 dimensions)
- Experience timeline per candidate
- AI-powered comparison insights via z-ai-web-dev-sdk
- Hiring decision votes + notes
- Full i18n support (EN/AR)
- Responsive layout
- CSS animations only (no framer-motion)

## QA
- Lint: Clean on all new files
- All i18n keys properly structured
- No hardcoded strings
