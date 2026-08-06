import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aiLimiter,
  apiLimiter,
  authLimiter,
  getLimiterForPath,
  strictLimiter,
} from '../src/lib/security/rate-limiter.ts';

test('only credential submissions consume the login budget', () => {
  assert.equal(getLimiterForPath('/api/auth/callback/credentials'), authLimiter);
  assert.equal(getLimiterForPath('/api/auth/providers'), apiLimiter);
  assert.equal(getLimiterForPath('/api/auth/csrf-token'), apiLimiter);
  assert.equal(getLimiterForPath('/api/auth/session'), apiLimiter);
  assert.equal(getLimiterForPath('/api/auth/_log'), apiLimiter);
});

test('sensitive and AI routes retain their dedicated limits', () => {
  assert.equal(getLimiterForPath('/api/auth/register'), strictLimiter);
  assert.equal(getLimiterForPath('/api/auth/forgot-password'), strictLimiter);
  assert.equal(getLimiterForPath('/api/ai/chat'), aiLimiter);
});
