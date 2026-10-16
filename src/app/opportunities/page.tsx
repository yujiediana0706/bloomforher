'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Heart, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ScoreRing,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { OpportunityReport, RoleMatch } from '@/lib/types';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slateblue-700">
        {label}
      </p>
      <div className="mt-0.5 text-xs leading-relaxed text-slateblue-900">
        {children}
      </div>
    </div>
  );
}

function RoleDetails({ role }: { role: RoleMatch }) {
  return (
    <div className="mt-3 border-t border-silver-200 pt-2">
      <DetailRow label="Role overview">{role.description}</DetailRow>
      <DetailRow label="Why it suits you">{role.whyFit}</DetailRow>
      <DetailRow label="Skills needed">
        <div className="flex flex-wrap gap-1">
          {role.requiredSkills.map((s) => (
            <Badge key={s} tone="silver">
              {s}
            </Badge>
          ))}
        </div>
      </DetailRow>
      <DetailRow label="Typical workflows">
        <ul className="list-disc space-y-0.5 pl-4">
          {role.typicalWorkflows.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </DetailRow>
      <DetailRow label="Trade-offs">
        <span className="text-slateblue-700">{role.tradeoffs}</span>
      </DetailRow>
    </div>
  );
}

export default function OpportunitiesPage() {
  const { user, loading } = useAuth();
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const data = await apiGet<{ opportunityReport: OpportunityReport | null }>(
        '/api/opportunities'
      );
      setReport(data.opportunityReport);
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
          Diagnostic details · AI opportunities
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          AI roles matched to you
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          Match scores are a guide, not a verdict—you can always explore more
          directions.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="Matching AI opportunities…" /> : null}

      {!fetching && !report ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            You don&apos;t have an opportunity report yet. Click the button below
            and the AI will match roles based on your skill profile.
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
                Generate my AI opportunities
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {report ? (
        <>
          {/* Role recommendations */}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slateblue-900">
              Role recommendations ({report.roleMatches.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.roleMatches.map((role) => {
                const isOpen = expanded === role.id;
                return (
                  <Card key={role.id} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      <ScoreRing value={role.matchScore} label="Match" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-slateblue-900">
                          {role.title}
                        </h4>
                        <Badge tone="pink">{role.category}</Badge>
                        <p className="mt-1 text-xs leading-relaxed text-slateblue-700">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((v) => (v === role.id ? null : role.id))
                      }
                      className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-silver-300 bg-white px-3 py-1.5 text-xs font-bold text-slateblue-700 transition-colors hover:bg-silver-100"
                    >
                      {isOpen ? 'Hide details' : 'View details'}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expanded === role.id ? <RoleDetails role={role} /> : null}
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Women-friendly tracks */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                Women-friendly tracks
              </h3>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {report.womenFriendlyTracks.map((track) => (
                <Card key={track.title} className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-softpink-200 text-coral-700">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slateblue-900">
                      {track.title}
                    </h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-slateblue-700">
                      {track.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Gentle guidance */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                Gentle guidance: concerns you may encounter
              </h3>
            </div>
            <div className="space-y-2.5">
              {report.genderRiskHints.map((hint) => (
                <Card
                  key={hint.scenario}
                  className="border-softpink-300 bg-softpink-100"
                >
                  <p className="text-xs font-bold text-slateblue-900">
                    {hint.scenario}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-coral-700">
                    {hint.gentleAdvice}
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
