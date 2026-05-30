import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Public company info by slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const company = await db.company.findUnique({
      where: {
        OR: [
          { slug },
          { careerPageSlug: slug },
        ],
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
        { status: 404 }
      );
    }

    // Parse career page config if available
    let config = null;
    if (company.careerPageConfig) {
      try {
        config = JSON.parse(company.careerPageConfig);
      } catch {
        config = null;
      }
    }

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
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
      { status: 500 }
    );
  }
}
