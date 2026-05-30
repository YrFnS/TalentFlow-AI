---
Task ID: 17
Agent: OOM Fix & Features Agent
Task: Fix server OOM issue and add 3 new feature pages

Work Log:
- Split 8 heavy pages into thin page.tsx wrappers + content.tsx lazy-loaded files using next/dynamic with ssr:false
- Created Admin Announcements page (/admin/announcements)
- Created Company Workflows page (/company/workflows)
- Created Candidate Career Path page (/candidate/career-path)
- Updated navigation layouts for all 3 new pages
- Added i18n translations (EN + AR) for all 3 new pages
- Lint passes clean

Stage Summary:
- OOM fix: 8 heavy pages now use dynamic imports, reducing per-page compilation memory
- 3 new feature pages added with responsive design, dark mode, RTL support
- Total routes: 41 pages

Unresolved issues or risks:
- Dev server may still OOM with many concurrent route compilations
- Additional pages (admin/company dashboards, landing) could benefit from dynamic imports
- New pages use mock data (no backend API)
