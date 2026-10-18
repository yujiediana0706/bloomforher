'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Pages that require a signed-in (real) account.
// The diagnosis flow (onboarding → skills → opportunities → plan → evidence)
// is intentionally public so visitors can complete it and see a preview before
// registering. The AI Mentor, dashboard, sessions and mentor flows require an
// account.
const PROTECTED_PREFIXES = [
  '/coach',
  '/dashboard',
  '/my-sessions',
  '/mentor/manage',
  '/become-mentor',
];

export function AuthGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const needsAuth = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    // Anonymous visitors (deferred registration) have a profile but no real
    // account — send them to sign up, carrying the page they wanted.
    const signedIn = !!user && !user.anonymous;
    if (needsAuth && !signedIn) {
      router.replace(`/register?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

  return null;
}
