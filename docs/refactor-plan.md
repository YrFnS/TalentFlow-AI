# Refactor Plan — God Files (>200 lines)

**Date:** 2026-05-31
**Total files >200 lines:** 114
**Total files >500 lines:** 67
**Total files >1000 lines:** 23

---

## Tier 1: Critical (>1000 lines) — Split Immediately

| Lines | File | Strategy |
|-------|------|----------|
| 1532 | `src/app/(company)/company/workflows/content.tsx` | Extract workflow canvas, step editor, trigger config, and execution log into separate components |
| 1432 | `src/app/(company)/company/talent-pool/content.tsx` | Extract pool list, member detail panel, filter bar, and add-to-pool modal |
| 1317 | `src/app/(company)/company/jobs/create/page.tsx` | Split into job form sections: basic info, requirements, compensation, settings; extract form field components |
| 1281 | `src/app/(candidate)/candidate/profile/content.tsx` | Extract sections: experience, education, skills, portfolio into tab-specific components |
| 1254 | `src/app/(candidate)/candidate/ai-tools/content.tsx` | Split per AI tool: resume analyzer, cover letter generator, interview prep, skill gap analyzer |
| 1250 | `src/app/(company)/company/interviews/content.tsx` | Extract interview list, calendar view, detail panel, feedback form |
| 1212 | `src/components/shared/ai-settings-panel.tsx` | Split into provider config, model selector, usage stats, API key management |
| 1196 | `src/app/(company)/company/bulk-email/content.tsx` | Extract campaign builder, recipient selector, template editor, send status |
| 1138 | `src/app/(company)/company/reference-checks/content.tsx` | Extract check list, detail view, reference form, status tracker |
| 1124 | `src/app/(company)/company/sourcing/content.tsx` | Extract campaign list, candidate matcher, outreach composer |
| 1120 | `src/app/(company)/company/onboarding/content.tsx` | Split into plan builder, task list, assignee view, progress tracker |
| 1113 | `src/app/(company)/company/interviews/page.tsx` | Split into schedule view, interview detail, feedback section |
| 1082 | `src/app/page.tsx` | Extract hero section, features grid, stats bar, CTA, testimonials into components |
| 1060 | `src/app/(admin)/admin/security/content.tsx` | Extract audit log, rate limit config, IP block list, security alerts |
| 1035 | `src/app/(company)/company/job-templates/content.tsx` | Extract template card, template editor, template preview |
| 1021 | `src/app/(company)/company/billing/content.tsx` | Extract plan card, invoice list, usage chart, payment method section |
| 1001 | `src/app/(company)/company/skill-assessments/content.tsx` | Extract assessment builder, question editor, results view, candidate score display |
| 962 | `src/app/(admin)/admin/gdpr/content.tsx` | Extract request list, data export panel, deletion workflow |
| 954 | `src/app/(company)/company/fair-hiring/content.tsx` | Extract bias metrics, audit results, config panel, recommendations |
| 949 | `src/app/(company)/company/video-interviews/content.tsx` | Extract question builder, response viewer, candidate list |
| 943 | `src/app/(company)/company/candidates/compare/content.tsx` | Extract comparison table, candidate selector, radar chart |
| 923 | `src/app/(company)/company/scorecards/content.tsx` | Extract template editor, criteria builder, score display |
| 909 | `src/app/(company)/company/email-templates/content.tsx` | Extract template list, variable editor, preview pane |

## Tier 2: Large (800-999 lines) — Split Next

| Lines | File | Strategy |
|-------|------|----------|
| 895 | `src/app/(company)/company/offers/content.tsx` | Extract offer list, offer detail, approval workflow |
| 892 | `src/app/(company)/company/risk-analysis/content.tsx` | Extract risk chart, alert list, config |
| 878 | `src/app/(candidate)/candidate/jobs/[id]/content.tsx` | Extract job detail, company info, apply section |
| 869 | `src/app/(company)/company/applications/page.tsx` | Split into kanban board, list view, detail panel |
| 846 | `src/app/(candidate)/candidate/video-interview/content.tsx` | Extract question view, recording controls, review section |
| 845 | `src/app/(admin)/admin/billing/content.tsx` | Extract subscription list, plan editor, invoice table |
| 830 | `src/app/careers/[slug]/content.tsx` | Split into job detail, company info, application form |
| 822 | `src/app/(company)/company/email-logs/content.tsx` | Extract log table, detail panel, filter bar |
| 817 | `src/lib/workflow-engine.ts` | Split into trigger handler, step executor, condition evaluator, action dispatcher |
| 806 | `src/app/(company)/company/predictive-analytics/content.tsx` | Extract charts, metrics, forecast panels |
| 783 | `src/app/(company)/company/jobs/create/content.tsx` | Extract form sections into field group components |
| 776 | `src/app/(company)/company/job-boards/content.tsx` | Extract board list, posting config, analytics |
| 732 | `src/components/shared/comment-thread.tsx` | Extract comment item, reply form, reaction bar |
| 728 | `src/app/(company)/company/sources/content.tsx` | Extract source list, attribution chart |
| 727 | `src/components/ui/sidebar.tsx` | Extract sidebar sections, nav groups, footer |
| 703 | `src/app/(company)/company/internal-jobs/content.tsx` | Extract job list, application flow |
| 700 | `src/app/(company)/company/calendar/content.tsx` | Extract calendar grid, event detail, schedule form |

## Tier 3: Medium (500-799 lines) — Refactor Incrementally

| Lines | File |
|-------|------|
| 685 | `src/app/auth/register/page.tsx`, `src/app/(company)/company/page.tsx` |
| 679 | `src/app/(company)/company/applications/content.tsx` |
| 674 | `src/app/apply/[jobSlug]/content.tsx` |
| 663 | `src/app/content.tsx` |
| 656 | `src/app/(company)/company/job-workflows/content.tsx` |
| 653 | `src/app/(candidate)/candidate/page.tsx` |
| 647 | `src/app/(company)/company/jobs/content.tsx` |
| 635 | `src/app/(company)/company/comments/content.tsx` |
| 634 | `src/app/(company)/company/career-page/content.tsx` |
| 596 | `src/app/(company)/company/pipeline/content.tsx` |
| 589 | `src/app/auth/register/content.tsx` |
| 581 | `src/app/(candidate)/candidate/assessments/content.tsx` |
| 575 | `src/app/(admin)/admin/content.tsx` |
| 567 | `src/app/(candidate)/candidate/portfolio/page.tsx` |
| 556 | `src/app/auth/login/page.tsx` |
| 549 | `src/app/(candidate)/candidate/take-assessment/[id]/content.tsx` |
| 547 | `src/app/(admin)/admin/users/page.tsx` |
| 546 | `src/app/(public)/offer/[token]/content.tsx` |
| 539 | `src/app/(company)/company/analytics/content.tsx` |
| 531 | `src/app/(company)/company/candidates/page.tsx`, `content.tsx` |
| 515 | `src/app/(company)/company/team/page.tsx`, `content.tsx` |
| 514 | `src/app/(company)/layout.tsx`, `src/app/(candidate)/candidate/applications/page.tsx` |
| 513 | `src/app/(admin)/admin/eeo/content.tsx` |
| 511 | `src/app/(company)/company/analytics/page.tsx` |
| 507 | `src/app/(admin)/admin/roadmap/page.tsx` |
| 505 | `src/app/(company)/company/integrations/content.tsx` |
| 504 | `src/app/(company)/company/jobs/page.tsx` |
| 501 | `src/app/(company)/company/goals/page.tsx` |
| 496 | `src/app/schedule/[token]/content.tsx`, `src/app/(candidate)/candidate/internal-jobs/content.tsx` |
| 489 | `src/app/(company)/company/content.tsx` |
| 475 | `src/app/(candidate)/candidate/content.tsx` |
| 470 | `src/lib/security/rate-limiter.ts` |
| 458 | `src/app/apply/quick/[token]/content.tsx` |
| 457 | `src/app/(candidate)/candidate/jobs/content.tsx` |
| 451 | `src/app/(company)/company/reviews/content.tsx` |
| 450 | `src/lib/auth.ts` |
| 441 | `src/app/(company)/company/profile/content.tsx`, `page.tsx`, `src/app/(admin)/admin/companies/page.tsx`, `content.tsx` |
| 440 | `src/app/(candidate)/candidate/network/page.tsx` |
| 438 | `src/app/(candidate)/layout.tsx` |
| 432 | `src/app/(admin)/admin/users/content.tsx` |
| 431 | `src/app/(admin)/admin/compliance/page.tsx` |
| 427 | `src/app/(candidate)/candidate/explore/content.tsx` |
| 424 | `src/app/(candidate)/candidate/learning/page.tsx` |
| 423 | `src/app/(company)/company/eeo-reports/content.tsx` |
| 418 | `src/app/(company)/company/leave/page.tsx` |
| 416 | `src/app/(admin)/layout.tsx` |
| 415 | `src/app/(company)/company/profile/page.tsx` |
| 410 | `src/app/(admin)/admin/exports/content.tsx` |
| 407 | `src/app/(candidate)/candidate/skills/content.tsx` |
| 404 | `src/components/shared/two-factor-section.tsx`, `src/app/(company)/company/referrals/page.tsx` |
| 402 | `src/app/(admin)/admin/health/content.tsx` |
| 400 | `src/app/auth/reset-password/content.tsx` |

## Tier 4: Utility/Library Files >300 lines

| Lines | File | Strategy |
|-------|------|----------|
| 817 | `src/lib/workflow-engine.ts` | Split into modules: triggers.ts, actions.ts, conditions.ts, executor.ts |
| 470 | `src/lib/security/rate-limiter.ts` | Split into strategies: fixed-window.ts, sliding-window.ts, token-bucket.ts |
| 450 | `src/lib/auth.ts` | Split into: session.ts, roles.ts, guards.ts |
| 382 | `src/app/api/admin/security-dashboard/route.ts` | Split into sub-routes |
| 318 | `src/middleware.ts` | Split into: auth-check.ts, rate-limit.ts, security-headers.ts, csrf.ts |
| 317 | `src/lib/security/index.ts` | Re-export only; already split |
| 298 | `src/lib/email-service.ts` | Split into: providers/, templates/, queue.ts |
| 273 | `src/lib/security/auth-logger.ts` | Split into: log-formatter.ts, log-writer.ts |
| 266 | `src/lib/security/error-handler.ts` | Cohesive, leave as-is for now |
| 257 | `src/components/ui/dropdown-menu.tsx` | shadcn/ui — leave unless customizing |

## Recommended Approach

1. **Start with Tier 1** — pick the top 5 worst files, one PR per file
2. **Extract shared components first** — many god files reuse similar patterns (filter bars, data tables, detail panels)
3. **Create `src/components/shared/` subdirectories** by domain: `src/components/shared/workflows/`, `src/components/shared/candidates/`, etc.
4. **Split route handlers** — large API routes should be split into separate files under subdirectories
5. **Target: no file >300 lines** after full refactor
