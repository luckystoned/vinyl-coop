// api/_lib/auth.ts
import crypto from 'node:crypto';
import { ensureEnvLoaded } from './env';

ensureEnvLoaded();

const SESSION_COOKIE_NAME = 'vc_session';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

// Simple in-memory rate limiter for login attempts
const failedAttempts: Record<string, { count: number; lockedUntil: number }> = {};

export function checkRateLimit(ip: string): { allowed: boolean; remainingSec?: number } {
  const now = Date.now();
  const record = failedAttempts[ip];
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }

  // Lock expired
  if (record.lockedUntil <= now && record.count >= 5) {
    delete failedAttempts[ip];
  }

  return { allowed: true };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const record = failedAttempts[ip] || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 60 * 1000; // Lock for 60 seconds after 5 failed attempts
  }
  failedAttempts[ip] = record;
}

export function recordLoginSuccess(ip: string): void {
  delete failedAttempts[ip];
}

function getSecret(): string {
  return process.env.SESSION_SECRET || 'default-dev-vinyl-coop-session-secret-key-32b';
}

/**
 * Signs a session string with HMAC SHA-256.
 */
export function signSession(payload: string): string {
  const secret = getSecret();
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

/**
 * Verifies a signed session string.
 */
export function verifySessionToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;
  const lastDot = token.lastIndexOf('.');
  const payload = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);

  const secret = getSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

/**
 * Extracts and verifies session cookie from a Request or Node HTTP request.
 */
export function isRequestAuthenticated(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;

  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return false;

  return verifySessionToken(token);
}

export function createSessionCookie(): string {
  const payload = `auth_${Date.now()}`;
  const signed = signSession(payload);
  const isProd = process.env.NODE_ENV === 'production';

  const parts = [
    `${SESSION_COOKIE_NAME}=${signed}`,
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (isProd) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function createLogoutCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isProd) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      list[name] = decodeURIComponent(val);
    }
  });
  return list;
}
