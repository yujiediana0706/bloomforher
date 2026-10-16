'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Pages that require a signed-in user. Everything else is public.
const PROTECTED_PREFIXES = [
  '/onboarding',
  '/skills',
  '/opportunities',
  '/tasks-lab',
  '/plan',
  '/coach',
  '/dashboard',
  '/evidence',
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
    if (needsAuth && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

  return null;
}
