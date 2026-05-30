# Task 5: Security Auth Guard Agent

## Task
Add server-side auth checks to ALL API routes in the TalentFlow AI HR/ATS application.

## Completed Work
- Created `/src/lib/auth-guard.ts` with 4 auth guard functions (requireAuth, requireAdmin, requireCompanyMember, requireCandidate)
- Added auth checks to 53 route handlers across 48 API route files
- Replaced userId/companyId from user input with values from authenticated session
- Admin routes use requireAdmin, company routes use requireCompanyMember, candidate routes use requireCandidate, AI/other routes use requireAuth
- Public routes left unchanged (stats, seed, public/jobs, public/companies, etc.)

## Key Decisions
- Used NextAuth v4 `getServerSession(authOptions)` for session validation
- AuthResult includes userId, role, companyId, companyName from JWT token
- For company routes, companyId comes from auth.companyId (session) as primary, with query param as fallback for admin access
- For candidate routes, userId comes from auth.userId (session), replacing query param usage
- For routes that previously used both userId and companyId from user input, now uses auth session values

## QA
- Lint: Clean (0 errors)
- Dev server: Running normally
