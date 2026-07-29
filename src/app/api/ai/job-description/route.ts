// @ts-nocheck - AI provider output is validated before it reaches the client.
import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai-service';
import { requireCompanyEditor } from '@/lib/auth-guard';

const MAX_CONTEXT_LENGTH = 500;

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().slice(0, MAX_CONTEXT_LENGTH);
  return normalized || undefined;
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const jobTitle = optionalText(body.jobTitle);
    const jobType = optionalText(body.jobType);
    const location = optionalText(body.location);
    const industry = optionalText(body.industry);
    const experienceLevel = optionalText(body.experienceLevel);
    const department = optionalText(body.department);
    const companyName = optionalText(body.companyName || auth.companyName);

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'jobTitle is required' },
        { status: 400 },
      );
    }

    const systemPrompt = `You are an expert HR copywriter. Create an inclusive, accurate job description from the supplied role context.

Respond with one valid JSON object and no Markdown:
{
  "title": "<job title>",
  "description": "<2-3 concise paragraphs>",
  "requirements": ["<5-8 specific requirements>"],
  "responsibilities": ["<5-7 outcome-focused responsibilities>"],
  "benefits": ["<realistic benefits>"],
  "skills": ["<6-10 skills>"],
  "experienceMin": <number or null>,
  "experienceMax": <number or null>
}

Avoid discriminatory, exclusionary, inflated, or unverifiable language. Do not invent company-specific benefits that were not provided.`;

    const context = [
      `Job title: ${jobTitle}`,
      jobType && `Job type: ${jobType}`,
      location && `Location: ${location}`,
      industry && `Industry: ${industry}`,
      experienceLevel && `Experience level: ${experienceLevel}`,
      department && `Department: ${department}`,
      companyName && `Company: ${companyName}`,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await aiChat({
      userId: auth.userId,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate the job description using this context:\n\n${context}`,
        },
      ],
      feature: 'job_description',
    });

    let jobDescription: Record<string, unknown>;
    try {
      const json = result.content
        .trim()
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
      jobDescription = JSON.parse(json);
    } catch {
      jobDescription = {
        title: jobTitle,
        description: result.content,
        requirements: [],
        responsibilities: [],
        benefits: [],
        skills: [],
        experienceMin: null,
        experienceMax: null,
      };
    }

    return NextResponse.json({
      jobDescription,
      usage: result.usage,
      model: result.model,
    });
  } catch (error) {
    console.error('Error generating job description:', error);
    const message =
      error instanceof Error ? error.message : 'Job description generation failed';
    const status = message.includes('No active AI provider') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
