import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_BASE_URL_LENGTH = 2048;

function isBlockedIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0];
  if (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  ) {
    return true;
  }

  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isBlockedIpv4(mapped[1]) : false;
}

function isBlockedAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version === 6) return isBlockedIpv6(address);
  return true;
}

/**
 * Validate OpenAI-compatible provider base URLs before every outbound request.
 * This blocks local/private/link-local destinations and re-checks DNS at call
 * time so stored legacy configuration cannot bypass the protection.
 */
export async function assertSafeAIProviderBaseUrl(value: string): Promise<string> {
  if (!value || value.length > MAX_BASE_URL_LENGTH) {
    throw new Error('AI provider base URL is missing or too long');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('AI provider base URL is invalid');
  }

  if (url.protocol !== 'https:') {
    throw new Error('AI provider base URL must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('AI provider base URL must not contain credentials');
  }
  if (url.search || url.hash) {
    throw new Error('AI provider base URL must not contain a query or fragment');
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('AI provider host is not allowed');
  }

  const literalVersion = isIP(hostname);
  const addresses = literalVersion
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error('AI provider host resolves to a private or reserved address');
  }

  url.hostname = hostname;
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString().replace(/\/$/, '');
}
