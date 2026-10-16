'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ProgressBar,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { SkillProfile } from '@/lib/types';

function ScoreBar({ value, tone }: { value: number; tone: 'self' | 'ai' }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-silver-300 bg-silver-100">
      <div
        className={`h-full rounded-full transition-all ${
          tone === 'ai' ? 'bg-coral-500' : 'bg-silver-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SkillsPage() {
  const { user, loading } = useAuth();
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const data = await apiGet<{ skillProfile: SkillProfile | null }>(
        '/api/skills'
      );
      setSkillProfile(data.skillProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const data = await apiSend<{ skillProfile: SkillProfile }>(
        '/api/skills',
        'POST'
      );
      setSkillProfile(data.skillProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <EmptyState text="Loading…" />;
  if (!user)
    return (
      <EmptyState text="Please sign in first (you can switch demo accounts from the top-right menu)." />
    );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Back link */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-700 underline underline-offset-4 hover:text-coral-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to AI Mentor workspace
      </Link>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-coral-500">
          Diagnostic details · Skill discovery
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          Your skill profile
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          Translate your past experience into the language of AI workflows, and
          recalibrate your confidence.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="Loading your skill profile…" /> : null}

      {!fetching && !skillProfile ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            You don&apos;t have a skill profile yet. Click the button below and
            the AI will generate one from your profile.
          </p>
          <Button className="mt-4" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate my skill profile
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {skillProfile ? (
        <>
          {/* Unique value */}
          <Card className="border-softpink-300 bg-gradient-to-br from-softpink-100 to-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-coral-500">
              Your unique value
            </p>
            <p className="mt-2 text-base font-extrabold leading-relaxed text-slateblue-900">
              {skillProfile.uniqueValue}
            </p>
          </Card>

          {/* Transferable skills */}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slateblue-900">
              Transferable skills ({skillProfile.transferableSkills.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {skillProfile.transferableSkills.map((skill) => (
                <Card key={skill.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slateblue-900">
                      {skill.name}
                    </h4>
                    <span className="shrink-0 rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-black text-coral-700">
                      AI relevance {skill.aiRelevance}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={skill.aiRelevance} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-coral-700">
                    Evidence: {skill.evidence}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slateblue-700">
                    {skill.narrative}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* Confidence calibration board */}
          <section>
            <h3 className="mb-1 text-sm font-extrabold text-slateblue-900">
              Confidence calibration board
            </h3>
            <p className="mb-2 text-xs text-slateblue-700">
              The grey bar is your self-assessment; the coral bar is the AI&apos;s
              evidence-based score.
            </p>
            <div className="space-y-2.5">
              {skillProfile.confidenceCalibration.map((item) => (
                <Card key={item.dimension}>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slateblue-900">
                      {item.dimension}
                    </h4>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-slateblue-700">
                        Self {item.selfScore}/10
                      </span>
                      <span className="text-coral-600">
                        AI {item.aiScore}/10
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-[10px] font-bold text-slateblue-700">
                        Self
                      </span>
                      <ScoreBar value={item.selfScore} tone="self" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-[10px] font-bold text-coral-600">
                        AI
                      </span>
                      <ScoreBar value={item.aiScore} tone="ai" />
                    </div>
                  </div>
                  <p className="mt-2 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2 text-xs leading-relaxed text-coral-700">
                    {item.evidenceRef}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
