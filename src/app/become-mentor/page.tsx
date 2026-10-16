'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import { Button, Card, SectionTitle } from '@/components/ui';
import type { Mentor } from '@/lib/types';

interface ProfileData {
  mentor: Mentor | null;
}

interface FormState {
  displayName: string;
  headline: string;
  bio: string;
  companies: string;
  schools: string;
  topicTags: string;
  priceSingle: string;
  pricePackage5: string;
}

const EMPTY_FORM: FormState = {
  displayName: '',
  headline: '',
  bio: '',
  companies: '',
  schools: '',
  topicTags: '',
  priceSingle: '199',
  pricePackage5: '899',
};

export default function BecomeMentorPage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existing, setExisting] = useState<Mentor | null>(null);
  const [certName, setCertName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await apiGet<ProfileData>('/api/mentor/profile');
        if (res.mentor) {
          setExisting(res.mentor);
          setForm({
            displayName: res.mentor.displayName,
            headline: res.mentor.headline,
            bio: res.mentor.bio,
            companies: res.mentor.companies.join(','),
            schools: res.mentor.schools.join(','),
            topicTags: res.mentor.topicTags.join(','),
            priceSingle: String(res.mentor.priceSingle),
            pricePackage5: String(res.mentor.pricePackage5),
          });
        } else {
          setForm({ ...EMPTY_FORM, displayName: user.name });
        }
      } catch {
        // Ignore load errors and keep the form empty
      }
    })();
  }, [user]);

  const submit = async () => {
    if (!form.displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiSend<{ mentor: Mentor }>('/api/mentor/profile', 'POST', {
        displayName: form.displayName.trim(),
        headline: form.headline.trim(),
        bio: form.bio,
        companies: form.companies
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        schools: form.schools
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        topicTags: form.topicTags
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        priceSingle: Number(form.priceSingle) || 0,
        pricePackage5: Number(form.pricePackage5) || 0,
      });
      setExisting(res.mentor);
      setSuccess('Profile submitted — under review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slateblue-700">Loading…</p>;
  }

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-slateblue-700">
          Please sign in (switch demo accounts in the top-right corner)
        </p>
      </Card>
    );
  }

  const field =
    'mt-1 w-full rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <SectionTitle
        eyebrow="Mentor community"
        title={existing ? 'Update mentor profile' : 'Create mentor profile'}
        desc="Turn your experience into bookable support and help more women navigate their AI career transition."
      />

      {existing ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-coral-500" />
          <span className="text-xs font-bold text-slateblue-900">
            Current status:{' '}
            {existing.verificationStatus === 'pending'
              ? 'Under review'
              : existing.verificationStatus === 'seed_approved'
                ? 'Verified'
                : 'Not approved'}
          </span>
        </div>
      ) : null}

      <Card>
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">Display name</span>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="e.g. Alex Chen"
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">One-line headline</span>
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Former e-commerce operations lead, now an AI product manager"
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              placeholder="Your background, the topics you know well, the help you can offer…"
              className={`${field} resize-none`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                Companies (comma-separated)
              </span>
              <input
                value={form.companies}
                onChange={(e) => setForm({ ...form, companies: e.target.value })}
                placeholder="e.g. ByteDance, an e-commerce platform"
                className={field}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                Schools (comma-separated)
              </span>
              <input
                value={form.schools}
                onChange={(e) => setForm({ ...form, schools: e.target.value })}
                placeholder="e.g. Zhejiang University"
                className={field}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">
              Topics you know well (comma-separated)
            </span>
            <input
              value={form.topicTags}
              onChange={(e) => setForm({ ...form, topicTags: e.target.value })}
              placeholder="e.g. AI product, career-change résumé, interview coaching"
              className={field}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                Single-session price (CNY)
              </span>
              <input
                type="number"
                value={form.priceSingle}
                onChange={(e) =>
                  setForm({ ...form, priceSingle: e.target.value })
                }
                className={field}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                5-session package price (CNY)
              </span>
              <input
                type="number"
                value={form.pricePackage5}
                onChange={(e) =>
                  setForm({ ...form, pricePackage5: e.target.value })
                }
                className={field}
              />
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-silver-400 bg-silver-50 px-3 py-3">
            <p className="text-xs font-bold text-slateblue-900">Upload credentials</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-silver-300 bg-white px-3 py-1.5 text-xs font-bold text-slateblue-700 hover:bg-silver-100">
                <Upload className="h-3.5 w-3.5" />
                Choose file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setCertName(f ? f.name : '');
                  }}
                />
              </label>
              {certName ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-900">
                  <FileText className="h-3.5 w-3.5 text-coral-500" />
                  {certName}
                </span>
              ) : (
                <span className="text-xs text-slateblue-700">No file selected</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slateblue-700">
              The prototype only records the file name; nothing is actually
              uploaded.
            </p>
          </div>

          {error ? (
            <p className="text-xs font-bold text-warmred">{error}</p>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-xs font-bold text-[#3f7a4a]">
              {success}
              <Link href="/mentor/manage" className="ml-2 underline">
                Go to mentor dashboard →
              </Link>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? 'Submitting…' : existing ? 'Save changes' : 'Submit profile'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
