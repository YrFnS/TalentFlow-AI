# Task 14 - Security Fix Agent: Zod Input Validation

## Summary
Added Zod schema validation to 10 critical API routes, replacing manual validation checks with structured schema validation.

## New File Created
- `/src/lib/validation/schemas.ts` - Shared Zod schemas and `validateInput` helper

## Schemas Defined
- `emailSchema`, `passwordSchema`, `nameSchema`, `phoneSchema`, `urlSchema`, `idSchema` (reusable primitives)
- `registerSchema`, `loginSchema` (auth)
- `createJobSchema` (jobs)
- `applySchema` (applications)
- `chatbotMessageSchema` (chatbot)
- `quickApplySchema` (quick apply with honeypot)
- `aiChatSchema` (AI chat)
- `paginationSchema` (pagination)
- `gdprExportSchema`, `gdprDeleteSchema` (GDPR)
- `stripeWebhookSchema` (Stripe webhooks)
- `validateInput<T>()` helper function

## Routes Updated (10 files)

1. **`/api/auth/register/route.ts`** - `registerSchema` replaces manual required fields + email regex checks. Kept `sanitizeName`, `sanitizeEmail`, `validatePasswordStrength` as additional security layers.
2. **`/api/chatbot/route.ts`** - `chatbotMessageSchema` replaces manual message/sessionId type/length checks.
3. **`/api/chatbot/candidate/route.ts`** - `chatbotMessageSchema` replaces manual message validation.
4. **`/api/chatbot/company/route.ts`** - `chatbotMessageSchema` replaces manual message validation.
5. **`/api/ai/chat/route.ts`** - `aiChatSchema` replaces manual messages/feature check.
6. **`/api/applications/apply/route.ts`** - `applySchema` replaces manual candidateId/jobId check.
7. **`/api/gdpr/export/route.ts`** - `gdprExportSchema` validates userId with `{ userId, ...body }`.
8. **`/api/gdpr/delete/route.ts`** - `gdprDeleteSchema` replaces manual requestId/confirmed checks.
9. **`/api/stripe/webhook/route.ts`** - `stripeWebhookSchema` replaces manual `!type` check.
10. **`/api/jobs/[id]/quick-apply/route.ts`** - `quickApplySchema` validates text fields from form data, replaces manual `!name || !email` check.

## QA Results
- Lint: **Clean** with zero errors ✅
- Dev server: Running normally, no compilation errors ✅
