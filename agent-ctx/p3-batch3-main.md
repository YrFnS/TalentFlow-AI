# Task p3-batch3 - Comments/Mentions + Source Tracking

## Work Summary

Built Feature #15 (Real-Time Collaboration - Comments/Mentions) and Feature #16 (Source Tracking & Attribution) for TalentFlow AI.

## Files Created

### API Routes (Feature #15 - Comments)
- `src/app/api/comments/route.ts` - GET (list by entityType+entityId) / POST (create comment with mentions)
- `src/app/api/comments/[id]/route.ts` - PATCH (update/pin/resolve) / DELETE (cascade delete with reactions)
- `src/app/api/comments/[id]/reactions/route.ts` - POST (add/toggle reaction emoji)
- `src/app/api/mentions/route.ts` - GET (fetch current user's mentions from comments)

### API Routes (Feature #16 - Sources)
- `src/app/api/sources/route.ts` - GET (list by companyId) / POST (create source with default toggle)
- `src/app/api/sources/analytics/route.ts` - GET (per-source analytics: applications, hired, conversion rate, avg time-to-hire, cost per hire)
- `src/app/api/applications/by-source/route.ts` - GET (applications grouped by source with UTM data)

### Pages (Feature #15)
- `src/app/(company)/company/comments/page.tsx` - Thin wrapper with next/dynamic + ssr: false
- `src/app/(company)/company/comments/content.tsx` - Full comments management page

### Pages (Feature #16)
- `src/app/(company)/company/sources/page.tsx` - Thin wrapper with next/dynamic + ssr: false
- `src/app/(company)/company/sources/content.tsx` - Full source tracking & analytics page

### Shared Component
- `src/components/shared/comment-thread.tsx` - Reusable comment thread component

## Feature #15 Details (Comments/Mentions)

### CommentThread Component Features:
- Comment input with @mention support (type @ to show user dropdown, filter by name, insert @userName)
- Comment list: threaded comments with replies, avatar, author name, timestamp, content with @mentions highlighted in teal
- Reply button with inline reply input
- Reaction bar with emoji picker (5 quick reactions: 👍 ❤️ 🎉 🚀 💡)
- Pin/unpin button for important comments
- Resolve/reopen button for threads
- Edit/delete buttons for own comments
- Pinned comments section at top
- Resolved comments in collapsed section
- Sort order toggle: Newest First / Oldest First

### Comments Page Features:
- Stats row: Total Comments, Unresolved Threads, My Mentions
- Tabs: Comments | My Mentions
- Entity Type Selector: Applications, Candidates, Jobs, Interviews tabs
- Entity Selector: Dropdown to select specific entity
- Comment Thread: Shows comments for selected entity
- My Mentions Section: Lists all comments where user is @mentioned
- Mock data: 15+ comments across different entity types, some threaded, with reactions, pinned/resolved, various @mentions

## Feature #16 Details (Source Tracking)

### Sources Page Features:
- Stats row: Total Sources, Applications by Source, Best Source, Avg Time-to-Hire
- Source Configuration Section: 8 pre-seeded sources (LinkedIn, Indeed, Glassdoor, Referral, Career Page, Direct, Social Media, Agency), create/edit/delete, active/inactive toggle, default badge
- Source Analytics Dashboard: CSS-based bar chart (no recharts), analytics table with conversion rates color-coded (emerald=best, teal=good, amber=needs improvement), avg time-to-hire, cost per hire
- UTM Parameter Capture Section: Info card explaining UTM auto-capture, example URL, table of recent UTM-tagged applications
- Source Attribution Table: Filterable by source type, shows candidate, job, source, UTM params, applied date, status
- Mock data: 8 sources, 32 attribution records, analytics with conversion rates, UTM data for 14 applications

## Navigation Updates
- Added "Comments" nav item with `MessageSquare` icon to company sidebar
- Added "Sources" nav item with `BarChart3` icon to company sidebar
- Added both to breadcrumbMap in company layout

## i18n Keys Added
- `comments.*`: 38 keys per language (EN + AR)
- `sources.*`: 38 keys per language (EN + AR)
- `nav.comments` and `nav.sources` keys added to both languages

## QA Results
- `/company/comments` returns HTTP 200 ✅
- `/company/sources` returns HTTP 200 ✅
- Lint: Clean (zero errors in new/modified files) ✅
- All i18n keys properly structured in both EN and AR ✅
- No indigo/blue colors — teal/emerald only ✅
- Responsive design ✅
