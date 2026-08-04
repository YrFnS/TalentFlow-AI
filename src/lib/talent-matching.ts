import { db } from '@/lib/db';

export type TalentAvailability =
  | 'available'
  | 'open_to_work'
  | 'not_available';

export interface TalentCriteria {
  skills: string[];
  experienceMin?: number;
  experienceMax?: number;
  location?: string;
  jobTitle?: string;
}

export interface TalentCandidate {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  currentTitle: string;
  location: string;
  experienceYears: number;
  skills: string[];
  matchScore: number;
  lastActive: string;
  matchReasons: string[];
  appliedBefore: string;
  availability: TalentAvailability;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
  previousApplications: Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    status: string;
    stage: string | null;
    appliedAt: string;
    updatedAt: string;
  }>;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

function text(value: unknown, maximum = 200): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().slice(0, maximum);
  return normalized || undefined;
}

function stringList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return [...new Set(
    source
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().slice(0, 100))
      .filter(Boolean),
  )].slice(0, 40);
}

export function normalizeTalentCriteria(value: unknown): TalentCriteria {
  const input =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};

  const experience = boundedInteger(input.experience, 0, 80);
  const experienceMin =
    boundedInteger(input.experienceMin, 0, 80) ?? experience;
  const experienceMax = boundedInteger(input.experienceMax, 0, 80);

  return {
    skills: stringList(input.skills),
    experienceMin,
    experienceMax:
      experienceMax !== undefined &&
      experienceMin !== undefined &&
      experienceMax < experienceMin
        ? experienceMin
        : experienceMax,
    location: text(input.location),
    jobTitle: text(input.jobTitle),
  };
}

export function parseStoredStringList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return stringList(parsed);
  } catch {
    return stringList(value);
  }
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function tokenize(value: string): string[] {
  return [...new Set(
    normalized(value)
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter((token) => token.length >= 2),
  )];
}

function skillsMatch(candidateSkill: string, desiredSkill: string): boolean {
  const candidate = normalized(candidateSkill);
  const desired = normalized(desiredSkill);
  return candidate === desired || candidate.includes(desired) || desired.includes(candidate);
}

function normalizeAvailability(value: string | null): TalentAvailability {
  const availability = normalized(value || 'open');
  if (
    availability.includes('not') ||
    availability.includes('unavailable') ||
    availability.includes('closed')
  ) {
    return 'not_available';
  }
  if (
    availability.includes('available') ||
    availability.includes('immediate')
  ) {
    return 'available';
  }
  return 'open_to_work';
}

function confidence(score: number): TalentCandidate['confidence'] {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function calculateMatch(params: {
  candidateSkills: string[];
  experienceYears: number;
  location: string;
  currentTitle: string;
  availability: TalentAvailability;
  latestStatus: string;
  latestStage: string | null;
  criteria: TalentCriteria;
}) {
  const {
    candidateSkills,
    experienceYears,
    location,
    currentTitle,
    availability,
    latestStatus,
    latestStage,
    criteria,
  } = params;

  const reasons: string[] = [];
  let score = 0;

  if (criteria.skills.length > 0) {
    const matchedSkills = criteria.skills.filter((desired) =>
      candidateSkills.some((candidate) => skillsMatch(candidate, desired)),
    );
    score += Math.round((matchedSkills.length / criteria.skills.length) * 55);
    if (matchedSkills.length > 0) {
      reasons.push(`Skills: ${matchedSkills.slice(0, 3).join(', ')}`);
    }
  } else {
    score += 25;
  }

  if (
    criteria.experienceMin !== undefined ||
    criteria.experienceMax !== undefined
  ) {
    const minimum = criteria.experienceMin ?? 0;
    const maximum = criteria.experienceMax ?? Number.POSITIVE_INFINITY;
    if (experienceYears >= minimum && experienceYears <= maximum) {
      score += 20;
      reasons.push(`${experienceYears} years experience`);
    } else {
      const distance =
        experienceYears < minimum
          ? minimum - experienceYears
          : experienceYears - maximum;
      score += Math.max(0, 20 - Math.round(distance * 4));
    }
  } else {
    score += 10;
  }

  if (criteria.location) {
    const candidateLocation = normalized(location);
    const desiredLocation = normalized(criteria.location);
    if (
      candidateLocation.includes(desiredLocation) ||
      desiredLocation.includes(candidateLocation)
    ) {
      score += 10;
      reasons.push(`Location: ${location}`);
    }
  } else {
    score += 5;
  }

  if (criteria.jobTitle) {
    const desiredTokens = tokenize(criteria.jobTitle);
    const candidateTokens = tokenize(currentTitle);
    const matches = desiredTokens.filter((token) =>
      candidateTokens.some(
        (candidateToken) =>
          candidateToken === token ||
          candidateToken.includes(token) ||
          token.includes(candidateToken),
      ),
    );
    if (desiredTokens.length > 0) {
      score += Math.round((matches.length / desiredTokens.length) * 10);
    }
    if (matches.length > 0) reasons.push(`Title fit: ${currentTitle}`);
  } else {
    score += 5;
  }

  if (availability === 'available') {
    score += 7;
    reasons.push('Available now');
  } else if (availability === 'open_to_work') {
    score += 5;
    reasons.push('Open to opportunities');
  } else {
    score -= 20;
  }

  if (latestStatus === 'OFFERED' || latestStatus === 'INTERVIEW') {
    score += 5;
    reasons.push(`Previous progress: ${latestStage || latestStatus}`);
  } else if (latestStatus === 'SCREENING') {
    score += 3;
  } else if (latestStatus === 'WITHDRAWN') {
    score -= 5;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));
  const matchReasons = reasons.slice(0, 5);
  return {
    score: finalScore,
    reasons: matchReasons,
    reasoning:
      matchReasons.length > 0
        ? matchReasons.join('; ')
        : 'Previously engaged with this company; no additional criteria were supplied.',
  };
}

export async function findCompanyTalent(params: {
  companyId: string;
  criteria: TalentCriteria;
  excludeJobId?: string;
  limit?: number;
}): Promise<TalentCandidate[]> {
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));

  const applications = await db.application.findMany({
    where: { job: { companyId: params.companyId } },
    select: {
      id: true,
      candidateId: true,
      jobId: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
      currentStage: { select: { name: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 2000,
  });

  const histories = new Map<string, typeof applications>();
  for (const application of applications) {
    const history = histories.get(application.candidateId) || [];
    history.push(application);
    histories.set(application.candidateId, history);
  }

  const candidateIds = [...histories.keys()];
  if (candidateIds.length === 0) return [];

  const profiles = await db.candidateProfile.findMany({
    where: { id: { in: candidateIds } },
    select: {
      id: true,
      userId: true,
      currentTitle: true,
      location: true,
      experienceYears: true,
      skills: true,
      availability: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          isActive: true,
        },
      },
    },
  });

  const candidates: TalentCandidate[] = [];

  for (const profile of profiles) {
    if (!profile.user.isActive) continue;
    const history = histories.get(profile.id) || [];
    if (history.length === 0) continue;
    if (history.some((application) => application.status === 'HIRED')) continue;
    if (
      params.excludeJobId &&
      history.some((application) => application.jobId === params.excludeJobId)
    ) {
      continue;
    }

    const latest = history[0];
    const availability = normalizeAvailability(profile.availability);
    const skills = parseStoredStringList(profile.skills);
    const currentTitle = profile.currentTitle || 'Candidate';
    const location = profile.location || 'Not specified';
    const experienceYears = profile.experienceYears || 0;
    const match = calculateMatch({
      candidateSkills: skills,
      experienceYears,
      location,
      currentTitle,
      availability,
      latestStatus: latest.status,
      latestStage: latest.currentStage?.name || null,
      criteria: params.criteria,
    });

    const latestActivity =
      profile.updatedAt > latest.updatedAt ? profile.updatedAt : latest.updatedAt;

    candidates.push({
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      email: profile.user.email,
      image: profile.user.image,
      currentTitle,
      location,
      experienceYears,
      skills,
      matchScore: match.score,
      lastActive: latestActivity.toISOString(),
      matchReasons: match.reasons,
      appliedBefore: `${latest.job.title} — ${latest.appliedAt.toLocaleDateString()}`,
      availability,
      confidence: confidence(match.score),
      reasoning: match.reasoning,
      previousApplications: history.slice(0, 10).map((application) => ({
        id: application.id,
        jobId: application.jobId,
        jobTitle: application.job.title,
        status: application.status,
        stage: application.currentStage?.name || null,
        appliedAt: application.appliedAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      })),
    });
  }

  return candidates
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }
      return Date.parse(right.lastActive) - Date.parse(left.lastActive);
    })
    .slice(0, limit);
}
