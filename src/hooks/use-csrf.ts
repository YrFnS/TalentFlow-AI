// @ts-nocheck
"use client";

import { useState, useCallback, useEffect, useRef } from "react";

let cachedToken: string | null = null;
let tokenExpiry = 0;
let initPromise: Promise<string | null> | null = null;

/**
 * Eagerly fetch a CSRF token. Called once on module load so the token
 * is available by the time components first render.
 */
function initCsrfToken(): Promise<string | null> {
	if (cachedToken && Date.now() < tokenExpiry - 300000) {
		return Promise.resolve(cachedToken);
	}
	if (!initPromise) {
		initPromise = fetch("/api/auth/csrf-token")
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.csrfToken) {
					cachedToken = data.csrfToken;
					tokenExpiry = Date.now() + 60 * 60 * 1000;
				}
				initPromise = null;
				return cachedToken;
			})
			.catch(() => {
				initPromise = null;
				return null;
			});
	}
	return initPromise;
}

// Eagerly initialize CSRF token when module loads
initCsrfToken();

/**
 * Hook to access and refresh a CSRF token for state-changing API requests.
 *
 * The token is eagerly fetched on module load, so it is usually available
 * by the time the component first renders. Call `refreshToken()` to force
 * a refresh (e.g. after a 403 CSRF error).
 *
 * Usage:
 * ```tsx
 * const { csrfToken, refreshToken } = useCsrf();
 *
 * const res = await fetch('/api/jobs', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCsrf() {
	const [csrfToken, setCsrfToken] = useState<string | null>(cachedToken);
	const fetchingRef = useRef(false);

	useEffect(() => {
		let active = true;
		initCsrfToken().then((token) => {
			if (active) setCsrfToken(token);
		});
		return () => {
			active = false;
		};
	}, []);

	const refreshToken = useCallback(async (): Promise<string | null> => {
		if (fetchingRef.current) {
			return cachedToken;
		}

		fetchingRef.current = true;
		try {
			const response = await fetch("/api/auth/csrf-token");
			if (response.ok) {
				const data = await response.json();
				cachedToken = data.csrfToken;
				tokenExpiry = Date.now() + 60 * 60 * 1000;
				setCsrfToken(cachedToken);
				return cachedToken;
			}
		} catch (error) {
			console.error("Failed to refresh CSRF token:", error);
		} finally {
			fetchingRef.current = false;
		}
		return null;
	}, []);

	return { csrfToken, refreshToken };
}

/**
 * Helper to add CSRF token to fetch headers
 *
 * @param headers - Existing headers (can be HeadersInit or plain object)
 * @param token - The CSRF token string (or null if not yet available)
 * @returns Headers object with the CSRF token included
 */
export function withCsrf(
	headers: HeadersInit = {},
	token: string | null,
): Headers {
	const h = headers instanceof Headers ? headers : new Headers(headers);
	if (token) {
		h.set("x-csrf-token", token);
	}
	return h;
}
