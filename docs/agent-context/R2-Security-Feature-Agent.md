---
Task ID: R2
Agent: Security Feature Agent
Task: Implement CSRF (Cross-Site Request Forgery) protection for all state-changing API requests

## Completed Work

### 1. CSRF Token Library (`src/lib/security/csrf.ts`)
- Uses double-submit cookie pattern with SHA-256 hashing
- `generateCsrfToken()` — Generates token pair (hashed token for response body + raw cookie value for httpOnly cookie). Uses Node.js crypto (API routes only)
- `validateCsrfToken(request)` — Validates CSRF token from Request object using cookies() from next/headers. Uses Node.js crypto (API routes only)
- `csrfCheck(request)` — Middleware helper that returns 403 Response if validation fails, null if passes
- `isCsrfExemptPath(pathname)` — Checks if a path should bypass CSRF validation (public endpoints, webhooks, seed)
- Token expiry: 1 hour with timestamp embedded in cookie value
- Constants: `CSRF_COOKIE_NAME = 'csrf-token'`, `CSRF_HEADER_NAME = 'x-csrf-token'`

### 2. CSRF Edge Runtime Library (`src/lib/security/csrf-edge.ts`)
- Separate module for Edge Runtime compatibility (middleware)
- Uses Web Crypto API (`crypto.subtle.digest`) instead of Node.js crypto
- `validateCsrfTokenValues(headerToken, cookieValue)` — Async, Edge-compatible validation
- `isCsrfExemptPath(pathname)` — Same path exemption logic
- Exports `CSRF_COOKIE_NAME` and `CSRF_HEADER_NAME` constants

### 3. CSRF Token API Endpoint (`src/app/api/auth/csrf-token/route.ts`)
- GET /api/auth/csrf-token — Generates new CSRF token pair
- Returns `{ csrfToken: string }` in response body
- Sets httpOnly, sameSite=strict cookie with maxAge=1 hour
- This endpoint is exempt from CSRF validation itself

### 4. Client-Side CSRF Hook (`src/hooks/use-csrf.ts`)
- `useCsrf()` hook — Provides `csrfToken` state and `refreshToken()` function
- Eagerly initializes CSRF token on module load (avoids useEffect + setState lint violation)
- Module-level caching with 1-hour expiry (refreshes 5 min before expiry)
- Concurrent fetch prevention with ref guard
- `withCsrf(headers, token)` helper — Adds x-csrf-token header to fetch Headers

### 5. Middleware CSRF Check (`src/middleware.ts`)
- Added CSRF validation as step 3 (after CORS preflight, before rate limiting)
- Checks all POST/PUT/PATCH/DELETE requests to API routes
- Skips safe methods (GET, HEAD, OPTIONS)
- Skips exempt paths (register, csrf-token, forgot/reset password, webhooks, seed, etc.)
- Reads x-csrf-token header and csrf-token cookie from NextRequest
- Validates using Edge-compatible `validateCsrfTokenValues` from csrf-edge.ts
- Returns 403 JSON response on validation failure

### 6. CORS Headers Updated (`src/lib/security/headers.ts`)
- Added `x-csrf-token` to `Access-Control-Allow-Headers` in both `getCORSHeaders()` and `getCORSHeadersForRequest()`
- Ensures browser preflight requests approve the custom header

### 7. Security Index Updated (`src/lib/security/index.ts`)
- Added CSRF exports from both `./csrf` and `./csrf-edge` modules
- Aliased duplicate constant names to avoid conflicts (`CSRF_COOKIE_NAME_FULL`, `CSRF_HEADER_NAME_FULL`)

### 8. CSRF Applied to Key Components (4 components)

**Company Jobs Create** (`/company/jobs/create/content.tsx`):
- Added `useCsrf()` hook import and usage
- Added x-csrf-token header to POST `/api/ai/job-description` and POST `/api/jobs`

**Admin Users** (`/admin/users/content.tsx`):
- Added `useCsrf()` hook import and usage
- Added x-csrf-token header to DELETE `/api/admin/users` and PATCH `/api/admin/users` (3 fetch calls)

**Candidate Notifications** (`/candidate/notifications/content.tsx`):
- Added `useCsrf()` hook import and usage
- Added x-csrf-token header to PUT `/api/notifications` (markAllAsRead, markAsRead) and DELETE `/api/notifications`

**Company Applications** (`/company/applications/content.tsx`):
- Added `useCsrf()` hook import and usage
- Added x-csrf-token header to PATCH `/api/applications`

### 9. Exempt Paths
The following paths bypass CSRF validation (no token required):
- `/api/auth/register` — Public registration
- `/api/auth/csrf-token` — Token generation endpoint
- `/api/auth/forgot-password` — Password reset flow
- `/api/auth/reset-password` — Password reset flow
- `/api/auth/verify-email` — Email verification
- `/api/auth/resend-verification` — Resend verification
- `/api/auth/[...nextauth]` — NextAuth.js handler
- `/api/stripe/webhook` — Stripe webhook (uses signature verification)
- `/api/jobs/[id]/quick-apply` — Public apply flow
- `/api/seed` — Development seeding endpoint

## Technical Details

- **Pattern**: Double-submit cookie with SHA-256 hashing
  - Server generates: random hex token + timestamp → `cookieValue`
  - Server hashes: SHA-256(cookieValue) → `token` (sent to client)
  - Client sends: `token` in x-csrf-token header, browser sends cookieValue automatically
  - Server validates: SHA-256(cookieValue) === headerToken
- **Edge Runtime**: Middleware-compatible functions use Web Crypto API instead of Node.js crypto
- **Token caching**: Module-level cache with expiry prevents redundant API calls
- **Graceful degradation**: If CSRF token is null, headers are omitted (middleware will reject)

## QA Results
- Lint: Clean with zero errors ✅
- CSRF endpoint tested: GET /api/auth/csrf-token returns 200 with token ✅
- CSRF enforcement tested: POST /api/jobs without token returns 403 ✅
- CSRF flow tested: POST with valid token+cookie passes CSRF check (returns 401 for auth, as expected) ✅
- Exempt path tested: POST /api/seed bypasses CSRF (returns auth error, not 403) ✅

## Files Created
- `/src/lib/security/csrf.ts`
- `/src/lib/security/csrf-edge.ts`
- `/src/app/api/auth/csrf-token/route.ts`
- `/src/hooks/use-csrf.ts`

## Files Modified
- `/src/middleware.ts` — Added CSRF validation step
- `/src/lib/security/headers.ts` — Added x-csrf-token to CORS allowed headers
- `/src/lib/security/index.ts` — Added CSRF exports
- `/src/app/(company)/company/jobs/create/content.tsx` — Added CSRF token to POST requests
- `/src/app/(admin)/admin/users/content.tsx` — Added CSRF token to DELETE/PATCH requests
- `/src/app/(candidate)/candidate/notifications/content.tsx` — Added CSRF token to PUT/DELETE requests
- `/src/app/(company)/company/applications/content.tsx` — Added CSRF token to PATCH requests
