export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    authWindowMs: 15 * 60 * 1000, // 15 minutes
    authMaxRequests: 5,
    apiWindowMs: 15 * 60 * 1000,
    apiMaxRequests: 100,
    aiWindowMs: 15 * 60 * 1000,
    aiMaxRequests: 20,
    strictWindowMs: 15 * 60 * 1000,
    strictMaxRequests: 3,
    // New: Granular rate limit configurations per endpoint category
    // See RATE_LIMIT_CONFIG in rate-limiter.ts for full details
    keyStrategy: 'user-id > ip > ua-hash > fallback' as const,
    noSharedBuckets: true, // Never falls back to shared 'unknown' bucket
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false,
    bcryptRounds: 12,
  },

  // Session
  session: {
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    jwtMaxAgeMs: 24 * 60 * 60 * 1000,
  },

  // Brute force
  bruteForce: {
    maxAttemptsPerEmail: 5,
    maxAttemptsPerIP: 10,
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
  },

  // File uploads
  upload: {
    maxFileSizeMB: 5,
    allowedResumeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // CSP
  csp: {
    defaultSrc: "'self'",
    scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js needs unsafe-inline/eval
    styleSrc: "'self' 'unsafe-inline'",
    imgSrc: "'self' data: https:",
    fontSrc: "'self' data:",
    connectSrc: "'self'",
    frameSrc: "'none'",
    objectSrc: "'none'",
  },
};
