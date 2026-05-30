import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '@/lib/security/error-handler';
import { requireAuth } from '@/lib/auth-guard';
import { validateInput, chatbotMessageSchema } from '@/lib/validation/schemas';

// Create a fresh PrismaClient instance for the chatbot route
const prisma = new PrismaClient();

// Simple in-memory rate limiter: max 20 messages per session per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 120_000);

const SYSTEM_PROMPT = `You are TalentFlow AI's recruiting assistant. Help candidates with job search, application status, interview tips, and platform navigation. Be friendly, professional, and concise. If asked about specific job details you don't know, suggest they browse the jobs page. If asked about their specific application status, suggest they log in and check their candidate dashboard. Keep responses under 3 sentences unless the user asks for detailed advice. Use bullet points for lists. Always be encouraging and helpful.`;

// POST /api/chatbot
export async function POST(request: NextRequest) {
  try {
    // Authentication check - require at least a logged-in user
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // Zod schema validation
    const validation = validateInput(chatbotMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { message, sessionId } = validation.data;
    const { context, source } = body;

    // sessionId is required for this route (business logic)
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (isRateLimited(sessionId)) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Load or create conversation
    let conversation = await prisma.chatConversation.findUnique({
      where: { sessionId },
    });

    let previousMessages: Array<{ role: string; content: string }> = [];

    if (conversation) {
      try {
        previousMessages = JSON.parse(conversation.messages);
      } catch {
        previousMessages = [];
      }
    }

    // Build messages for AI (keep last 20 for context window)
    const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add context info if provided
    if (context) {
      const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
      aiMessages.push({
        role: 'system',
        content: `The user is currently on: ${contextStr}`,
      });
    }

    // Add previous messages (last 20)
    const recentMessages = previousMessages.slice(-20);
    for (const msg of recentMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    aiMessages.push({ role: 'user', content: message });

    // Call AI
    let aiResponse: string;
    try {
      const zai = await ZAI.create();
      const response = await zai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: aiMessages,
      });
      aiResponse = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Chatbot AI error:', error);
      aiResponse = "I'm having trouble connecting right now. Please try again in a moment.";
    }

    // Update conversation in database
    const updatedMessages = [
      ...previousMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse },
    ];

    if (conversation) {
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
          source: source || 'landing',
        },
      });
    }

    return NextResponse.json({
      response: aiResponse,
      sessionId,
    });
  } catch (error) {
    return handleApiError(error, 'Chatbot');
  }
}
