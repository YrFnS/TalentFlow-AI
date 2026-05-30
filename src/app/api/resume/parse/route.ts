// @ts-nocheck
import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { handleApiError } from '@/lib/security/error-handler';

// POST /api/resume/parse
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'resumeText is required and must be a string' },
        { status: 400 }
      );
    }

    if (resumeText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Resume text is too short for parsing' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `You are a professional resume parser and data extraction specialist. Your task is to extract structured information from the provided resume text.

You MUST respond with a valid JSON object only (no markdown, no code fences, no additional text) with these exact fields:
{
  "name": "<string: full name of the person, or null if not found>",
  "email": "<string: email address, or null if not found>",
  "phone": "<string: phone number, or null if not found>",
  "skills": [<array of strings: all technical and soft skills mentioned>],
  "experience": [<array of objects, each with: "title", "company", "description", "startDate", "endDate", "current" (boolean)>],
  "education": [<array of objects, each with: "institution", "degree", "field", "startDate", "endDate">],
  "certifications": [<array of objects, each with: "name", "issuer", "date">]
}

Be thorough and accurate. Extract all relevant information. For dates, use YYYY-MM format if possible. If a field is ambiguous or not present, use null for strings or empty arrays for lists.`;

    const userMessage = `Please parse the following resume and extract the structured information:

${resumeText}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse AI response as JSON, stripping markdown code fences if present
    let parsed;
    try {
      const jsonStr = content
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        name: null,
        email: null,
        phone: null,
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        rawText: content,
      };
    }

    return NextResponse.json({
      success: true,
      parsed,
      parsedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, 'ResumeParse');
  }
}
