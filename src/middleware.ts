import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ANON_COOKIE, ANON_UID_PREFIX } from '@/lib/accounts';

/**
 * Ensures every visitor has a stable identity before they register.
 * - If the user has a real session cookie, they are signed in: pass through.
 * - Otherwise, issue (or refresh) an anonymous uid cookie so the diagnosis
 *   flow (onboarding → skills → opportunities → plan) can be completed
 *   without an account. The anonymous data is migrated on sign-up.
 *
 * Note: middleware only checks for the *presence* of the session cookie;
 * signature verification happens server-side in the route handlers.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const hasRealSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  if (hasRealSession) return res;

  let anonUid = req.cookies.get(ANON_COOKIE)?.value;
  if (!anonUid || !anonUid.startsWith(ANON_UID_PREFIX)) {
    anonUid = `${ANON_UID_PREFIX}${crypto.randomUUID()}`;
    res.cookies.set(ANON_COOKIE, anonUid, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return res;
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next internals.
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)$).*)',
  ],
};
