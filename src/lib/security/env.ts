interface EnvConfig {
  required: string[];
  optional: string[];
  defaults: Record<string, string>;
}

function validateEnv(): void {
  const config: EnvConfig = {
    required: ['NEXTAUTH_SECRET', 'DATABASE_URL'],
    optional: [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET',
      'ENCRYPTION_KEY',
    ],
    defaults: {},
  };

  const missing = config.required.filter(key => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Using development defaults.`);
  }

  // Warn about optional variables that aren't set
  const missingOptional = config.optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(
      `Optional environment variables not set: ${missingOptional.join(', ')}. Some features may not work.`
    );
  }
}

// Call at module load time
validateEnv();
