// @ts-nocheck
'use client';

import { useCallback, useRef } from 'react';

/**
 * Get the CSP nonce from the server-provided meta tag.
 *
 * The middleware sets the nonce as a custom response header `x-csp-nonce`,
 * and the root layout renders it as a `<meta name="csp-nonce">` tag.
 * Client components can use this hook to add nonce attributes to
 * dynamically created script tags, ensuring they pass CSP validation.
 *
 * Example usage:
 * ```tsx
 * const getCspNonce = useCspNonce();
 * <script nonce={getCspNonce()} src="/external.js" />
 * ```
 */
export function useCspNonce(): () => string {
  const cachedNonce = useRef<string | null>(null);

  const getNonce = useCallback(() => {
    if (cachedNonce.current !== null) {
      return cachedNonce.current;
    }
    // Read nonce from meta tag set by the root layout
    if (typeof document !== 'undefined') {
      const metaTag = document.querySelector('meta[name="csp-nonce"]');
      if (metaTag) {
        cachedNonce.current = metaTag.getAttribute('content') || '';
        return cachedNonce.current;
      }
    }
    return '';
  }, []);

  return getNonce;
}
