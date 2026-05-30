/**
 * Nonce Generation Utility for Content Security Policy
 *
 * Generates cryptographically secure nonces for CSP script-src directives.
 * Nonces are cached per-process and rotated every 5 minutes to balance
 * security (frequent rotation) with performance (avoid regenerating on every request).
 *
 * Uses Web Crypto API for Edge Runtime compatibility (Next.js middleware runs in Edge).
 *
 * Usage:
 *   import { generateNonce } from '@/lib/security/nonce';
 *   const nonce = generateNonce();
 *   // Use in CSP: script-src 'self' 'nonce-{nonce}'
 *   // Use in HTML: <script nonce="{nonce}">...</script>
 */

let cachedNonce: string | null = null;
let nonceExpiry = 0;
const NONCE_ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cryptographically secure nonce for CSP.
 * Cached for performance but rotated periodically to limit exposure window.
 *
 * Uses the Web Crypto API (crypto.getRandomValues) which is available
 * in both Node.js and Edge Runtime environments.
 *
 * @returns A base64-encoded random string suitable for use in CSP nonce directives
 */
export function generateNonce(): string {
  const now = Date.now();
  if (cachedNonce && now < nonceExpiry) {
    return cachedNonce;
  }
  // Web Crypto API - works in both Node.js and Edge Runtime
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  cachedNonce = btoa(String.fromCharCode(...bytes));
  nonceExpiry = now + NONCE_ROTATION_INTERVAL;
  return cachedNonce;
}

/**
 * Force regeneration of the nonce on next call.
 * Useful after security events or when manual rotation is needed.
 */
export function invalidateNonce(): void {
  cachedNonce = null;
  nonceExpiry = 0;
}

/**
 * Get the current rotation interval in milliseconds.
 * Useful for monitoring and debugging.
 */
export function getNonceRotationInterval(): number {
  return NONCE_ROTATION_INTERVAL;
}
