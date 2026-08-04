'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCsrfToken } from '@/lib/api-client';

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCsrfToken().then((token) => {
      if (active) setCsrfToken(token);
    });
    return () => {
      active = false;
    };
  }, []);

  const refreshToken = useCallback(async () => {
    const token = await getCsrfToken(true);
    setCsrfToken(token);
    return token;
  }, []);

  return { csrfToken, refreshToken };
}

export function withCsrf(
  headers: HeadersInit = {},
  token: string | null,
): Headers {
  const result = new Headers(headers);
  if (token) result.set('x-csrf-token', token);
  return result;
}
