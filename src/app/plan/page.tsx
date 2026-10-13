'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Flag,
  PauseCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { PlanTask, ReturnPlan } from '@/lib/types';

const EXAMPLE_FEEDBACK = '这周孩子生病了';
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
        `AI 已按「${feedback.trim()}」重新生成计划：${PAUSE_LINE}，你已完成的任务进度都已保留，剩下的任务会顺延。`
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

  if (loading) {
    return <EmptyState text="正在加载…" />;
  }
  if (!user) {
    return <EmptyState text="请先登录（可用右上角切换演示账号）" />;
  }

  const maxHours = user.constraints.weeklyHours;

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Journey ⑤ 回归计划"
        title="你的 30 天回归计划"
        desc="按你的人生阶段设计节奏：可中断、可调整，暂停不会清零你走过的路。"
      />

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
          {/* 顶部：节奏标签 + 每周小时数 */}
          <Card className="border-softpink-300 bg-gradient-to-br from-softpink-100 to-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-coral-500">
                  你的节奏
                </span>
                <h3 className="mt-1 text-xl font-black text-slateblue-900">
                  {plan.paceLabel}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="coral">
                  每周投入 {plan.weeklyHours} 小时
                </Badge>
                <Badge tone="silver">共 {plan.totalWeeks} 周</Badge>
              </div>
            </div>
            <p className="mt-3 text-xs text-slateblue-700">
              你的档案里每周可投入上限为 {maxHours} 小时，计划已按此上限安排，不会超出。
            </p>
          </Card>

          {/* 断档回归预案 */}
          <Card className="border-softpink-300 bg-softpink-100">
            <div className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                断档回归预案（Return Playbook）
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slateblue-800">
              {plan.returnPlaybook}
            </p>
          </Card>

          {/* 调整计划 */}
          <Card>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                调整计划
              </h3>
            </div>
            <p className="mt-1 text-xs text-slateblue-700">
              用一句自然语言告诉我发生了什么，我来重新排布节奏。
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="w-full rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={`示例：「${EXAMPLE_FEEDBACK}」`}
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
              <p className="mt-3 rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-sm font-bold text-[#3f7a4a]">
                {pauseTip}
              </p>
            ) : null}
          </Card>

          {/* 周卡视图 */}
          <section>
            <h3 className="mb-3 text-sm font-extrabold text-slateblue-900">
              每周安排
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {plan.weeks.map((week) => (
                <Card key={week.week} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-coral-500">
                        第 {week.week} 周
                      </span>
                      <h4 className="text-sm font-extrabold text-slateblue-900">
                        {week.theme}
                      </h4>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone="silver">{week.weeklyHours} 小时/周</Badge>
                      {week.interruptible ? (
                        <Badge tone="pink">可中断</Badge>
                      ) : null}
                    </div>
                  </div>

                  {/* 学习资源 */}
                  <div className="mt-3">
                    <p className="flex items-center gap-1 text-xs font-bold text-slateblue-900">
                      <BookOpen className="h-3.5 w-3.5" />
                      学习资源
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slateblue-700">
                      {week.learningResources.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 实践任务（可勾选） */}
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slateblue-900">
                      实践任务
                    </p>
                    <div className="mt-1 space-y-2">
                      {week.practiceTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => void toggleTask(task)}
                          disabled={pendingTaskId === task.id}
                          className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
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
                            {task.completed ? (
                              <Check className="h-3 w-3" />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-xs font-bold ${
                                task.completed
                                  ? 'text-slateblue-700 line-through'
                                  : 'text-slateblue-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slateblue-700">
                              约 {task.estimatedHours} 小时 ·{' '}
                              {task.category === 'milestone'
                                ? '里程碑'
                                : '练习'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 求职里程碑 */}
                  <div className="mt-3">
                    <p className="flex items-center gap-1 text-xs font-bold text-slateblue-900">
                      <Target className="h-3.5 w-3.5" />
                      求职里程碑
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slateblue-700">
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
            <Flag className="h-4 w-4 shrink-0 text-coral-500" />
            <p className="text-xs text-slateblue-700">
              勾选任务即完成，会自动生成一条「学习进展」证据。如果这周状态不好，勾不掉也没关系——
              {PAUSE_LINE}。
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
