// Lightweight signed-cookie sessions.
// The cookie stores a signed token carrying the user id. Server-only module
// (depends on next/headers); client components should import SESSION_COOKIE
// from '@/lib/accounts' instead.

import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from './accounts';
import { SESSION_MAX_AGE, signToken, verifyToken } from './auth';

export { SESSION_COOKIE };

/** Read the current uid inside a server component / route handler. */
export function getSessionUid(): string | null {
  return verifyToken(cookies().get(SESSION_COOKIE)?.value);
}

/** Read the current uid from a route handler request. */
export function getUidFromRequest(req: NextRequest): string | null {
  return verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
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

/** Clear the session cookie. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}
