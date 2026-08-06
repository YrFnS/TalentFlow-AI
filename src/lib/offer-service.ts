import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const offerInclude = {
  application: {
    include: {
      candidate: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      job: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              location: true,
            },
          },
        },
      },
    },
  },
} as const;

export function parseOfferList(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Legacy values may have been stored as plain text.
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeOfferList(value?: string[] | null): string | null {
  if (!value?.length) return null;
  const normalized = value.map((item) => item.trim()).filter(Boolean);
  return normalized.length ? JSON.stringify(normalized) : null;
}

export function createOfferSigningToken(): { token: string; digest: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, digest: hashOfferSigningToken(token) };
}

export function hashOfferSigningToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function matchesOfferSigningToken(
  storedToken: string | null,
  providedToken: string,
): boolean {
  if (!storedToken || !providedToken) return false;
  const digest = hashOfferSigningToken(providedToken);
  return safeStringEqual(storedToken, digest) || safeStringEqual(storedToken, providedToken);
}

export function parseOfferDeadline(value?: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

function formatOfferMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('en-US')}`;
  }
}

/**
 * Update the application status and, when a matching company pipeline stage
 * exists, move stage history in the same database transaction.
 */
export async function setApplicationWorkflowState(
  transaction: any,
  input: {
    applicationId: string;
    companyId: string;
    status: 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
    stageTerms: string[];
  },
) {
  const application = await transaction.application.findUnique({
    where: { id: input.applicationId },
    select: { currentStageId: true },
  });
  if (!application) throw new Error('Application not found');

  const stage = input.stageTerms.length
    ? await transaction.pipelineStage.findFirst({
        where: {
          companyId: input.companyId,
          OR: input.stageTerms.map((term) => ({
            name: { contains: term, mode: 'insensitive' },
          })),
        },
        orderBy: { order: 'asc' },
        select: { id: true },
      })
    : null;

  if (stage && stage.id !== application.currentStageId) {
    await transaction.applicationStage.updateMany({
      where: { applicationId: input.applicationId, exitedAt: null },
      data: { exitedAt: new Date() },
    });
    await transaction.applicationStage.create({
      data: {
        applicationId: input.applicationId,
        stageId: stage.id,
      },
    });
  }

  return transaction.application.update({
    where: { id: input.applicationId },
    data: {
      status: input.status,
      ...(stage ? { currentStageId: stage.id } : {}),
    },
  });
}

export function buildOfferLetter(input: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  salary: number;
  salaryCurrency: string;
  startDate?: string | null;
  equity?: string | null;
  benefits?: string[];
  conditions?: string[];
  responseDeadline?: Date | null;
}): string {
  const money = formatOfferMoney(input.salary, input.salaryCurrency);

  const sections = [
    `Dear ${input.candidateName},`,
    '',
    `We are pleased to offer you the position of ${input.jobTitle} at ${input.companyName}.`,
    '',
    `Base salary: ${money} per year`,
    input.equity ? `Equity: ${input.equity}` : '',
    input.startDate ? `Proposed start date: ${input.startDate}` : '',
    input.benefits?.length
      ? `Benefits:\n${input.benefits.map((item) => `- ${item}`).join('\n')}`
      : '',
    input.conditions?.length
      ? `Conditions:\n${input.conditions.map((item) => `- ${item}`).join('\n')}`
      : '',
    input.responseDeadline
      ? `Please respond by ${input.responseDeadline.toLocaleDateString()}.`
      : '',
    '',
    'We look forward to the possibility of welcoming you to the team.',
    '',
    `Sincerely,\n${input.companyName}`,
  ];

  return sections
    .filter((line, index) => line || sections[index - 1] !== '')
    .join('\n');
}

export function serializeOffer(offer: any) {
  const application = offer.application;
  const candidate = application?.candidate;
  const job = application?.job;
  const company = job?.company;

  return {
    id: offer.id,
    applicationId: offer.applicationId,
    status: offer.status,
    signingStatus: offer.signingStatus,
    salary: offer.salary,
    salaryCurrency: offer.salaryCurrency,
    equity: offer.equity,
    startDate: offer.startDate,
    benefits: parseOfferList(offer.benefits),
    conditions: parseOfferList(offer.conditions),
    letterText: offer.letterText,
    responseDeadline: offer.responseDeadline,
    respondedAt: offer.respondedAt,
    notes: offer.notes,
    signingTokenExpiry: offer.signingTokenExpiry,
    candidateSignedAt: offer.candidateSignedAt,
    companySignedAt: offer.companySignedAt,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    application: application
      ? {
          id: application.id,
          status: application.status,
        }
      : null,
    candidate: candidate
      ? {
          id: candidate.id,
          name: candidate.user?.name || '',
          email: candidate.user?.email || '',
          image: candidate.user?.image || null,
          currentTitle: candidate.currentTitle || null,
        }
      : null,
    job: job
      ? {
          id: job.id,
          title: job.title,
          location: job.location,
          jobType: job.jobType,
        }
      : null,
    company: company
      ? {
          id: company.id,
          name: company.name,
          logo: company.logo,
          location: company.location,
        }
      : null,
  };
}

export function serializePublicOffer(offer: any) {
  const serialized = serializeOffer(offer);
  return {
    ...serialized,
    notes: undefined,
    candidate: serialized.candidate
      ? {
          id: serialized.candidate.id,
          name: serialized.candidate.name,
        }
      : null,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

export function buildOfferSignatureEmail(input: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  salary: number;
  salaryCurrency: string;
  startDate?: string | null;
  signingUrl: string;
  expiry: Date;
}): string {
  const money = formatOfferMoney(input.salary, input.salaryCurrency);

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
      <h2 style="margin:0 0 16px;color:#0f766e">Your offer from ${escapeHtml(input.companyName)}</h2>
      <p>Hello ${escapeHtml(input.candidateName)},</p>
      <p>We are pleased to offer you the position of <strong>${escapeHtml(input.jobTitle)}</strong>.</p>
      <div style="margin:20px 0;padding:16px;border:1px solid #d8e2e8;border-radius:10px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Base salary:</strong> ${escapeHtml(money)}</p>
        ${input.startDate ? `<p style="margin:0"><strong>Proposed start date:</strong> ${escapeHtml(input.startDate)}</p>` : ''}
      </div>
      <p>Please review the complete terms and respond using the secure link below.</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(input.signingUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600">Review and respond</a>
      </p>
      <p style="font-size:13px;color:#64748b">This link expires on ${escapeHtml(input.expiry.toLocaleString())}. Do not forward it.</p>
    </div>`;
}
