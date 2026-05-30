import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

const BOARDS = [
  { name: 'LinkedIn', apiBaseUrl: 'https://api.linkedin.com/v2', config: JSON.stringify({ authType: 'oauth2', fields: ['title', 'description', 'location'], mapping: {} }) },
  { name: 'Indeed', apiBaseUrl: 'https://api.indeed.com/v2', config: JSON.stringify({ authType: 'apiKey', fields: ['jobTitle', 'jobDescription', 'city'], mapping: {} }) },
  { name: 'Glassdoor', apiBaseUrl: 'https://api.glassdoor.com/v1', config: JSON.stringify({ authType: 'partnerId', fields: ['jobTitle', 'jobDescription'], mapping: {} }) },
  { name: 'ZipRecruiter', apiBaseUrl: 'https://api.ziprecruiter.com/v1', config: JSON.stringify({ authType: 'apiKey', fields: ['title', 'description', 'location'], mapping: {} }) },
  { name: 'AngelList', apiBaseUrl: 'https://api.angel.co/v1', config: JSON.stringify({ authType: 'token', fields: ['title', 'description', 'salary_min'], mapping: {} }) },
  { name: 'Bayt', apiBaseUrl: 'https://api.bayt.com/v1', config: JSON.stringify({ authType: 'apiKey', fields: ['job_title', 'job_description', 'country'], mapping: {} }) },
  { name: 'NaukriGulf', apiBaseUrl: 'https://api.naukrigulf.com/v1', config: JSON.stringify({ authType: 'apiKey', fields: ['title', 'description', 'location'], mapping: {} }) },
  { name: 'Dice', apiBaseUrl: 'https://api.dice.com/v2', config: JSON.stringify({ authType: 'apiKey', fields: ['jobTitle', 'jobDescription', 'skills'], mapping: {} }) },
  { name: 'Monster', apiBaseUrl: 'https://api.monster.com/v2', config: JSON.stringify({ authType: 'oauth2', fields: ['Title', 'Description', 'Location'], mapping: {} }) },
  { name: 'SimplyHired', apiBaseUrl: 'https://api.simplyhired.com/v1', config: JSON.stringify({ authType: 'apiKey', fields: ['title', 'description', 'location'], mapping: {} }) },
];

export async function POST() {
  try {
    // Authentication check - require ADMIN role
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const existing = await db.jobBoard.count();

    if (existing > 0) {
      return NextResponse.json({
        message: 'Job boards already seeded',
        count: existing,
      });
    }

    const boards = await db.jobBoard.createMany({
      data: BOARDS.map((b) => ({
        name: b.name,
        apiBaseUrl: b.apiBaseUrl,
        config: b.config,
        isActive: true,
      })),
    });

    return NextResponse.json({
      message: 'Job boards seeded successfully',
      count: boards.count,
    });
  } catch (error) {
    console.error('Error seeding job boards:', error);
    return NextResponse.json(
      { error: 'Failed to seed job boards' },
      { status: 500 }
    );
  }
}
