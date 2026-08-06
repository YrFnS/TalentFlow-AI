// @ts-nocheck - Prisma payloads are validated before persistence.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';
import {
  offerCreateSchema,
  validateInput,
} from '@/lib/validation/schemas';
import {
  buildOfferLetter,
  offerInclude,
  parseOfferDeadline,
  serializeOffer,
  serializeOfferList,
} from '@/lib/offer-service';

const OFFER_STATUSES = new Set([
  'DRAFT',
  'PENDING',
  'SENT',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
  'EXPIRED',
]);

export async function GET(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const companyId = resolveCompanyId(
      auth,
      request.nextUrl.searchParams.get('companyId'),
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search')?.trim();
    const where: Record<string, unknown> = {
      application: { job: { companyId } },
    };

    if (status && OFFER_STATUSES.has(status)) where.status = status;
    if (search) {
      where.OR = [
        {
          application: {
            candidate: {
              user: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        },
        {
          application: {
            candidate: {
              user: { email: { contains: search, mode: 'insensitive' } },
            },
          },
        },
        {
          application: {
            job: { title: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const offers = await db.offer.findMany({
      where,
      include: offerInclude,
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(offers.map(serializeOffer));
  } catch (error) {
    console.error('Offers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = validateInput(offerCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const input = validation.data;
    const companyId = resolveCompanyId(auth, body.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const application = await db.application.findFirst({
      where: { id: input.applicationId, job: { companyId } },
      include: {
        candidate: { include: { user: true } },
        job: { include: { company: true } },
        offers: {
          where: {
            status: { in: ['DRAFT', 'PENDING', 'SENT', 'ACCEPTED'] },
          },
          select: { id: true, status: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }
    if (['REJECTED', 'WITHDRAWN', 'HIRED'].includes(application.status)) {
      return NextResponse.json(
        { error: 'This application is not eligible for a new offer' },
        { status: 409 },
      );
    }
    if (application.offers.length > 0) {
      return NextResponse.json(
        { error: 'This application already has an active offer' },
        { status: 409 },
      );
    }

    const responseDeadline = parseOfferDeadline(input.responseDeadline);
    if (input.responseDeadline && !responseDeadline) {
      return NextResponse.json(
        { error: 'responseDeadline is invalid' },
        { status: 400 },
      );
    }
    if (responseDeadline && responseDeadline <= new Date()) {
      return NextResponse.json(
        { error: 'responseDeadline must be in the future' },
        { status: 400 },
      );
    }

    const benefits = input.benefits || [];
    const conditions = input.conditions || [];
    const letterText =
      input.letterText?.trim() ||
      buildOfferLetter({
        candidateName: application.candidate.user.name,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
        salary: input.salary,
        salaryCurrency: input.salaryCurrency,
        startDate: input.startDate,
        equity: input.equity,
        benefits,
        conditions,
        responseDeadline,
      });

    const offer = await db.offer.create({
      data: {
        applicationId: application.id,
        salary: input.salary,
        salaryCurrency: input.salaryCurrency,
        equity: input.equity || null,
        startDate: input.startDate || null,
        benefits: serializeOfferList(benefits),
        conditions: serializeOfferList(conditions),
        letterText,
        responseDeadline,
        notes: input.notes || null,
        status: 'DRAFT',
        signingStatus: 'PENDING',
      },
      include: offerInclude,
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'offer.create',
        resource: 'offer',
        resourceId: offer.id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({
          companyId,
          applicationId: application.id,
          jobId: application.jobId,
        }),
      },
    });

    return NextResponse.json(serializeOffer(offer), { status: 201 });
  } catch (error) {
    console.error('Offers POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 },
    );
  }
}
