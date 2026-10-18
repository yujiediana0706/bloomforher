// Lightweight signed-cookie sessions.
// The cookie stores a signed token carrying the user id. Server-only module
// (depends on next/headers); client components should import SESSION_COOKIE
// from '@/lib/accounts' instead.
//
// Anonymous sessions: unauthenticated visitors get a persistent anonymous uid
// so they can complete the diagnosis flow (onboarding, skill portrait,
// opportunities, plan preview) without registering. When they later sign up,
// the anonymous data is migrated to the real account.

import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, ANON_COOKIE, ANON_UID_PREFIX } from './accounts';
import { SESSION_MAX_AGE, signToken, verifyToken } from './auth';
import { randomUUID } from 'crypto';

export { SESSION_COOKIE, ANON_COOKIE, ANON_UID_PREFIX };

/** Read the current uid inside a server component / route handler. */
export function getSessionUid(): string | null {
  return verifyToken(cookies().get(SESSION_COOKIE)?.value);
}

/** Read the current uid from a route handler request.
 *  Returns the signed-in uid, or falls back to a persistent anonymous uid.
 *  Use `isAnonymousUid()` to tell them apart when an action requires a real
 *  account (e.g. booking mentors). */
export function getUidFromRequest(req: NextRequest): string | null {
  const real = verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (real) return real;
  return req.cookies.get(ANON_COOKIE)?.value || null;
}

/** True when the uid belongs to an anonymous (pre-registration) visitor. */
export function isAnonymousUid(uid: string): boolean {
  return uid.startsWith(ANON_UID_PREFIX);
}

/** Generate a fresh anonymous uid. */
export function newAnonymousUid(): string {
  return `${ANON_UID_PREFIX}${randomUUID()}`;
}

/** Attach a signed session cookie to a response. */
export function setSessionCookie(res: NextResponse, uid: string): void {
  res.cookies.set(SESSION_COOKIE, signToken(uid), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
  });
}

/** Attach (or refresh) the anonymous uid cookie on a response. */
export function setAnonymousCookie(res: NextResponse, uid: string): void {
  res.cookies.set(ANON_COOKIE, uid, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/** Clear the session cookie. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}
