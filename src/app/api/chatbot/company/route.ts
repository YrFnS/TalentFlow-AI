import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '@/lib/security/error-handler';
import { requireCompanyMember } from '@/lib/auth-guard';
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

const COMPANY_SYSTEM_PROMPT = `You are TalentFlow AI's recruiting assistant for company HR teams. You help with:
- Searching and finding candidates for job openings
- Creating and managing job postings
- Answering HR compliance and employment law questions
- Providing hiring analytics summaries and insights
- Interview scheduling and candidate pipeline management
- Best practices for recruitment and talent acquisition

Be professional, concise, and actionable. Use bullet points for lists. Keep responses under 4 sentences unless detailed advice is requested. When giving hiring analytics, use approximate numbers and trends. Always suggest specific next steps.`;

// Mock fallback responses for when AI is unavailable
const MOCK_RESPONSES: Record<string, string> = {
  candidate: `Here are some tips for finding candidates:\n\n• Use the Candidates page to search by skills, experience, and location\n• Check the Talent Pool for previously sourced candidates\n• Post your job to multiple job boards for wider reach\n• Use AI-powered screening to rank applicants automatically\n\nWould you like help with any of these?`,
  job: `To create an effective job posting:\n\n• Write a clear, specific job title\n• Include key responsibilities and requirements\n• Add salary range to attract more qualified candidates\n• Highlight company culture and benefits\n• Use our AI job description generator for help\n\nShall I help you draft a job posting?`,
  compliance: `Here are key HR compliance areas to consider:\n\n• Equal Employment Opportunity (EEO) regulations\n• Fair hiring practices and bias prevention\n• Data privacy and GDPR compliance\n• Interview question guidelines (avoid discriminatory questions)\n• Proper documentation of hiring decisions\n\nOur Fair Hiring feature can help audit your process for bias. Would you like to learn more?`,
  analytics: `Here's a summary of your hiring analytics:\n\n• **Time to Hire**: Average 23 days (industry avg: 36 days)\n• **Offer Acceptance Rate**: 78%\n• **Candidate Pipeline**: 45 active candidates across 8 jobs\n• **Interview Completion**: 67% of scheduled interviews completed\n• **Source Quality**: Referrals have 3x higher conversion\n\nCheck the Analytics page for detailed charts and trends.`,
  default: `I'm your HR recruiting assistant! I can help you with:\n\n• 🔍 **Search Candidates** — Find the right talent\n• 📝 **Job Postings** — Create and optimize listings\n• ⚖️ **HR Compliance** — Stay on top of regulations\n• 📊 **Hiring Analytics** — Track your recruitment metrics\n\nWhat would you like help with?`,
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('candidate') || lower.includes('search') || lower.includes('find') || lower.includes('talent')) return MOCK_RESPONSES.candidate;
  if (lower.includes('job') || lower.includes('posting') || lower.includes('position') || lower.includes('create')) return MOCK_RESPONSES.job;
  if (lower.includes('compliance') || lower.includes('legal') || lower.includes('law') || lower.includes('regulation')) return MOCK_RESPONSES.compliance;
  if (lower.includes('analytics') || lower.includes('metric') || lower.includes('stat') || lower.includes('report') || lower.includes('data')) return MOCK_RESPONSES.analytics;
  return MOCK_RESPONSES.default;
}

// POST /api/chatbot/company
export async function POST(request: NextRequest) {
  try {
    // Authentication check - require COMPANY or ADMIN role
    const auth = await requireCompanyMember();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // Zod schema validation
    const validation = validateInput(chatbotMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { message, sessionId } = validation.data;
    const { context, source, companyId, conversationHistory } = body;

    // sessionId is required for this route (business logic)
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (isRateLimited(sessionId)) {
      return NextResponse.json({ error: 'Too many messages. Please wait a moment.' }, { status: 429 });
    }

    // Gather company context
    let companyContext = '';
    try {
      if (companyId && companyId !== 'current') {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          include: {
            jobs: { where: { status: 'OPEN' }, take: 5, orderBy: { createdAt: 'desc' } },
          },
        });

        if (company) {
          const candidateCount = await prisma.application.count({
            where: { job: { companyId: company.id } },
          });
          const hiredCount = await prisma.application.count({
            where: { job: { companyId: company.id }, status: 'HIRED' },
          });
          const openJobsCount = await prisma.job.count({
            where: { companyId: company.id, status: 'OPEN' },
          });

          companyContext = `\n\nCompany context:\n- Company: ${company.name}\n- Industry: ${company.industry || 'Not specified'}\n- Open positions: ${openJobsCount}\n- Total candidates: ${candidateCount}\n- Total hired: ${hiredCount}\n- Recent open jobs: ${company.jobs.map(j => j.title).join(', ') || 'None'}`;
        }
      }
    } catch (err) {
      console.error('Error fetching company context:', err);
    }

    // Build messages for AI
    const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: COMPANY_SYSTEM_PROMPT },
    ];

    if (companyContext) {
      aiMessages.push({ role: 'system', content: companyContext });
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
      console.error('Company chatbot AI error:', error);
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
            source: source || 'company',
          },
        });
      }
    } catch (err) {
      console.error('Error saving conversation:', err);
    }

    return NextResponse.json({ response: aiResponse, sessionId });
  } catch (error) {
    return handleApiError(error, 'ChatbotCompany');
  }
}
