---
Task ID: 4-a
Agent: AI Chatbot Builder
Task: Build AI Recruiting Chatbot feature - floating widget, API route, i18n

## Completed Work

### 1. AI Chatbot API Route (`/api/chatbot/route.ts`)

- POST endpoint accepting `message`, `sessionId`, `context`, `source`
- Uses `z-ai-web-dev-sdk` (`ZAI.create()` + `sdk.chat.completions.create({ model: 'openai/gpt-4o-mini', messages })`) for AI responses
- System prompt: "You are TalentFlow AI's recruiting assistant. Help candidates with job search, application status, interview tips, and platform navigation..."
- Stores conversations in the `ChatConversation` Prisma model (already existed in schema)
- Rate limited: 20 messages per session per minute (in-memory rate limiter with periodic cleanup)
- Validates: message required and non-empty, sessionId required, max 2000 chars
- Returns 429 on rate limit exceeded
- Loads previous messages from conversation history (last 20 for context window)
- Saves new messages (user + assistant) to conversation after each response
- Creates new conversation if sessionId doesn't exist
- Graceful error handling: if AI call fails, returns a friendly fallback message
- Uses local `PrismaClient` instance for reliability with hot reloading

### 2. Floating Chat Widget Component (`src/components/shared/ai-chatbot.tsx`)

- `'use client'` directive
- Floating teal button in bottom-right corner with `MessageSquare` icon (Lucide)
- Slide-up animation for chat panel using CSS transitions
- Header: "AI Assistant" title + subtitle, New Chat button (+ icon), Close button (X icon)
- Gradient header bar (from-teal-600 to-emerald-600)
- Message area with ScrollArea, showing bot (left-aligned) and user (right-aligned) messages
- Bot messages: Sparkles avatar, muted background, rounded-ss-sm
- User messages: User avatar, teal gradient background, rounded-se-sm
- Typing animation: three bouncing dots with staggered animation delays
- Quick action buttons (shown only when ≤1 message): "Find Jobs", "Interview Tips", "Resume Help", "Application Status"
- Quick actions use i18n labels, send predefined messages to the API
- Auto-greets with: "Hi! 👋 I'm your AI recruiting assistant. How can I help you today?"
- Responsive: full-width on mobile (`w-[calc(100vw-3rem)]`), fixed width on desktop (`sm:w-96`)
- Uses `useI18n()` hook for all strings via `t.common.chatbot.*`
- Teal/emerald accent colors only
- Glass card style: `bg-background/95 backdrop-blur-xl`
- Input area: rounded Input with teal focus ring, gradient Send button
- New Chat button resets conversation, generates new sessionId
- Auto-scrolls to bottom on new messages
- Auto-focuses input when opened
- Uses `toast` from sonner for rate limit errors
- CSS-only animations (no framer-motion)
- Typing dot animation via `<style jsx global>` with `typing-bounce` keyframes

### 3. Added AIChatbot to Landing Page (`src/app/page.tsx`)

- Imported via `next/dynamic` with `ssr: false` (avoids SSR issues with localStorage/session)
- Added `<AIChatbot />` component at the bottom of the JSX (inside main div, after all sections)
- Moved scroll-to-top button to `bottom-22 end-6 z-40` to avoid overlap with chat button at `bottom-6 end-6 z-50`

### 4. i18n Keys Added

Added `chatbot` object under `common` in both EN and AR translations:

**EN** (`src/lib/i18n/en.json`):
- title: "AI Assistant"
- subtitle: "How can I help you?"
- placeholder: "Type your message..."
- send: "Send"
- quickFindJobs: "Find Jobs"
- quickInterviewTips: "Interview Tips"
- quickResumeHelp: "Resume Help"
- quickAppStatus: "Application Status"
- greeting: "Hi! 👋 I'm your AI recruiting assistant. How can I help you today?"
- thinking: "Thinking..."
- errorRetry: "Something went wrong. Please try again."
- newChat: "New Chat"

**AR** (`src/lib/i18n/ar.json`):
- title: "مساعد الذكاء الاصطناعي"
- subtitle: "كيف يمكنني مساعدتك؟"
- placeholder: "اكتب رسالتك..."
- send: "إرسال"
- quickFindJobs: "البحث عن وظائف"
- quickInterviewTips: "نصائح المقابلة"
- quickResumeHelp: "مساعدة السيرة الذاتية"
- quickAppStatus: "حالة الطلب"
- greeting: "مرحبا! 👋 أنا مساعد التوظيف بالذكاء الاصطناعي. كيف يمكنني مساعدتك اليوم؟"
- thinking: "جاري التفكير..."
- errorRetry: "حدث خطأ. يرجى المحاولة مرة أخرى."
- newChat: "محادثة جديدة"

### 5. No Nav Item Needed

Chatbot is a floating widget, so no sidebar nav item was added.

## Technical Details

- ChatConversation model already existed in Prisma schema (no schema changes needed)
- Uses `PrismaClient` directly in the API route for reliability with hot reloading
- API uses `fetch('/api/chatbot', { method: 'POST', body: JSON.stringify({...}) })` pattern
- All strings use i18n keys via `t.common.chatbot.*`
- Uses shadcn/ui components: Button, Input, ScrollArea
- Uses Lucide icons: MessageSquare, Send, X, Bot, User, Sparkles, Plus
- CSS animations only (typing-bounce keyframes via style jsx global)
- Teal/emerald accent colors only
- RTL-aware: chat panel uses `dir={dir}` from useI18n
- Responsive design: mobile-first with sm: breakpoint
- Rate limiting: in-memory Map with session-based tracking

## Files Created
- `/src/app/api/chatbot/route.ts` — Chatbot API route
- `/src/components/shared/ai-chatbot.tsx` — Floating chat widget component

## Files Modified
- `/src/app/page.tsx` — Added AIChatbot import + component, moved scroll-to-top button
- `/src/lib/i18n/en.json` — Added chatbot i18n keys
- `/src/lib/i18n/ar.json` — Added chatbot i18n keys

## QA Results
- Lint: Clean with zero errors ✅
- All i18n keys properly structured in both EN and AR ✅
- No framer-motion used — CSS animations only ✅
- No recharts used ✅
- Teal/emerald accent colors only ✅
- ChatConversation Prisma model already existed ✅
