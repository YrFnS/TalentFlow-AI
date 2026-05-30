# Task 7 - Security Fix Agent

## Summary
Added authentication and security checks to 7 API routes identified as having no authentication in the security audit.

## Files Modified
1. `src/app/api/chatbot/route.ts` — Added `requireAuth()` check
2. `src/app/api/chatbot/candidate/route.ts` — Added `requireCandidate()` check
3. `src/app/api/chatbot/company/route.ts` — Added `requireCompanyMember()` check
4. `src/app/api/chatbot/config/route.ts` — Added `requireCompanyMember()` for GET, `requireAdmin()` for PATCH
5. `src/app/api/job-boards/seed/route.ts` — Added `requireAdmin()` check
6. `src/app/api/jobs/[id]/quick-apply/route.ts` — Added IP-based rate limiting (5/hr) + honeypot anti-bot field
7. `src/app/api/stripe/webhook/route.ts` — Added Stripe webhook signature verification with dev-mode fallback

## Key Design Decisions
- Used existing `auth-guard.ts` helpers throughout (requireAuth, requireCandidate, requireCompanyMember, requireAdmin)
- Quick-apply route intentionally left without session auth (public apply flow) but protected with rate limiting and honeypot
- Stripe webhook uses signature verification instead of session auth (webhooks come from Stripe, not users)
- All auth checks return proper HTTP status codes: 401 (unauthenticated), 403 (forbidden), 429 (rate limited)

## Lint: Clean ✅
## Dev Server: Running ✅
