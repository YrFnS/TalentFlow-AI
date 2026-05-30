import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if job exists
    const job = await db.job.findUnique({
      where: { id },
      select: { id: true, slug: true, title: true, company: { select: { name: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate apply URL
    const applyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/apply/${job.slug}`;

    // Generate QR code URL using public API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(applyUrl)}`;

    // Try to update or create QuickApplyConfig
    try {
      const existingConfig = await db.quickApplyConfig.findUnique({
        where: { jobId: id },
      });

      if (existingConfig) {
        await db.quickApplyConfig.update({
          where: { jobId: id },
          data: { qrCodeUrl },
        });
      } else {
        await db.quickApplyConfig.create({
          data: {
            jobId: id,
            qrCodeUrl,
            enableQuickApply: true,
            enableOneClick: false,
            enableTextApply: false,
          },
        });
      }
    } catch {
      // QuickApplyConfig table might not be ready yet, continue anyway
    }

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      applyUrl,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('QR apply error:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
