// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireCompanyMember, requireAdmin } from '@/lib/auth-guard';

const prisma = new PrismaClient();

// GET /api/chatbot/config — Get chatbot configuration for the company
export async function GET(request: NextRequest) {
  try {
    // Authentication check - require COMPANY or ADMIN role
    const auth = await requireCompanyMember();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    let config = await prisma.chatbotConfig.findUnique({
      where: { companyId },
    });

    // Return defaults if no config exists
    if (!config) {
      config = {
        id: 'default',
        companyId,
        welcomeMessage: "Hi! I'm your AI recruiting assistant. How can I help?",
        personality: 'professional',
        enabledFeatures: JSON.stringify(['job_search', 'application_status', 'faq', 'interview_prep']),
        knowledgeBase: null,
        isActive: true,
        leadCaptureEnabled: true,
        leadCaptureFields: JSON.stringify(['name', 'email', 'phone']),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({
      id: config.id,
      companyId: config.companyId,
      welcomeMessage: config.welcomeMessage,
      personality: config.personality,
      enabledFeatures: JSON.parse(config.enabledFeatures),
      knowledgeBase: config.knowledgeBase ? JSON.parse(config.knowledgeBase) : null,
      isActive: config.isActive,
      leadCaptureEnabled: config.leadCaptureEnabled,
      leadCaptureFields: JSON.parse(config.leadCaptureFields),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching chatbot config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbot configuration' },
      { status: 500 }
    );
  }
}

// PATCH /api/chatbot/config — Update chatbot configuration
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check - require ADMIN role (only admins can modify chatbot config)
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { companyId, welcomeMessage, personality, enabledFeatures, knowledgeBase, isActive } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Validate personality
    const validPersonalities = ['professional', 'friendly', 'casual'];
    if (personality && !validPersonalities.includes(personality)) {
      return NextResponse.json(
        { error: 'personality must be one of: professional, friendly, casual' },
        { status: 400 }
      );
    }

    // Validate enabledFeatures
    const validFeatures = ['job_search', 'application_status', 'faq', 'interview_prep'];
    if (enabledFeatures && !Array.isArray(enabledFeatures)) {
      return NextResponse.json(
        { error: 'enabledFeatures must be an array' },
        { status: 400 }
      );
    }
    if (enabledFeatures) {
      const invalid = enabledFeatures.filter((f: string) => !validFeatures.includes(f));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid features: ${invalid.join(', ')}. Valid: ${validFeatures.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;
    if (personality !== undefined) updateData.personality = personality;
    if (enabledFeatures !== undefined) updateData.enabledFeatures = JSON.stringify(enabledFeatures);
    if (knowledgeBase !== undefined) updateData.knowledgeBase = knowledgeBase ? JSON.stringify(knowledgeBase) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Upsert the config
    const config = await prisma.chatbotConfig.upsert({
      where: { companyId },
      update: updateData,
      create: {
        companyId,
        welcomeMessage: welcomeMessage || "Hi! I'm your AI recruiting assistant. How can I help?",
        personality: personality || 'professional',
        enabledFeatures: JSON.stringify(enabledFeatures || ['job_search', 'application_status', 'faq', 'interview_prep']),
        knowledgeBase: knowledgeBase ? JSON.stringify(knowledgeBase) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      id: config.id,
      companyId: config.companyId,
      welcomeMessage: config.welcomeMessage,
      personality: config.personality,
      enabledFeatures: JSON.parse(config.enabledFeatures),
      knowledgeBase: config.knowledgeBase ? JSON.parse(config.knowledgeBase) : null,
      isActive: config.isActive,
      leadCaptureEnabled: config.leadCaptureEnabled,
      leadCaptureFields: JSON.parse(config.leadCaptureFields),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Error updating chatbot config:', error);
    return NextResponse.json(
      { error: 'Failed to update chatbot configuration' },
      { status: 500 }
    );
  }
}
