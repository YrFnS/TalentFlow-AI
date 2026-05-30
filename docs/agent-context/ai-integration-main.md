# Task: AI Integration for Candidate Tools

## Summary
Implemented real AI integration for TalentFlow AI's candidate tools and company job creation using the existing OpenRouter API infrastructure.

## Files Created

### API Routes (5 new routes)
1. `/src/app/api/ai/analyze-resume/route.ts` - Resume analysis with ATS scoring, strengths/weaknesses, skill matching
2. `/src/app/api/ai/generate-cover-letter/route.ts` - Cover letter generation based on job description and candidate profile
3. `/src/app/api/ai/skill-gap-analysis/route.ts` - Skill gap analysis with learning resources and market demand
4. `/src/app/api/ai/interview-prep/route.ts` - Interview preparation with questions, tips, and practice exercises
5. `/src/app/api/ai/job-description/route.ts` - Job description generation with requirements, responsibilities, benefits

### API Route Architecture
- Each route uses the existing `aiChat()` function from `@/lib/ai-service.ts`
- Routes check for the user's default AI provider and model via `getUserDefaultProvider()`
- If no provider is configured, returns 400 error with message "No active AI provider configured"
- All routes log usage to `AIUsageLog` via the existing `logAIUsage()` function
- Routes use structured JSON system prompts requesting specific output formats
- Fallback: if AI response can't be parsed as JSON, returns `rawText` field with the raw content

## Files Modified

### `/src/app/(candidate)/candidate/ai-tools/page.tsx`
- Replaced all simulated AI results with real API calls
- Added `useAuth()` to get user ID for API requests
- Each tool now has proper form inputs and makes real fetch calls
- Added loading states with spinners
- Added error handling with red error banners
- If error mentions "No active AI provider", shows "Configure AI" link to `/candidate/ai-settings`
- Added `AnalysisResultView` component that renders structured JSON results (scores, strengths, weaknesses, skills, etc.)
- Cover letters render with `ReactMarkdown` for rich formatting
- Removed all hardcoded simulated result strings
- Copy button works for both raw text and structured results

### `/src/app/(company)/company/jobs/create/page.tsx`
- Replaced simulated `handleAiGenerate` with real API call to `/api/ai/job-description`
- Added `useAuth()` for user ID
- Added `aiError` state for error display
- AI Generate button now shows error inline if provider not configured
- Error message includes "Configure AI" link to `/company/ai-settings` when applicable
- Generated job description fills in description, requirements, responsibilities, benefits, skills, and experience fields
- Removed unused `userId` state (now uses `user?.id` from auth store)

## Key Design Decisions
- System prompts request JSON output with specific field structures
- JSON responses are parsed and rendered with rich UI (badges, progress bars, lists)
- When JSON parsing fails, raw text is rendered with markdown via ReactMarkdown
- All API routes use `aiChat()` which handles provider lookup, API calling, and usage logging
- Error responses are 400 for provider issues, 500 for API failures
