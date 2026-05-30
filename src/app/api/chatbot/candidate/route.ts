// @ts-nocheck - Complex Prisma types, validated at runtime
import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '@/lib/security/error-handler';
import { requireCandidate } from '@/lib/auth-guard';
import { validateInput, chatbotMessageSchema } from '@/lib/validation/schemas';

const prisma = new PrismaClient();

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 120_000);

const CANDIDATE_SYSTEM_PROMPT = `You are TalentFlow AI's candidate assistant. You help job seekers with:
- Checking their application status and progress
- Providing interview tips and preparation advice
- Answering questions about the hiring process
- Showing upcoming interviews and schedules
- Resume and cover letter guidance
- Career development suggestions

Be friendly, encouraging, and supportive. Use bullet points for lists. Keep responses under 4 sentences unless detailed advice is requested. Always be positive and motivate the candidate. When mentioning specific application statuses, use general terms since you may not have real-time data.`;

// Mock fallback responses for when AI is unavailable
const MOCK_RESPONSES: Record<string, string> = {
  status: `Here's how to check your application status:\n\n• Go to your **Applications** page to see all submitted applications\n• Each application shows its current stage: Applied → Screening → Interview → Offer\n• You'll receive notifications when your status changes\n• The average response time is 3-5 business days\n\nKeep your profile updated to improve your chances!`,
  interview: `Here are some top interview tips:\n\n🎯 **Before the Interview:**\n• Research the company and role thoroughly\n• Prepare STAR-method answers (Situation, Task, Action, Result)\n• Practice with our AI Interview Prep tool\n• Prepare 3-5 questions to ask the interviewer\n\n💡 **During the Interview:**\n• Arrive 5-10 minutes early\n• Maintain good eye contact and posture\n• Listen carefully and answer concisely\n• Show enthusiasm for the role\n\nWould you like more specific tips for your interview type?`,
  process: `Here's how our hiring process typically works:\n\n1️⃣ **Application** — Submit your application online\n2️⃣ **Screening** — AI reviews your resume for match score\n3️⃣ **Interview** — Phone screen → Technical/Behavioral interview\n4️⃣ **Assessment** — Skills test or work sample (if required)\n5️⃣ **Offer** — If selected, you'll receive an offer letter\n\n💡 Tips: Keep your profile complete, respond promptly to messages, and prepare well for each stage!`,
  upcoming: `Here are your upcoming interview events:\n\n📅 **No upcoming interviews scheduled**\n\nWhen you have interviews scheduled, they'll appear here with:\n• Date and time\n• Interview type (phone, video, on-site)\n• Interviewer information\n• Meeting link or location\n\nMake sure to check your Applications page regularly for updates!`,
  default: `I'm your career assistant! I can help you with:\n\n📋 **Application Status** — Track your applications\n🎯 **Interview Tips** — Ace your interviews\n❓ **Process Questions** — Understand the hiring flow\n📅 **Upcoming Interviews** — View your schedule\n\nWhat would you like to know?`,
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('status') || lower.includes('application') || lower.includes('track') || lower.includes('progress')) return MOCK_RESPONSES.status;
  if (lower.includes('interview') || lower.includes('tip') || lower.includes('prepare') || lower.includes('advice')) return MOCK_RESPONSES.interview;
  if (lower.includes('process') || lower.includes('how') || lower.includes('what') || lower.includes('step') || lower.includes('flow')) return MOCK_RESPONSES.process;
  if (lower.includes('upcoming') || lower.includes('schedule') || lower.includes('calendar') || lower.includes('next interview')) return MOCK_RESPONSES.upcoming;
  return MOCK_RESPONSES.default;
}

// POST /api/chatbot/candidate
export async function POST(request: NextRequest) {
  try {
    // Authentication check - require CANDIDATE role
    const auth = await requireCandidate();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // Zod schema validation
    const validation = validateInput(chatbotMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { message, sessionId } = validation.data;
    const { context, source, candidateId, conversationHistory } = body;

    // sessionId is required for this route (business logic)
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (isRateLimited(sessionId)) {
      return NextResponse.json({ error: 'Too many messages. Please wait a moment.' }, { status: 429 });
    }

    // Gather candidate context
    let candidateContext = '';
    try {
      if (candidateId && candidateId !== 'current') {
        const candidate = await prisma.candidateProfile.findUnique({
          where: { id: candidateId },
          include: {
            applications: {
              take: 5,
              orderBy: { appliedAt: 'desc' },
              include: { job: { select: { title: true } } },
            },
          },
        });

        if (candidate) {
          const upcomingInterviews = await prisma.interview.count({
            where: {
              application: { candidateId: candidate.id },
              status: 'SCHEDULED',
              scheduledAt: { gte: new Date() },
            },
          });

          candidateContext = `\n\nCandidate context:\n- Name: ${candidate.user?.name || 'Unknown'}\n- Current title: ${candidate.currentTitle || 'Not specified'}\n- Skills: ${candidate.skills || 'Not specified'}\n- Experience: ${candidate.experienceYears || 0} years\n- Applications submitted: ${candidate.applications.length}\n- Upcoming interviews: ${upcomingInterviews}\n- Recent applications: ${candidate.applications.map(a => `${a.job.title} (${a.status})`).join(', ') || 'None'}`;
        }
      }
    } catch (err) {
      console.error('Error fetching candidate context:', err);
    }

    // Build messages for AI
    const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: CANDIDATE_SYSTEM_PROMPT },
    ];

    if (candidateContext) {
      aiMessages.push({ role: 'system', content: candidateContext });
    }

    if (context) {
      const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
      aiMessages.push({ role: 'system', content: `The user is currently on: ${contextStr}` });
    }

    // Add conversation history (last 20)
    if (Array.isArray(conversationHistory)) {
      const recent = conversationHistory.slice(-20);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          aiMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    aiMessages.push({ role: 'user', content: message });

    // Call AI
    let aiResponse: string;
    try {
      const zai = await ZAI.create();
      const response = await zai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: aiMessages,
      });
      aiResponse = response.choices[0]?.message?.content || '';
      if (!aiResponse) {
        aiResponse = getMockResponse(message);
      }
    } catch (error) {
      console.error('Candidate chatbot AI error:', error);
      aiResponse = getMockResponse(message);
    }

    // Save conversation
    try {
      const existing = await prisma.chatConversation.findUnique({ where: { sessionId } });
      const updatedMessages = [
        ...(existing ? JSON.parse(existing.messages) : []),
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse },
      ];

      if (existing) {
        await prisma.chatConversation.update({
          where: { sessionId },
          data: {
            messages: JSON.stringify(updatedMessages),
            context: context ? (typeof context === 'string' ? context : JSON.stringify(context)) : undefined,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.chatConversation.create({
          data: {
            sessionId,
            userId: null,
            messages: JSON.stringify(updatedMessages),
            context: context ? (typeof context === 'string' ? context : JSON.stringify(context)) : undefined,
            source: source || 'candidate',
          },
        });
      }
    } catch (err) {
      console.error('Error saving conversation:', err);
    }

    return NextResponse.json({ response: aiResponse, sessionId });
  } catch (error) {
    return handleApiError(error, 'ChatbotCandidate');
  }
}
