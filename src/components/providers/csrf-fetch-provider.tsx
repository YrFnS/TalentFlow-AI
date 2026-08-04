'use client';

import { useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return 'GET';
}

function isSameOrigin(input: RequestInfo | URL): boolean {
  try {
    const raw =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.toString()
          : String(input);
    return new URL(raw, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Transparently protects legacy client mutations that still call `fetch`
 * directly. New code should continue using `apiFetch` explicitly.
 */
export function CsrfFetchProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const previousFetch = window.fetch;

    const protectedFetch: typeof window.fetch = async (input, init) => {
      const method = requestMethod(input, init);
      if (STATE_CHANGING_METHODS.has(method) && isSameOrigin(input)) {
        return apiFetch(input, init);
      }
      return previousFetch.call(window, input, init);
    };

    window.fetch = protectedFetch;
    return () => {
      if (window.fetch === protectedFetch) window.fetch = previousFetch;
    };
  }, []);

  return children;
}
