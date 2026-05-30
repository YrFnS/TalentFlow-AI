// @ts-nocheck
/**
 * Email Service — Unified email sending abstraction
 *
 * Supports:
 * - CONSOLE: Logs email to console (development/sandbox default)
 * - RESEND: Resend API (production)
 * - SMTP: Generic SMTP (production)
 *
 * All emails are logged to the EmailLog model for tracking.
 */

import { db } from '@/lib/db';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string; // HTML
  from?: string;
  companyId?: string;
  userId?: string;
  templateId?: string;
}

export interface EmailResult {
  success: boolean;
  logId?: string;
  provider?: string;
  providerId?: string;
  error?: string;
}

/**
 * Send an email using the configured provider.
 * In sandbox/development mode, emails are logged to console and stored in EmailLog.
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const {
    to,
    subject,
    body,
    from = 'TalentFlow AI <noreply@talentflow.ai>',
    companyId,
    userId,
    templateId,
  } = params;

  const provider = process.env.EMAIL_PROVIDER || 'CONSOLE'; // CONSOLE | RESEND | SMTP

  try {
    let providerId: string | undefined;
    let sentAt: Date | undefined;

    switch (provider.toUpperCase()) {
      case 'RESEND':
        const resendResult = await sendViaResend(to, subject, body, from);
        providerId = resendResult.id;
        sentAt = new Date();
        break;

      case 'SMTP':
        // SMTP would use nodemailer — placeholder for production
        console.log(`[SMTP] Would send email to: ${to}`);
        providerId = `smtp-${Date.now()}`;
        sentAt = new Date();
        break;

      case 'CONSOLE':
      default:
        console.log('\n========== EMAIL ==========');
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
        console.log('============================\n');
        providerId = `console-${Date.now()}`;
        sentAt = new Date();
        break;
    }

    // Log to database
    const log = await db.emailLog.create({
      data: {
        to,
        from: from.includes('<') ? from : `TalentFlow AI <${from}>`,
        subject,
        body,
        companyId: companyId || null,
        userId: userId || null,
        templateId: templateId || null,
        status: 'SENT',
        provider: provider.toUpperCase(),
        providerId,
        sentAt,
      },
    });

    return {
      success: true,
      logId: log.id,
      provider: provider.toUpperCase(),
      providerId,
    };
  } catch (error: any) {
    // Log failed attempt
    try {
      await db.emailLog.create({
        data: {
          to,
          from: from.includes('<') ? from : `TalentFlow AI <${from}>`,
          subject,
          body,
          companyId: companyId || null,
          userId: userId || null,
          templateId: templateId || null,
          status: 'FAILED',
          provider: provider.toUpperCase(),
          error: error.message || 'Unknown error',
        },
      });
    } catch (dbError) {
      console.error('Failed to log email error:', dbError);
    }

    return {
      success: false,
      provider: provider.toUpperCase(),
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send email via Resend API
 */
async function sendViaResend(
  to: string,
  subject: string,
  body: string,
  from: string
): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || 'TalentFlow AI <noreply@talentflow.ai>',
      to: [to],
      subject,
      html: body,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Render an email template with variable substitution
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

/**
 * Send a templated email using an EmailTemplate from the database
 */
export async function sendTemplatedEmail(
  templateId: string,
  to: string,
  variables: Record<string, string>,
  options?: { companyId?: string; userId?: string }
): Promise<EmailResult> {
  const template = await db.emailTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  if (!template.isActive) {
    return { success: false, error: 'Template is inactive' };
  }

  const subject = renderTemplate(template.subject, variables);
  const body = renderTemplate(template.body, variables);

  return sendEmail({
    to,
    subject,
    body,
    companyId: options?.companyId,
    userId: options?.userId,
    templateId,
  });
}

/**
 * Common email templates — built-in templates that don't require DB entries
 */
export const BUILTIN_EMAIL_TEMPLATES = {
  emailVerification: (name: string, verificationUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">Verify Your Email</h2>
      <p>Hello ${name},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">TalentFlow AI — AI-Powered HR & ATS Platform</p>
    </div>`,

  passwordReset: (name: string, resetUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
      <p>If the button doesn't work, copy and paste this link: <a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">TalentFlow AI — AI-Powered HR & ATS Platform</p>
    </div>`,

  applicationReceived: (candidateName: string, jobTitle: string, companyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">Application Received</h2>
      <p>Hello ${candidateName},</p>
      <p>Thank you for applying for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>Your application has been received and is being reviewed. We'll keep you updated on the status.</p>
      <p>Good luck!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">TalentFlow AI — AI-Powered HR & ATS Platform</p>
    </div>`,

  interviewScheduled: (candidateName: string, jobTitle: string, date: string, time: string, location: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">Interview Scheduled</h2>
      <p>Hello ${candidateName},</p>
      <p>Your interview for <strong>${jobTitle}</strong> has been scheduled.</p>
      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>
      <p>Please make sure to arrive on time. Good luck!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">TalentFlow AI — AI-Powered HR & ATS Platform</p>
    </div>`,

  offerLetter: (candidateName: string, jobTitle: string, companyName: string, salary: string, startDate: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">Offer Letter</h2>
      <p>Hello ${candidateName},</p>
      <p>We're excited to offer you the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!</p>
      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Salary:</strong> ${salary}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
      </div>
      <p>Please review the full offer details and respond by the deadline.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">TalentFlow AI — AI-Powered HR & ATS Platform</p>
    </div>`,

  rejection: (candidateName: string, jobTitle: string, companyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">Application Update</h2>
      <p>Hello ${candidateName},</p>
      <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
      <p>After careful consideration, we've decided to move forward with other candidates for this role. This doesn't reflect on your qualifications — we had many strong applicants.</p>
      <p>We encourage you to apply for future openings that match your skills and experience.</p>
      <p>We wish you the best in your job search.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">TalentFlow AI — AI-Powered HR & ATS Platform</p>
    </div>`,
};
