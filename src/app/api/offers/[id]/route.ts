// @ts-nocheck - Prisma payloads are validated before persistence.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireCompanyEditor,
  requireCompanyMember,
  resolveCompanyId,
} from '@/lib/auth-guard';
import { getClientIp } from '@/lib/security';
import { offerUpdateSchema, validateInput } from '@/lib/validation/schemas';
import {
  offerInclude,
  parseOfferDeadline,
  serializeOffer,
  serializeOfferList,
  setApplicationWorkflowState,
} from '@/lib/offer-service';

async function resolveOffer(id: string, companyId: string) {
  return db.offer.findFirst({
    where: { id, application: { job: { companyId } } },
    include: offerInclude,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
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

    const offer = await resolveOffer(id, companyId);
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(serializeOffer(offer));
  } catch (error) {
    console.error('Offer GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateInput(offerUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const companyId = resolveCompanyId(auth, body.companyId);
    if (!companyId) {
      return NextResponse.json(
        { error: 'A valid company context is required' },
        { status: 403 },
      );
    }

    const existing = await resolveOffer(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    if (!['DRAFT', 'PENDING'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Only draft or pending offers can be edited' },
        { status: 409 },
      );
    }

    const input = validation.data;
    const data: Record<string, unknown> = {};
    if (input.salary !== undefined) data.salary = input.salary;
    if (input.salaryCurrency !== undefined) {
      data.salaryCurrency = input.salaryCurrency;
    }
    if (input.equity !== undefined) data.equity = input.equity || null;
    if (input.startDate !== undefined) data.startDate = input.startDate || null;
    if (input.benefits !== undefined) {
      data.benefits = serializeOfferList(input.benefits);
    }
    if (input.conditions !== undefined) {
      data.conditions = serializeOfferList(input.conditions);
    }
    if (input.letterText !== undefined) {
      data.letterText = input.letterText?.trim() || null;
    }
    if (input.notes !== undefined) data.notes = input.notes || null;
    if (input.responseDeadline !== undefined) {
      const deadline = parseOfferDeadline(input.responseDeadline);
      if (input.responseDeadline && !deadline) {
        return NextResponse.json(
          { error: 'responseDeadline is invalid' },
          { status: 400 },
        );
      }
      if (deadline && deadline <= new Date()) {
        return NextResponse.json(
          { error: 'responseDeadline must be in the future' },
          { status: 400 },
        );
      }
      data.responseDeadline = deadline;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'At least one offer field must be updated' },
        { status: 400 },
      );
    }

    const offer = await db.offer.update({
      where: { id },
      data,
      include: offerInclude,
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'offer.update',
        resource: 'offer',
        resourceId: id,
        ipAddress: getClientIp(request.headers),
        details: JSON.stringify({ companyId, changedFields: Object.keys(data) }),
      },
    });

    return NextResponse.json(serializeOffer(offer));
  } catch (error) {
    console.error('Offer PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCompanyEditor();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
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

    const existing = await resolveOffer(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    if (['ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'This offer can no longer be withdrawn' },
        { status: 409 },
      );
    }

    const offer = await db.$transaction(async (transaction) => {
      const updated = await transaction.offer.update({
        where: { id },
        data: {
          status: 'WITHDRAWN',
          signingToken: null,
          signingTokenExpiry: null,
          signingStatus: 'PENDING',
        },
        include: offerInclude,
      });

      const otherActiveOffers = await transaction.offer.count({
        where: {
          applicationId: existing.applicationId,
          id: { not: id },
          status: { in: ['SENT', 'ACCEPTED'] },
        },
      });
      if (
        existing.application?.status === 'OFFERED' &&
        otherActiveOffers === 0
      ) {
        await setApplicationWorkflowState(transaction, {
          applicationId: existing.applicationId,
          companyId,
          status: 'INTERVIEW',
          stageTerms: ['interview'],
        });
      }

      if (existing.status === 'SENT') {
        await transaction.notification.create({
          data: {
            userId: existing.application.candidate.user.id,
            title: 'Offer withdrawn',
            message: `${existing.application.job.company.name} withdrew the offer for ${existing.application.job.title}.`,
            type: 'offer',
            link: '/candidate/applications',
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'offer.withdraw',
          resource: 'offer',
          resourceId: id,
          ipAddress: getClientIp(request.headers),
          details: JSON.stringify({ companyId }),
        },
      });

      return updated;
    });

    return NextResponse.json(serializeOffer(offer));
  } catch (error) {
    console.error('Offer DELETE error:', error);
    return NextResponse.json({ error: 'Failed to withdraw offer' }, { status: 500 });
  }
}
