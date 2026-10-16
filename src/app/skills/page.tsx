'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ProgressBar,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { EvidenceLevel, SkillProfile } from '@/lib/types';

const EVIDENCE_LEVEL_META: Record<EvidenceLevel, { label: string; cls: string }> = {
  verified: { label: 'Verified by evidence', cls: 'bg-emerald-100 text-emerald-800' },
  transferable: { label: 'Transferable, not yet proven in AI', cls: 'bg-coral-100 text-coral-700' },
  hypothesis: { label: 'Plausible, currently unverified', cls: 'bg-silver-200 text-slateblue-700' },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  high: { label: 'Critical gap', cls: 'border-warmred/40 bg-warmred/10 text-warmred' },
  medium: { label: 'Important', cls: 'border-coral-200 bg-coral-50 text-coral-700' },
  low: { label: 'Nice to have', cls: 'border-silver-300 bg-silver-50 text-slateblue-700' },
};

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
  if (!user) return <EmptyState text="Please sign in first to view your skill portrait." />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Back link */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-700 underline underline-offset-4 hover:text-coral-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to AI Mentor
      </Link>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-coral-500">
          See · Skill portrait
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          Your skill portrait
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          What your experience actually demonstrates. Each strength below is
          tied to evidence; the gaps are real items worth building, not praise.
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
            <h3 className="mb-1 text-sm font-extrabold text-slateblue-900">
              Strengths, with evidence levels ({skillProfile.transferableSkills.length})
            </h3>
            <p className="mb-2 text-xs text-slateblue-700">
              <span className="font-bold text-emerald-700">Verified</span> means
              demonstrated in your actual experience;{' '}
              <span className="font-bold text-coral-700">transferable</span>{' '}
              means relevant but not yet proven in an AI setting;{' '}
              <span className="font-bold text-slateblue-700">unverified</span>{' '}
              means plausible and still to be tested.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {skillProfile.transferableSkills.map((skill) => {
                const level = skill.evidenceLevel ?? 'hypothesis';
                const meta = EVIDENCE_LEVEL_META[level];
                return (
                  <Card key={skill.id} className="flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-extrabold text-slateblue-900">
                        {skill.name}
                      </h4>
                      <span className="shrink-0 rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-black text-coral-700">
                        AI relevance {skill.aiRelevance}%
                      </span>
                    </div>
                    <span
                      className={`mt-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
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
                );
              })}
            </div>
          </section>

          {/* Real skill gaps */}
          {skillProfile.skillGaps && skillProfile.skillGaps.length > 0 ? (
            <section>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-extrabold text-slateblue-900">
                <AlertTriangle className="h-4 w-4 text-warmred" />
                Real skill gaps
              </h3>
              <p className="mb-2 text-xs text-slateblue-700">
                These are the gaps that actually stand between your current
                evidence and the directions you are considering, ordered by
                impact.
              </p>
              <div className="space-y-2.5">
                {skillProfile.skillGaps.map((gap, idx) => {
                  const meta = PRIORITY_META[gap.priority] ?? PRIORITY_META.medium;
                  return (
                    <Card key={idx} className="border-silver-300">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-extrabold text-slateblue-900">
                          {gap.skill}
                        </h4>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slateblue-700">
                        {gap.why}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Confidence calibration board */}
          <section>
            <h3 className="mb-1 text-sm font-extrabold text-slateblue-900">
              Confidence calibration board
            </h3>
            <p className="mb-2 text-xs text-slateblue-700">
              The grey bar is your self-assessment; the coral bar is the
              evidence-based calibration. It may be higher, equal, or lower than
              yours — the point is accuracy, not reassurance.
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

          {/* Forward CTA: pick one path */}
          <Card className="flex flex-col items-start gap-3 border-coral-300 bg-gradient-to-br from-softpink-100 to-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-slateblue-900">
                Next: pick one path
              </p>
              <p className="mt-0.5 text-xs text-slateblue-700">
                See which directions fit your strongest evidence, choose one,
                and get a concrete four-week plan built around its gaps.
              </p>
            </div>
            <Link
              href="/opportunities"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-coral-500 px-6 py-3 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-coral-600"
            >
              Choose my path
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </>
      ) : null}
    </div>
  );
}
