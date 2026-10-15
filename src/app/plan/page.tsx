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

const PAUSE_LINE = '暂停不等于淘汰';

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
      setError(e instanceof Error ? e.message : '加载失败');
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
      setError(e instanceof Error ? e.message : '生成失败');
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
        `AI 已按「${feedback.trim()}」重新生成计划：${PAUSE_LINE}，你已完成的任务进度都已保留。`
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
      setError(e instanceof Error ? e.message : '更新失败');
    } finally {
      setPendingTaskId(null);
    }
  }

  if (loading) return <EmptyState text="正在加载…" />;
  if (!user)
    return <EmptyState text="请先登录（可用右上角切换演示账号）" />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 返回链接 */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-700 underline underline-offset-4 hover:text-coral-600"
      >
        <ArrowLeft className="h-3 w-3" />
        返回 AI Mentor 工作台
      </Link>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-coral-500">
          诊断详情 · 回归计划
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          你的 30 天回归计划
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          按你的人生阶段设计节奏：可中断、可调整，暂停不会清零你走过的路。
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="正在读取你的计划…" /> : null}

      {!fetching && !plan ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            还没有你的回归计划。点击下方按钮，AI 会按你的阶段与每周可投入时间生成。
          </p>
          <Button
            className="mt-4"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                正在生成…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成我的 30 天计划
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {plan ? (
        <>
          {/* 节奏 + 断档预案 + 调整计划 — 三张紧凑卡 */}
          <Card className="border-softpink-300 bg-gradient-to-br from-softpink-100 to-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-coral-500">
                  你的节奏
                </p>
                <h3 className="mt-0.5 text-lg font-black text-slateblue-900">
                  {plan.paceLabel}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="coral">每周 {plan.weeklyHours}h</Badge>
                <Badge tone="silver">{plan.totalWeeks} 周</Badge>
              </div>
            </div>
          </Card>

          <Card className="border-softpink-300 bg-softpink-100">
            <div className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4 text-coral-500" />
              <p className="text-xs font-extrabold text-slateblue-900">
                断档回归预案
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slateblue-800">
              {plan.returnPlaybook}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-coral-500" />
              <p className="text-xs font-extrabold text-slateblue-900">调整计划</p>
            </div>
            <p className="mt-0.5 text-xs text-slateblue-700">
              用一句自然语言告诉我发生了什么，我来重新排布节奏。
            </p>
            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <input
                className="w-full rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder='示例："这周孩子生病了"'
              />
              <Button
                className="shrink-0"
                onClick={() => void handleAdjust()}
                disabled={adjusting || !feedback.trim()}
              >
                {adjusting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    调整中…
                  </>
                ) : (
                  <>
                    <Sliders className="h-4 w-4" />
                    调整计划
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

          {/* 周卡 */}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slateblue-900">
              每周安排
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.weeks.map((week) => (
                <Card key={week.week} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-coral-500">
                        第 {week.week} 周
                      </p>
                      <h4 className="text-sm font-extrabold text-slateblue-900">
                        {week.theme}
                      </h4>
                    </div>
                    <Badge tone="silver">{week.weeklyHours}h/周</Badge>
                  </div>

                  <div className="mt-2.5">
                    <p className="flex items-center gap-1 text-[11px] font-bold text-slateblue-900">
                      <BookOpen className="h-3 w-3" />
                      学习资源
                    </p>
                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] text-slateblue-700">
                      {week.learningResources.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-[11px] font-bold text-slateblue-900">
                      实践任务
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
                      求职里程碑
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
              勾选任务即完成，会自动生成证据。这周状态不好？{PAUSE_LINE}。
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
