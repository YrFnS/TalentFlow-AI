import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Use a proper derivation salt (not a static 'salt' string)
const DERIVATION_SALT = 'tf-enc-v1-9f3a7c2e1b5d';

// Cache the key once derived
let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: ENCRYPTION_KEY environment variable is not set. ' +
        'Refusing to use insecure fallback in production. ' +
        'Generate a 32-byte hex key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    // Development fallback only — log a clear warning
    console.warn(
      '⚠️ SECURITY WARNING: ENCRYPTION_KEY is not set. Using insecure development fallback key. ' +
      'This MUST NOT be used in production. Set the ENCRYPTION_KEY environment variable with a 32-byte hex key.'
    );
    cachedKey = crypto.scryptSync('talentflow-dev-key', DERIVATION_SALT, 32);
    return cachedKey;
  }

  cachedKey = Buffer.from(key, 'hex');

  // Validate key length
  if (cachedKey.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Got ${cachedKey.length} bytes. ` +
      'Generate a proper key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  return cachedKey;
}

/**
 * Startup check to verify encryption is properly configured.
 * Call this early in the application lifecycle (e.g., in layout or middleware).
 * Throws in production if ENCRYPTION_KEY is missing.
 */
export function checkEncryptionConfig(): { configured: boolean; warning?: string } {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: ENCRYPTION_KEY environment variable is not set. ' +
        'Application cannot start without proper encryption configuration in production.'
      );
    }
    return {
      configured: false,
      warning: 'ENCRYPTION_KEY is not set. Using insecure development fallback. Do NOT deploy to production without setting ENCRYPTION_KEY.',
    };
  }

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    return {
      configured: false,
      warning: `ENCRYPTION_KEY is ${keyBuffer.length} bytes, expected 32 bytes (64 hex characters). Encryption may not work correctly.`,
    };
  }

  return { configured: true };
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function isEncrypted(value: string): boolean {
  // Check if the value matches our encryption format (iv:tag:encrypted)
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}
