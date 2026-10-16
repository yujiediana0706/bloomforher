'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [next, setNext] = useState('/onboarding');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get('next') || '/onboarding');
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-500 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold text-slateblue-900">
              Welcome back
            </h1>
            <p className="text-xs text-slateblue-700">
              Sign in to continue your career journey.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slateblue-900">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm outline-none focus:border-coral-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slateblue-900">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm outline-none focus:border-coral-400"
              placeholder="Your password"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-xs font-bold text-warmred">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slateblue-700">
          New to ReBloom?{' '}
          <Link
            href="/register"
            className="font-bold text-coral-600 underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
