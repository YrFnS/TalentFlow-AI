import { z } from 'zod';

// Common schemas
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().min(1).max(100).trim();
export const phoneSchema = z.string().max(20).optional();
export const urlSchema = z.string().url().max(2048).optional();
export const idSchema = z.string().cuid().or(z.string().uuid());

// Auth schemas
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

// Job schemas
export const createJobSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(50000),
  department: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  requirements: z.string().max(10000).optional(),
  benefits: z.string().max(10000).optional(),
});

// Application schemas
export const applySchema = z.object({
  candidateId: idSchema,
  jobId: idSchema,
  coverLetter: z.string().max(10000).optional(),
});

// Chatbot schemas
export const chatbotMessageSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  sessionId: z.string().max(100).optional(),
});

// Quick apply schema
export const quickApplySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  website: z.string().max(0).optional(), // honeypot - must be empty
});

// AI chat schema
export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(5000),
  })).min(1).max(50),
  feature: z.string().max(100),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GDPR schemas
export const gdprExportSchema = z.object({
  userId: idSchema,
});

export const gdprDeleteSchema = z.object({
  requestId: idSchema,
  confirmed: z.boolean(),
});

// Stripe webhook schema (basic type check)
export const stripeWebhookSchema = z.object({
  type: z.string().min(1),
  data: z.object({}).passthrough(),
});

// Helper to validate and return typed result or error response
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
  return { success: false, error: errors };
}
