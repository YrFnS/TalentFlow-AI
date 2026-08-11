// @ts-nocheck - Prisma result types are shaped for the candidate assistant.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/ai-service';
import { handleApiError } from '@/lib/security/error-handler';
import { requireCandidate } from '@/lib/auth-guard';
import { validateInput, chatbotMessageSchema } from '@/lib/validation/schemas';

const MAX_HISTORY_MESSAGES = 20;
const MAX_STORED_MESSAGES = 100;
const MAX_CONTEXT_LENGTH = 2_000;

const CANDIDATE_SYSTEM_PROMPT = `You are TalentFlow AI's candidate assistant. You help job seekers with their own application status, upcoming interviews, hiring-process questions, interview preparation, resume guidance, and career development.

Use only the candidate context supplied by TalentFlow for candidate-specific claims. Never invent an application, interview, status, date, company, or response time. When data is unavailable, say so and direct the candidate to the relevant TalentFlow page. Be friendly and supportive, use bullets for lists, and keep routine answers concise.`;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function parseStoredMessages(value: string | null): ChatMessage[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ChatMessage =>
          item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string',
      )
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 4_000),
      }))
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function sanitizeConversationHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is ChatMessage =>
        item &&
        typeof item === 'object' &&
        ('role' in item) &&
        ('content' in item) &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string',
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 2_000),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

function serializePageContext(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, MAX_CONTEXT_LENGTH) : null;
  }

  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value).slice(0, MAX_CONTEXT_LENGTH);
    } catch {
      return null;
    }
  }

  return null;
}

function buildCandidateContext(candidate: any, upcomingInterviews: any[]): string {
  const applications = candidate?.applications || [];
  const recentApplications = applications.length
    ? applications
        .map(
          (application: any) =>
            `${application.job.title} at ${application.job.company.name}: ${application.status}`,
        )
        .join('; ')
    : 'None';
  const upcoming = upcomingInterviews.length
    ? upcomingInterviews
        .map(
          (interview: any) =>
            `${interview.application.job.title} at ${interview.application.job.company.name} on ${interview.scheduledAt.toISOString()} (${interview.type})`,
        )
        .join('; ')
    : 'None';

  return [
    'Candidate data from TalentFlow:',
    `- Name: ${candidate?.user?.name || 'Not provided'}`,
    `- Current title: ${candidate?.currentTitle || 'Not provided'}`,
    `- Skills: ${candidate?.skills || 'Not provided'}`,
    `- Experience: ${candidate?.experienceYears ?? 'Not provided'} years`,
    `- Recent applications: ${recentApplications}`,
    `- Upcoming interviews: ${upcoming}`,
  ].join('\n');
}

function buildDegradedResponse(
  message: string,
  candidate: any,
  upcomingInterviews: any[],
): string {
  const lower = message.toLowerCase();
  const applications = candidate?.applications || [];

  if (
    lower.includes('status') ||
    lower.includes('application') ||
    lower.includes('progress')
  ) {
    if (applications.length === 0) {
      return 'I could not find any applications on your TalentFlow profile. Open the Jobs page to explore current roles, or check Applications after you submit one.';
    }

    const latest = applications[0];
    return `Your latest application is for ${latest.job.title} at ${latest.job.company.name}, and its current status is ${latest.status}. Open Applications for the complete timeline and your other submissions.`;
  }

  if (
    lower.includes('upcoming') ||
    lower.includes('schedule') ||
    lower.includes('next interview')
  ) {
    if (upcomingInterviews.length === 0) {
      return 'You do not currently have an upcoming interview recorded in TalentFlow. Check Applications and Notifications for any new scheduling updates.';
    }

    const next = upcomingInterviews[0];
    return `Your next interview is for ${next.application.job.title} at ${next.application.job.company.name} on ${next.scheduledAt.toISOString()}. Open your application details for the meeting link or location.`;
  }

  if (
    lower.includes('interview') ||
    lower.includes('prepare') ||
    lower.includes('tip')
  ) {
    return 'For interview preparation: review the role requirements, prepare two or three STAR examples, research the company, and write down thoughtful questions. Your application details can help you tailor those examples to the role.';
  }

  return 'The AI provider is temporarily unavailable, but your TalentFlow data is still safe. I can still help you check application status, review upcoming interviews, or explain where to find information in the candidate portal.';
}

// POST /api/chatbot/candidate
export async function POST(request: NextRequest) {
  try {
    const auth = await requireCandidate();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validation = validateInput(chatbotMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { message, sessionId } = validation.data;
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 },
      );
    }

    // The profile is always derived from the authenticated user. A client may
    // not select another candidate by sending a candidateId in the request.
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: auth.userId },
      include: {
        user: { select: { name: true } },
        applications: {
          take: 5,
          orderBy: { appliedAt: 'desc' },
          select: {
            status: true,
            appliedAt: true,
            job: {
              select: {
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 },
      );
    }

    const upcomingInterviews = await db.interview.findMany({
      where: {
        application: { candidateId: candidate.id },
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        scheduledAt: true,
        type: true,
        application: {
          select: {
            job: {
              select: {
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const pageContext = serializePageContext(body.context);
    const conversationHistory = sanitizeConversationHistory(
      body.conversationHistory,
    );
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
      { role: 'system', content: CANDIDATE_SYSTEM_PROMPT },
      {
        role: 'system',
        content: buildCandidateContext(candidate, upcomingInterviews),
      },
    ];

    if (pageContext) {
      messages.push({
        role: 'system',
        content: `Current candidate-portal context: ${pageContext}`,
      });
    }

    messages.push(...conversationHistory, { role: 'user', content: message });

    let responseText = '';
    let degraded = false;
    let model: string | null = null;

    try {
      const completion = await aiChat({
        userId: auth.userId,
        messages,
        feature: 'candidate_chatbot',
      });
      responseText = completion.content.trim();
      model = completion.model || null;
      if (!responseText) throw new Error('AI provider returned an empty response');
    } catch (error) {
      degraded = true;
      console.warn(
        'Candidate chatbot provider unavailable; using grounded fallback:',
        error instanceof Error ? error.message : 'Unknown provider error',
      );
      responseText = buildDegradedResponse(
        message,
        candidate,
        upcomingInterviews,
      );
    }

    const existing = await db.chatConversation.findFirst({
      where: {
        userId: auth.userId,
        sessionId,
        source: 'candidate',
      },
      orderBy: { updatedAt: 'desc' },
    });
    const storedMessages = parseStoredMessages(existing?.messages || null);
    const updatedMessages = [
      ...storedMessages,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: responseText },
    ].slice(-MAX_STORED_MESSAGES);

    if (existing) {
      await db.chatConversation.update({
        where: { id: existing.id },
        data: {
          messages: JSON.stringify(updatedMessages),
          context: pageContext,
        },
      });
    } else {
      await db.chatConversation.create({
        data: {
          sessionId,
          userId: auth.userId,
          messages: JSON.stringify(updatedMessages),
          context: pageContext,
          source: 'candidate',
        },
      });
    }

    return NextResponse.json({
      response: responseText,
      sessionId,
      degraded,
      model,
      persisted: true,
    });
  } catch (error) {
    return handleApiError(error, 'ChatbotCandidate');
  }
}
