'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  BrainCog,
  CalendarClock,
  Check,
  FileText,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/components/AuthProvider';
import { COACH_AVATAR_URL } from '@/lib/constants';
import { Button, Card, ProgressBar } from '@/components/ui';
import { apiGet, apiSend } from '@/lib/client';
import type {
  EvidenceItem,
  OpportunityReport,
  PlanTask,
  ReturnPlan,
  SkillProfile,
} from '@/lib/types';

interface ChatMsg {
  role: 'user' | 'coach';
  content: string;
  microAction?: string;
}

const OPENING =
  'I have looked at your profile, plan, and evidence. Which step would you like to talk about first today?';

const QUICK_QUESTIONS = [
  'Which step should I do first this week?',
  "I feel I'm not cut out for AI",
  "I don't want to follow the plan anymore",
];

function buildRadarData(skill: SkillProfile | null) {
  if (!skill) return [];
  return skill.confidenceCalibration.map((c) => ({
    dim: c.dimension.slice(0, 4),
    Self: c.selfScore,
    AI: c.aiScore,
    fullMark: 10,
  }));
}

export default function CoachPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'coach', content: OPENING },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // —— Diagnosis summary data (top of the right dashboard) ——
  const [skill, setSkill] = useState<SkillProfile | null>(null);
  const [opp, setOpp] = useState<OpportunityReport | null>(null);

  // —— Plan progress data ——
  const [plan, setPlan] = useState<ReturnPlan | null>(null);
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  const tasks: PlanTask[] = plan?.weeks.flatMap((w) => w.practiceTasks) ?? [];
  const done = tasks.filter((t) => t.completed).length;
  const nextTask = tasks.find((t) => !t.completed)?.title;

  // Average confidence calibration score (AI side)
  const aiAvg =
    skill && skill.confidenceCalibration.length > 0
      ? Math.round(
          skill.confidenceCalibration.reduce((s, c) => s + c.aiScore, 0) /
            skill.confidenceCalibration.length
        )
      : null;
  const selfAvg =
    skill && skill.confidenceCalibration.length > 0
      ? Math.round(
          skill.confidenceCalibration.reduce((s, c) => s + c.selfScore, 0) /
            skill.confidenceCalibration.length
        )
      : null;

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const [skillRes, oppRes, planRes, evRes, sessionRes] =
        await Promise.allSettled([
          apiGet<{ skillProfile: SkillProfile | null }>('/api/skills'),
          apiGet<{ opportunityReport: OpportunityReport | null }>(
            '/api/opportunities'
          ),
          apiGet<{ plan: ReturnPlan | null }>('/api/plan'),
          apiGet<{ evidences: EvidenceItem[] }>('/api/evidence'),
          apiGet<{ bookings: { status: string }[] }>('/api/my-sessions'),
        ]);
      if (!alive) return;
      if (skillRes.status === 'fulfilled') setSkill(skillRes.value.skillProfile);
      if (oppRes.status === 'fulfilled') setOpp(oppRes.value.opportunityReport);
      if (planRes.status === 'fulfilled') setPlan(planRes.value.plan);
      if (evRes.status === 'fulfilled')
        setEvidenceCount(evRes.value.evidences.length);
      if (sessionRes.status === 'fulfilled')
        setSessionCount(
          sessionRes.value.bookings.filter(
            (b) => b.status === 'completed' || b.status === 'released'
          ).length
        );
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const res = await apiSend<{
        plan: ReturnPlan;
        evidence: EvidenceItem | null;
      }>('/api/plan-tasks', 'PATCH', { taskId, completed });
      setPlan(res.plan);
      if (res.evidence) setEvidenceCount((c) => (c ?? 0) + 1);
    } catch {
      setError('Failed to update task status, please try again later');
    }
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'coach', content: '' },
    ]);
    setInput('');
    setError('');
    setSending(true);

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok || !res.body) throw new Error('Chat failed, please try again later');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          let payload:
            | { delta?: string; done?: boolean; microAction?: string }
            | undefined;
          try {
            payload = JSON.parse(line.slice(6)) as {
              delta?: string;
              done?: boolean;
              microAction?: string;
            };
          } catch {
            continue;
          }
          if (!payload) continue;
          if (payload.delta) {
            const delta = payload.delta;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + delta };
              return copy;
            });
          }
          if (payload.done) {
            const microAction = payload.microAction;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, microAction };
              return copy;
            });
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slateblue-700">Loading…</p>;
  }

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-slateblue-700">
          Please sign in first to open your AI Mentor workspace.
        </p>
      </Card>
    );
  }

  const radarData = buildRadarData(skill);
  const topRoles = opp?.roleMatches.slice(0, 3) ?? [];
  // The skill portrait alone already IS the diagnosis; role matches are a bonus.
  const hasDiagnosis = !!skill;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header (compact) */}
      <div className="py-4">
        <h1 className="text-xl font-black text-slateblue-900">
          AI Mentor · Your personal companion
        </h1>
        <p className="mt-0.5 text-xs text-slateblue-700">
          Chat on the left; your diagnosis and progress evidence on the right.
          Every judgment I give traces back to your real experience and task
          results.
        </p>
      </div>

      {/* Two-column workspace */}
      <div className="grid gap-4 lg:h-[calc(100vh-140px)] lg:grid-cols-[1fr_1.2fr]">
        {/* Left: AI chat window */}
        <Card className="flex min-h-[520px] flex-col p-0 lg:min-h-0">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {m.role === 'user' ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slateblue-800 text-white">
                    <User className="h-4 w-4" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={COACH_AVATAR_URL}
                    alt="Your AI coach"
                    className="h-9 w-9 shrink-0 rounded-full border border-softpink-300 object-cover shadow-sm"
                  />
                )}
                <div
                  className={`max-w-[80%] space-y-2 ${
                    m.role === 'user' ? 'items-end text-right' : 'items-start'
                  }`}
                >
                  <div
                    className={`whitespace-pre-wrap rounded-2xl border px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'border-coral-100 bg-coral-50 text-slateblue-900'
                        : 'border-silver-300 bg-silver-100 text-slateblue-900'
                    }`}
                  >
                    {m.content || (
                      <span className="inline-flex items-center gap-1 text-slateblue-700">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        Thinking…
                      </span>
                    )}
                  </div>
                  {m.microAction ? (
                    <div className="rounded-2xl border border-softpink-300 bg-softpink-100 px-3.5 py-2.5 text-left">
                      <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                        Micro-action · within 10 minutes
                      </p>
                      <p className="mt-1 text-sm font-bold text-slateblue-900">
                        {m.microAction}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-silver-200 px-4 py-3 sm:px-5">
            {error ? (
              <p className="mb-2 rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-xs font-bold text-warmred">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={sending}
                  onClick={() => void send(q)}
                  className="rounded-full border border-silver-300 bg-white px-3 py-1.5 text-xs font-bold text-slateblue-700 hover:bg-silver-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="Tell me your current situation or concern... (Enter to send)"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
              />
              <Button
                onClick={() => void send()}
                disabled={sending || !input.trim()}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: progress board (top to bottom: diagnosis summary → today's reminder → progress overview → task list) */}
        <div className="min-h-0 space-y-4 overflow-y-auto pr-0.5">
          {/* 1. Diagnosis summary (skills + opportunities combined) */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-coral-500" />
                <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                  Your career diagnosis
                </p>
              </div>
              {hasDiagnosis ? (
                <Link
                  href="/skills"
                  className="text-[11px] font-bold text-slateblue-700 underline underline-offset-4 hover:text-coral-600"
                >
                  Full report →
                </Link>
              ) : null}
            </div>

            {hasDiagnosis ? (
              <>
                <div className="mt-3 flex items-start gap-3">
                  {/* mini radar */}
                  <div className="h-[140px] w-[140px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="dim"
                          tick={{ fontSize: 9, fill: '#62708b' }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 10]}
                          tick={{ fontSize: 8 }}
                          stroke="#d1d5db"
                          tickCount={5}
                        />
                        <RechartsRadar
                          name="Self"
                          dataKey="Self"
                          stroke="#94a3b8"
                          fill="#94a3b8"
                          fillOpacity={0.15}
                          strokeWidth={1.5}
                        />
                        <RechartsRadar
                          name="AI"
                          dataKey="AI"
                          stroke="#e8725c"
                          fill="#e8725c"
                          fillOpacity={0.22}
                          strokeWidth={1.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right-side text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-end gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-slateblue-700">
                          Confidence calibration (AI vs self)
                        </p>
                        <p className="mt-0.5 text-2xl font-black text-coral-600">
                          {aiAvg}
                          <span className="ml-0.5 text-xs text-slateblue-700">
                            / 10
                          </span>
                        </p>
                      </div>
                      <div className="pb-1">
                        <p className="text-[10px] font-bold text-slateblue-700">
                          Your self-rating
                        </p>
                        <p className="text-sm font-black text-slateblue-500">
                          {selfAvg}/10
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slateblue-700">
                      {skill?.uniqueValue}
                    </p>
                  </div>
                </div>

                {/* Top 3 roles */}
                {topRoles.length > 0 ? (
                  <div className="mt-3 border-t border-silver-200 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slateblue-700">
                      Your best-fit directions
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {topRoles.map((r) => (
                        <Link
                          key={r.id}
                          href="/opportunities"
                          className="rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-[11px] font-bold text-coral-700 transition-colors hover:bg-coral-100"
                        >
                          {r.title} · {r.matchScore}%
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 border-t border-silver-200 pt-3 text-xs text-slateblue-700">
                    Skill portrait is ready.{' '}
                    <Link
                      href="/opportunities"
                      className="font-bold text-coral-600 underline underline-offset-4"
                    >
                      Pick one path
                    </Link>{' '}
                    to see role matches and start your plan.
                  </p>
                )}
              </>
            ) : (
              <Card className="mt-3 border-dashed border-silver-300 bg-silver-50 text-center">
                <p className="text-xs text-slateblue-700">
                  No career diagnosis yet—
                  <Link href="/onboarding" className="text-coral-600 underline">
                    go to onboarding
                  </Link>{' '}
                  to finish, and AI will generate your skill profile + role
                  matches.
                </p>
              </Card>
            )}
          </Card>

          {/* 2. Today's reminder */}
          <Card className="border-softpink-300 !bg-softpink-100 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-500 text-white">
                <BellRing className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                  Today's reminder
                </p>
                {plan && tasks.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm font-bold text-slateblue-900">
                      {nextTask
                        ? `Just do this one thing today: "${nextTask}". Finishing it is a win.`
                        : "All tasks in the plan are done—let's talk about where to go next?"}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slateblue-700">
                      At your own pace, pausable
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-bold text-slateblue-900">
                    You haven&apos;t picked a path yet—
                    <Link href="/opportunities" className="text-coral-600 underline">
                      choose one
                    </Link>
                    , and I will build your plan and help you follow through.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 3. Progress overview + memory signals */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                Plan progress
              </p>
              <span className="text-xs font-black text-slateblue-900">
                {done}/{tasks.length || '—'} completed
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={tasks.length ? (done / tasks.length) * 100 : 0}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slateblue-700">
              <BrainCog className="h-3.5 w-3.5 shrink-0 text-coral-500" />
              <span className="text-slateblue-700/80">I understand you better:</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-silver-300 bg-silver-50 px-2.5 py-0.5 text-[11px] font-bold text-slateblue-700">
                Diagnosis report ✓
              </span>
              {typeof evidenceCount === 'number' ? (
                <span className="rounded-full border border-silver-300 bg-silver-50 px-2.5 py-0.5 text-[11px] font-bold text-slateblue-700">
                  Task evidence: {evidenceCount}
                </span>
              ) : null}
              {typeof sessionCount === 'number' && sessionCount > 0 ? (
                <span className="rounded-full border border-silver-300 bg-silver-50 px-2.5 py-0.5 text-[11px] font-bold text-slateblue-700">
                  Mentor sessions: {sessionCount}
                </span>
              ) : null}
            </div>
          </Card>

          {/* 4. Progress log */}
          {plan ? (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-coral-500" />
                <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                  Progress log · {plan.paceLabel}
                </p>
              </div>
              <div className="mt-3 space-y-4">
                {plan.weeks.map((week) => (
                  <div key={week.week}>
                    <div className="flex items-baseline justify-between border-b border-silver-200 pb-1.5">
                      <p className="text-xs font-black text-slateblue-900">
                        Week {week.week} · {week.theme}
                      </p>
                      <p className="text-[11px] font-bold text-slateblue-700/70">
                        {week.weeklyHours} hours/week
                      </p>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {week.practiceTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-silver-100"
                        >
                          <button
                            type="button"
                            onClick={() => void toggleTask(t.id, !t.completed)}
                            className="flex min-w-0 flex-1 items-center gap-2.5"
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                t.completed
                                  ? 'border-coral-500 bg-coral-500 text-white'
                                  : 'border-silver-300 bg-white text-transparent'
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                            <span
                              className={`min-w-0 flex-1 text-sm font-bold ${
                                t.completed
                                  ? 'text-slateblue-700/50 line-through'
                                  : 'text-slateblue-900'
                              }`}
                            >
                              {t.title}
                            </span>
                          </button>
                          {t.category !== 'milestone' ? (
                            <Link
                              href="/tasks-lab"
                              className="shrink-0 rounded-full bg-silver-100 px-2.5 py-1 text-[10px] font-black text-coral-600 transition-colors hover:bg-coral-500 hover:text-white"
                            >
                              Practice
                            </Link>
                          ) : (
                            <span className="shrink-0 rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-black text-coral-600">
                              Milestone
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slateblue-700/70">
                Click a task to mark it complete; completed tasks are
                automatically added to your evidence library.
              </p>
            </Card>
          ) : null}

        </div>
      </div>
    </div>
  );
}
