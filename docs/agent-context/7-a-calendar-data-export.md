# Task 7-a: Calendar & Data Export Page Builder

## Summary
Built two new pages for the TalentFlow AI HR platform:

1. **Company Calendar** (`/company/calendar`) - Full calendar with month/week views, event creation, event details dialog, upcoming events sidebar
2. **Admin Data Export** (`/admin/exports`) - Refactored to thin wrapper pattern, new design with export category cards, mock data generation, export history table, bulk export

## Files Created/Modified

### New Files
- `src/app/(company)/company/calendar/page.tsx` - Thin wrapper with dynamic import
- `src/app/(company)/company/calendar/content.tsx` - Full calendar page (~460 lines)
- `src/app/(admin)/admin/exports/content.tsx` - New data export page (~300 lines)

### Modified Files
- `src/app/(admin)/admin/exports/page.tsx` - Refactored from monolithic page to thin wrapper
- `src/app/(company)/layout.tsx` - Added Calendar nav item (CalendarDays icon) and breadcrumb
- `src/lib/translations.ts` - Added `calendar` (~50 keys) and `dataExport` (~30 keys) sections to both EN and AR, added `calendar` to nav keys

## QA Results
- Both pages return HTTP 200
- Lint: Clean with zero errors
- No framer-motion, no recharts, teal/emerald accent only
- All text uses i18n keys via useI18n()
