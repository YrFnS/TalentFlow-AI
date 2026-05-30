// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyMember } from '@/lib/auth-guard';
import { sendEmail, sendTemplatedEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  const auth = await requireCompanyMember();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { to, subject, body: emailBody, templateId, variables } = body;

    if (!to || !subject || !emailBody) {
      if (!templateId) {
        return NextResponse.json(
          { error: 'to, subject, and body are required (or templateId with variables)' },
          { status: 400 }
        );
      }
    }

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient (to) is required' },
        { status: 400 }
      );
    }

    let result;

    if (templateId) {
      // Use templated email
      result = await sendTemplatedEmail(
        templateId,
        to,
        variables || {},
        {
          companyId: auth.companyId || undefined,
          userId: auth.userId,
        }
      );
    } else {
      // Use direct email
      result = await sendEmail({
        to,
        subject,
        body: emailBody,
        companyId: auth.companyId || undefined,
        userId: auth.userId,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logId: result.logId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
