'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { EvidenceLevel, SkillProfile } from '@/lib/types';

const EVIDENCE_META: Record<EvidenceLevel, { label: string; short: string; dot: string; badge: string }> = {
  verified: {
    label: 'Verified',
    short: 'VERIFIED',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  transferable: {
    label: 'Transferable',
    short: 'TRANSFERABLE',
    dot: 'bg-coral-500',
    badge: 'bg-coral-50 text-coral-700 border-coral-200',
  },
  hypothesis: {
    label: 'Unverified',
    short: 'UNVERIFIED',
    dot: 'bg-silver-400',
    badge: 'bg-silver-100 text-slateblue-600 border-silver-300',
  },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  high: { label: 'CRITICAL', cls: 'border-warmred/30 bg-warmred/10 text-warmred' },
  medium: { label: 'IMPORTANT', cls: 'border-coral-200 bg-coral-50 text-coral-700' },
  low: { label: 'NICE TO HAVE', cls: 'border-silver-300 bg-silver-50 text-slateblue-700' },
};

/* —— Radar chart (pentagon) —— */
function RadarChart({ skills }: { skills: { name: string; value: number }[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 75;
  const n = 5;
  const angles = Array.from({ length: n }, (_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const points = angles.map((a, i) => {
    const val = (skills[i]?.value ?? 50) / 100;
    const x = cx + r * val * Math.cos(a);
    const y = cy + r * val * Math.sin(a);
    return `${x},${y}`;
  });

  const labelPoints = angles.map((a, i) => {
    const lr = r + 18;
    const x = cx + lr * Math.cos(a);
    const y = cy + lr * Math.sin(a);
    return { x, y, label: skills[i]?.name ?? '' };
  });

  const gridPoints = [0.2, 0.4, 0.6, 0.8, 1].map((scale) =>
    angles.map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`).join(' ')
  );

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44">
        {/* Grid */}
        {gridPoints.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="#e5e1d8"
            strokeWidth={1}
          />
        ))}
        {/* Axes */}
        {angles.map((a, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(a)}
            y2={cy + r * Math.sin(a)}
            stroke="#e5e1d8"
            strokeWidth={1}
          />
        ))}
        {/* Data area */}
        <polygon
          points={points.join(' ')}
          fill="rgba(234, 119, 101, 0.12)"
          stroke="#ea7765"
          strokeWidth={2}
        />
        {/* Dots */}
        {points.map((pt, i) => (
          <circle key={i} cx={pt.split(',')[0]} cy={pt.split(',')[1]} r={3} fill="#ea7765" />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {labelPoints.map((lp, i) => (
          <span key={i} className="text-[10px] font-bold text-slateblue-700">
            {lp.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-[10px] font-bold text-slateblue-500">AI relevance by strength</p>
    </div>
  );
}

/* —— Score ring —— */
function ScoreRing({ value, size = 44 }: { value: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0ebe3" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ea7765"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slateblue-900">
        {value}
      </span>
    </div>
  );
}

/* —— Confidence slider —— */
function ConfidenceSlider({
  dimension,
  selfScore,
  aiScore,
}: {
  dimension: string;
  selfScore: number;
  aiScore: number;
}) {
  const max = 10;
  const selfPct = (selfScore / max) * 100;
  const aiPct = (aiScore / max) * 100;
  const diff = aiScore - selfScore;
  let badge = null;
  if (diff >= 2)
    badge = (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
        ↑ {diff} underrated
      </span>
    );
  else if (diff <= -2)
    badge = (
      <span className="rounded-full border border-warmred/30 bg-warmred/10 px-2 py-0.5 text-[10px] font-black text-warmred">
        ↓ {Math.abs(diff)} overrated
      </span>
    );
  else
    badge = (
      <span className="rounded-full border border-silver-300 bg-silver-100 px-2 py-0.5 text-[10px] font-black text-slateblue-600">
        aligned
      </span>
    );

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-40 shrink-0 text-xs font-extrabold text-slateblue-900 sm:w-48">
        {dimension}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-silver-200">
        {/* AI dot */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-coral-500 bg-white"
          style={{ left: `${aiPct}%` }}
        />
        {/* Self dot */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-slateblue-400 bg-slateblue-400"
          style={{ left: `${selfPct}%` }}
        />
      </div>
      <div className="ml-2 w-24 shrink-0 text-right">{badge}</div>
    </div>
  );
}

/* —— Strength card —— */
function StrengthCard({
  skill,
}: {
  skill: SkillProfile['transferableSkills'][number];
}) {
  const level = skill.evidenceLevel ?? 'hypothesis';
  const meta = EVIDENCE_META[level];
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-silver-300">
            <Sparkles className="h-3.5 w-3.5 text-coral-500" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold leading-tight text-slateblue-900">
              {skill.name}
            </h4>
            <span
              className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${meta.badge}`}
            >
              {meta.short}
            </span>
          </div>
        </div>
        <ScoreRing value={skill.aiRelevance} />
      </div>
      <p className="mt-2 text-[11px] font-bold leading-relaxed text-coral-700">
        {skill.evidence}
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex items-center gap-1 self-start text-[10px] font-bold text-slateblue-500 hover:text-coral-600"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        See evidence
      </button>
      {open ? (
        <p className="mt-1.5 rounded-lg border border-silver-200 bg-silver-50 px-3 py-2 text-[11px] leading-relaxed text-slateblue-700">
          {skill.narrative}
        </p>
      ) : null}
    </Card>
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
      const data = await apiGet<{ skillProfile: SkillProfile | null }>('/api/skills');
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
      const data = await apiSend<{ skillProfile: SkillProfile }>('/api/skills', 'POST');
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
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Header */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-coral-500">
          See · Skill portrait
        </p>
        <h1 className="mt-1 text-3xl font-black text-slateblue-900">
          Your skill portrait
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          What your experience proves, and what to build next.
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
            <p className="mt-2 text-lg font-extrabold leading-relaxed text-slateblue-900">
              {skillProfile.uniqueValue}
            </p>
          </Card>

          {/* Strengths */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slateblue-900">
                Strengths · {skillProfile.transferableSkills.length}
              </h3>
              <div className="flex items-center gap-3">
                {(Object.keys(EVIDENCE_META) as EvidenceLevel[]).map((k) => (
                  <div key={k} className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${EVIDENCE_META[k].dot}`} />
                    <span className="text-[10px] font-bold text-slateblue-600">
                      {EVIDENCE_META[k].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              {/* Radar */}
              <Card className="flex items-center justify-center">
                <RadarChart
                  skills={skillProfile.transferableSkills.slice(0, 5).map((s) => ({
                    name: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
                    value: s.aiRelevance,
                  }))}
                />
              </Card>

              {/* Strength cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {skillProfile.transferableSkills.map((skill) => (
                  <StrengthCard key={skill.id} skill={skill} />
                ))}
              </div>
            </div>
          </section>

          {/* Real skill gaps */}
          {skillProfile.skillGaps && skillProfile.skillGaps.length > 0 ? (
            <section>
              <h3 className="mb-0.5 flex items-center gap-1.5 text-sm font-extrabold text-slateblue-900">
                <AlertTriangle className="h-4 w-4 text-warmred" />
                Real skill gaps
              </h3>
              <p className="mb-3 text-[11px] font-bold text-slateblue-500">
                Ordered by impact
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {skillProfile.skillGaps.slice(0, 6).map((gap, idx) => {
                  const meta = PRIORITY_META[gap.priority] ?? PRIORITY_META.medium;
                  return (
                    <Card key={idx} className="relative overflow-hidden border-silver-300">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xl font-black text-silver-200">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <h4 className="mt-1 text-xs font-extrabold text-slateblue-900">
                        {gap.skill}
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slateblue-700">
                        {gap.why}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Confidence calibration */}
          {skillProfile.confidenceCalibration.length > 0 ? (
            <section>
              <h3 className="mb-1 text-sm font-extrabold text-slateblue-900">
                Confidence calibration
              </h3>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-slateblue-400 bg-slateblue-400" />
                  <span className="text-[10px] font-bold text-slateblue-600">You</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-coral-500 bg-white" />
                  <span className="text-[10px] font-bold text-slateblue-600">Evidence</span>
                </div>
              </div>
              <Card>
                {skillProfile.confidenceCalibration.map((item) => (
                  <ConfidenceSlider
                    key={item.dimension}
                    dimension={item.dimension}
                    selfScore={item.selfScore}
                    aiScore={item.aiScore}
                  />
                ))}
              </Card>
            </section>
          ) : null}

          {/* Forward CTA */}
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
