'use client';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_TOKEN_TTL_MS = 55 * 60 * 1000;

let cachedCsrfToken: string | null = null;
let cachedCsrfTokenAt = 0;
let csrfRequest: Promise<string | null> | null = null;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function getCsrfToken(forceRefresh = false): Promise<string | null> {
  const isFresh =
    cachedCsrfToken && Date.now() - cachedCsrfTokenAt < CSRF_TOKEN_TTL_MS;

  if (!forceRefresh && isFresh) return cachedCsrfToken;
  if (!forceRefresh && csrfRequest) return csrfRequest;

  csrfRequest = fetch('/api/auth/csrf-token', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = (await response.json()) as { csrfToken?: string };
      cachedCsrfToken = data.csrfToken || null;
      cachedCsrfTokenAt = cachedCsrfToken ? Date.now() : 0;
      return cachedCsrfToken;
    })
    .catch(() => null)
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

async function isCsrfFailure(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;

  try {
    const data = (await response.clone().json()) as { error?: string };
    return data.error?.toLowerCase().includes('csrf') === true;
  } catch {
    return false;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const needsCsrf = STATE_CHANGING_METHODS.has(method);

  const send = async (forceRefresh = false) => {
    const headers = new Headers(init.headers || {});

    if (needsCsrf) {
      const token = await getCsrfToken(forceRefresh);
      if (!token) {
        throw new ApiError('Unable to initialize request security token', 0);
      }
      headers.set('x-csrf-token', token);
    }

    return fetch(input, {
      ...init,
      method,
      headers,
      credentials: init.credentials || 'same-origin',
    });
  };

  let response = await send(false);
  if (needsCsrf && (await isCsrfFailure(response))) {
    cachedCsrfToken = null;
    cachedCsrfTokenAt = 0;
    response = await send(true);
  }

  return response;
}

export async function getApiErrorMessage(
  response: Response,
  fallback = 'The request could not be completed',
): Promise<string> {
  try {
    const data = (await response.clone().json()) as {
      error?: string;
      message?: string;
    };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

// Start token hydration early for interactive portal pages.
if (typeof window !== 'undefined') {
  void getCsrfToken();
}
