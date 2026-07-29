import { z } from 'zod';

export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().min(1).max(100).trim();
export const phoneSchema = z.string().max(20).optional();
export const urlSchema = z.string().url().max(2048).optional();
export const idSchema = z.string().cuid().or(z.string().uuid());

const optionalNonNegativeInt = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  },
  z.number().int().nonnegative().optional(),
);

const optionalDateString = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().datetime({ offset: true }).or(z.string().date()).optional(),
);

const stringListSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  },
  z.array(z.string().trim().min(1).max(1000)).max(100).optional(),
);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['CANDIDATE', 'COMPANY', 'ADMIN']),
  companyName: z.string().max(200).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const jobPayloadSchema = z.object({
    companyId: idSchema.optional(),
    title: z.string().min(1).max(200).trim(),
    description: z.string().min(1).max(50000),
    department: z.string().max(100).optional(),
    location: z.string().trim().max(200).optional(),
    jobType: z
      .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'HYBRID'])
      .optional(),
    type: z
      .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'HYBRID'])
      .optional(),
    status: z.enum(['DRAFT', 'OPEN']).optional(),
    salaryMin: optionalNonNegativeInt,
    salaryMax: optionalNonNegativeInt,
    salaryCurrency: z.string().trim().min(3).max(8).optional(),
    requirements: stringListSchema,
    responsibilities: stringListSchema,
    benefits: stringListSchema,
    skills: stringListSchema,
    isRemote: z.boolean().optional(),
    experienceMin: optionalNonNegativeInt,
    experienceMax: optionalNonNegativeInt,
    openings: optionalNonNegativeInt,
    deadline: optionalDateString,
  });

function validateJobRanges(
  value: {
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    openings?: number;
  },
  ctx: z.RefinementCtx,
) {
    if (
      value.salaryMin !== undefined &&
      value.salaryMax !== undefined &&
      value.salaryMax < value.salaryMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMax'],
        message: 'salaryMax must be greater than or equal to salaryMin',
      });
    }

    if (
      value.experienceMin !== undefined &&
      value.experienceMax !== undefined &&
      value.experienceMax < value.experienceMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['experienceMax'],
        message: 'experienceMax must be greater than or equal to experienceMin',
      });
    }

  if (value.openings !== undefined && value.openings < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['openings'],
      message: 'openings must be at least 1',
    });
  }
}

export const createJobSchema = jobPayloadSchema.superRefine(validateJobRanges);

export const updateJobSchema = jobPayloadSchema
  .partial()
  .extend({
    id: idSchema.optional(),
    status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'ARCHIVED']).optional(),
  })
  .superRefine(validateJobRanges);

export const applySchema = z.object({
  jobId: idSchema,
  coverLetter: z.string().max(10000).optional(),
  source: z.string().trim().max(100).optional(),
});

export const applicationUpdateSchema = z.object({
  id: idSchema,
  status: z
    .enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  currentStageId: idSchema.nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
});

export const companyApplicationCreateSchema = z.object({
  jobId: idSchema,
  candidateId: idSchema,
  coverLetter: z.string().max(10000).optional(),
  source: z.string().trim().max(100).optional(),
});

export const savedJobMutationSchema = z.object({
  jobId: idSchema,
  action: z.enum(['save', 'remove']).default('save'),
});

export const pipelineStageCreateSchema = z.object({
  companyId: idSchema.optional(),
  name: z.string().trim().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const interviewCreateSchema = z.object({
  applicationId: idSchema,
  type: z.enum(['PHONE', 'VIDEO', 'ON_SITE', 'ASYNC_VIDEO']),
  scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'scheduledAt must be a valid date and time',
  }),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(30),
  interviewerId: idSchema.optional(),
  notes: z.string().max(10000).optional(),
  location: z.string().max(500).optional(),
  meetingLink: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().url().max(2048).optional(),
  ),
});

export const interviewUpdateSchema = z.object({
  interviewId: idSchema,
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  feedback: z.string().max(20000).nullable().optional(),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional(),
});

export const chatbotMessageSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  sessionId: z.string().max(100).optional(),
});

export const quickApplySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  website: z.string().max(0).optional(),
});

export const aiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(5000),
      }),
    )
    .min(1)
    .max(50),
  feature: z.string().max(100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const gdprExportSchema = z.object({ userId: idSchema });

export const gdprDeleteSchema = z.object({
  requestId: idSchema,
  confirmed: z.boolean(),
});

export const stripeWebhookSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  data: z.object({}).passthrough(),
});

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const errors = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join(', ');
  return { success: false, error: errors };
}
