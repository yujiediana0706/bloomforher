'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { OpportunityReport, RoleMatch, SkillProfile } from '@/lib/types';

function matchBadge(score: number): { label: string; cls: string } {
  if (score >= 90)
    return { label: 'High match', cls: 'bg-emerald-100 text-emerald-800' };
  if (score >= 75)
    return { label: 'Strong match', cls: 'bg-coral-100 text-coral-700' };
  return { label: 'Worth exploring', cls: 'bg-silver-200 text-slateblue-700' };
}

function looseIncludes(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const [opp, skills] = await Promise.all([
        apiGet<{ opportunityReport: OpportunityReport | null }>(
          '/api/opportunities'
        ),
        apiGet<{ skillProfile: SkillProfile | null }>('/api/skills').catch(
          () => ({ skillProfile: null })
        ),
      ]);
      setReport(opp.opportunityReport);
      setSkillProfile(skills.skillProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  // Preselect a previously chosen direction.
  useEffect(() => {
    if (report && user?.chosenRole && !selectedId) {
      const hit = report.roleMatches.find((r) => r.title === user.chosenRole);
      if (hit) setSelectedId(hit.id);
    }
  }, [report, user, selectedId]);

  const strengthNames = useMemo(
    () => skillProfile?.transferableSkills.map((s) => s.name) ?? [],
    [skillProfile]
  );

  function strengthsUsedBy(role: RoleMatch): string[] {
    const hits = new Set<string>();
    for (const strength of strengthNames) {
      if (role.requiredSkills.some((req) => looseIncludes(req, strength))) {
        hits.add(strength);
      }
    }
    return Array.from(hits);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const data = await apiSend<{ opportunityReport: OpportunityReport }>(
        '/api/opportunities',
        'POST'
      );
      setReport(data.opportunityReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }

  async function handleStart() {
    const role = report?.roleMatches.find((r) => r.id === selectedId);
    if (!role) return;
    setStarting(true);
    setError('');
    try {
      await apiSend('/api/profile', 'POST', { chosenRole: role.title });
      await apiSend('/api/plan', 'POST');
      await refresh();
      router.push('/coach');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start this path');
      setStarting(false);
    }
  }

  if (loading) return <EmptyState text="Loading…" />;
  if (!user) return <EmptyState text="Please sign in first to choose a path." />;

  const selected = report?.roleMatches.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-28">
      {/* Back link */}
      <Link
        href="/skills"
        className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-700 underline underline-offset-4 hover:text-coral-600"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to my skill portrait
      </Link>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-coral-500">
          Orient · Pick one path
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          Pick one path first
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          Match scores are a guide, not a verdict — they reflect your current
          evidence, not your potential. Pick one direction to start; you can
          switch later.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="Loading your recommended paths…" /> : null}

      {!fetching && !report ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            You don&apos;t have path recommendations yet. Generate them from
            your skill portrait first.
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
                Generate my recommended paths
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {report ? (
        <div className="space-y-3">
          {report.roleMatches.map((role) => {
            const isSelected = selectedId === role.id;
            const isOpen = expanded === role.id;
            const badge = matchBadge(role.matchScore);
            const used = strengthsUsedBy(role);
            return (
              <Card
                key={role.id}
                onClick={() => setSelectedId(role.id)}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 border-coral-500 bg-softpink-50 shadow-md ring-1 ring-coral-300'
                    : 'border-silver-300 hover:border-coral-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-coral-500 bg-coral-500 text-white'
                        : 'border-silver-300 bg-white'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-black text-slateblue-900">
                        {role.title}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black ${badge.cls}`}
                      >
                        {badge.label} · {role.matchScore}%
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slateblue-700">
                      {role.description}
                    </p>

                    {used.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slateblue-700">
                          Uses your strengths
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {used.map((s) => (
                            <Badge key={s} tone="pink">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-warmred">
                        Needs to build
                      </p>
                      <p className="mt-0.5 text-xs font-bold leading-relaxed text-slateblue-900">
                        {role.skillGaps && role.skillGaps.length > 0
                          ? role.skillGaps.join(' · ')
                          : role.requiredSkills.join(' · ')}
                      </p>
                    </div>

                    <p className="mt-2.5 text-xs italic leading-relaxed text-slateblue-700/90">
                      {role.tradeoffs}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((v) => (v === role.id ? null : role.id));
                      }}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg border border-silver-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slateblue-700 transition-colors hover:bg-silver-100"
                    >
                      {isOpen ? 'Hide evidence' : 'Why this score?'}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen ? (
                      <div
                        className="mt-2.5 space-y-2 border-t border-silver-200 pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slateblue-700">
                            Evidence behind the match
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slateblue-900">
                            {role.whyFit}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slateblue-700">
                            Typical work
                          </p>
                          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs text-slateblue-900">
                            {role.typicalWorkflows.map((w) => (
                              <li key={w}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* Sticky single CTA */}
      {report ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-silver-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="min-w-0 text-xs font-bold text-slateblue-700">
              {selected ? (
                <>
                  Starting:{' '}
                  <span className="text-slateblue-900">{selected.title}</span>
                </>
              ) : (
                'Select one path to continue'
              )}
            </p>
            <Button
              onClick={handleStart}
              disabled={!selectedId || starting}
              className="shrink-0 rounded-full px-6"
            >
              {starting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Building your plan…
                </>
              ) : (
                <>
                  Start with this path
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
