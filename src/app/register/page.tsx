'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/onboarding');
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/onboarding');
    } catch (err) {
      setError((err as Error).message || 'Unable to create your account.');
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
              Create your account
            </h1>
            <p className="text-xs text-slateblue-700">
              Start your AI career diagnosis from scratch — free.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slateblue-900">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm outline-none focus:border-coral-400"
              placeholder="Your name"
            />
          </div>
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
              placeholder="At least 8 characters with letters and numbers"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slateblue-900">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm outline-none focus:border-coral-400"
              placeholder="Re-enter your password"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-xs font-bold text-warmred">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slateblue-700">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-coral-600 underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
