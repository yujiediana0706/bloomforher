'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Check, PauseCircle, RefreshCw, Sliders, Sparkles, Target } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { PlanTask, ReturnPlan } from '@/lib/types';

const PAUSE_LINE = 'A pause is not a failure';

export default function PlanPage() {
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<ReturnPlan | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pauseTip, setPauseTip] = useState('');
  const [error, setError] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const data = await apiGet<{ plan: ReturnPlan | null }>('/api/plan');
      setPlan(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleGenerate(body?: { feedback?: string }) {
    setGenerating(true);
    setError('');
    try {
      const data = await apiSend<{ plan: ReturnPlan }>(
        '/api/plan',
        'POST',
        body ?? {}
      );
      setPlan(data.plan);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
      return false;
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdjust() {
    if (!feedback.trim()) return;
    setAdjusting(true);
    setError('');
    setPauseTip('');
    const ok = await handleGenerate({ feedback: feedback.trim() });
    if (ok) {
      setPauseTip(
        `The AI regenerated your plan based on "${feedback.trim()}": ${PAUSE_LINE}, and all your completed task progress is preserved.`
      );
      setFeedback('');
    }
    setAdjusting(false);
  }

  async function toggleTask(task: PlanTask) {
    setPendingTaskId(task.id);
    setError('');
    try {
      const data = await apiSend<{ plan: ReturnPlan }>(
        '/api/plan-tasks',
        'PATCH',
        { taskId: task.id, completed: !task.completed }
      );
      setPlan(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setPendingTaskId(null);
    }
  }

  if (loading) return <EmptyState text="Loading…" />;
  if (!user)
    return (
      <EmptyState text="Please sign in first." />
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
          Diagnostic details · Return plan
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          Your 30-day return plan
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          A pace designed around your life stage: interruptible and adjustable—a
          pause never erases the progress you&apos;ve made.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="Loading your plan…" /> : null}

      {!fetching && !plan ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            You don&apos;t have a return plan yet. Click the button below and the
            AI will build one around your life stage and weekly availability.
          </p>
          <Button
            className="mt-4"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate my 30-day plan
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {plan ? (
        <>
          {/* Pace + break-return playbook + plan adjustment — three compact cards */}
          <Card className="border-softpink-300 bg-gradient-to-br from-softpink-100 to-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-coral-500">
                  Your pace
                </p>
                <h3 className="mt-0.5 text-lg font-black text-slateblue-900">
                  {plan.paceLabel}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="coral">{plan.weeklyHours}h / week</Badge>
                <Badge tone="silver">{plan.totalWeeks} weeks</Badge>
              </div>
            </div>
          </Card>

          <Card className="border-softpink-300 bg-softpink-100">
            <div className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4 text-coral-500" />
              <p className="text-xs font-extrabold text-slateblue-900">
                Career-break return playbook
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slateblue-800">
              {plan.returnPlaybook}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-coral-500" />
              <p className="text-xs font-extrabold text-slateblue-900">
                Adjust plan
              </p>
            </div>
            <p className="mt-0.5 text-xs text-slateblue-700">
              Tell me in a sentence what happened and I&apos;ll rearrange your
              pace.
            </p>
            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <input
                className="w-full rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder='Example: "My child was sick this week"'
              />
              <Button
                className="shrink-0"
                onClick={() => void handleAdjust()}
                disabled={adjusting || !feedback.trim()}
              >
                {adjusting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Adjusting…
                  </>
                ) : (
                  <>
                    <Sliders className="h-4 w-4" />
                    Adjust plan
                  </>
                )}
              </Button>
            </div>
            {pauseTip ? (
              <p className="mt-2.5 rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-xs font-bold text-[#3f7a4a]">
                {pauseTip}
              </p>
            ) : null}
          </Card>

          {/* Weekly cards */}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slateblue-900">
              Weekly schedule
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.weeks.map((week) => (
                <Card key={week.week} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-coral-500">
                        Week {week.week}
                      </p>
                      <h4 className="text-sm font-extrabold text-slateblue-900">
                        {week.theme}
                      </h4>
                    </div>
                    <Badge tone="silver">{week.weeklyHours}h / week</Badge>
                  </div>

                  <div className="mt-2.5">
                    <p className="flex items-center gap-1 text-[11px] font-bold text-slateblue-900">
                      <BookOpen className="h-3 w-3" />
                      Learning resources
                    </p>
                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] text-slateblue-700">
                      {week.learningResources.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-[11px] font-bold text-slateblue-900">
                      Practice tasks
                    </p>
                    <div className="mt-0.5 space-y-1">
                      {week.practiceTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => void toggleTask(task)}
                          disabled={pendingTaskId === task.id}
                          className={`flex w-full items-start gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-colors ${
                            task.completed
                              ? 'border-warmgreen/40 bg-warmgreen/10'
                              : 'border-silver-300 bg-white hover:bg-silver-100'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              task.completed
                                ? 'border-warmgreen bg-warmgreen text-white'
                                : 'border-silver-400'
                            }`}
                          >
                            {task.completed ? <Check className="h-2.5 w-2.5" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[11px] font-bold ${
                                task.completed
                                  ? 'text-slateblue-700 line-through'
                                  : 'text-slateblue-900'
                              }`}
                            >
                              {task.title}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <p className="flex items-center gap-1 text-[11px] font-bold text-slateblue-900">
                      <Target className="h-3 w-3" />
                      Job-search milestones
                    </p>
                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] text-slateblue-700">
                      {week.jobSearchMilestones.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 shrink-0 text-coral-500" />
            <p className="text-[11px] text-slateblue-700">
              Check off a task to complete it and evidence is created
              automatically. Having a rough week? {PAUSE_LINE}.
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
