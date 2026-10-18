// Server-only authentication helpers: password hashing (scrypt) and signed
// session tokens (HMAC-SHA256). Never import this module from a client
// component — it reads secrets from the server environment.

import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

// Fallback secret for local development only. In production AUTH_SECRET must be
// set (Cloud Run injects it via environment variables).
const DEV_SECRET = 'herrise-dev-secret-change-me';

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === 'production') {
    console.warn('[auth] AUTH_SECRET is not set; using insecure fallback.');
  }
  return DEV_SECRET;
}

const KEY_LEN = 64;

export interface PasswordHash {
  salt: string;
  hash: string;
}

/** Hash a plaintext password with a fresh random salt. */
export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex');
  return { salt, hash };
}

/** Constant-time verification of a plaintext password against a stored hash. */
export function verifyPassword(
  password: string,
  stored: PasswordHash
): boolean {
  try {
    const candidate = scryptSync(password, stored.salt, KEY_LEN);
    const expected = Buffer.from(stored.hash, 'hex');
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return createHmac('sha256', authSecret()).update(payload).digest('base64url');
}

/** Create a signed session token embedding the user id. */
export function signToken(uid: string): string {
  const payload = Buffer.from(uid, 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token and return the embedded uid, or null if invalid. */
export function verifyToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Returns an English error message when the password is too weak, else null. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain both letters and numbers.';
  }
  return null;
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
