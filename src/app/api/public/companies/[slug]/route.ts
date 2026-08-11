import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Public company info by company slug or configured career-page slug.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = rawSlug.trim().toLowerCase();

    if (!slug || slug.length > 120) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 },
      );
    }

    // OR filters are not valid unique selectors. findFirst supports both the
    // company slug and an optional custom career-page slug safely.
    const company = await db.company.findFirst({
      where: {
        isActive: true,
        OR: [{ slug }, { careerPageSlug: slug }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        website: true,
        industry: true,
        location: true,
        careerPageConfig: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 },
      );
    }

    let config: Record<string, unknown> | null = null;
    if (company.careerPageConfig) {
      try {
        const parsed = JSON.parse(company.careerPageConfig);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          config = parsed as Record<string, unknown>;
        }
      } catch {
        // Invalid optional presentation config must not take down the page.
      }
    }

    if (config?.isPublished === false) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      description: company.description,
      website: company.website,
      industry: company.industry,
      location: company.location,
      config,
    });
  } catch (error) {
    console.error('Failed to fetch public company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 },
    );
  }
}
