'use client';

import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Lightbulb,
  Send,
  Sparkles,
  Wrench,
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
import type { LabFeedback, LabTask } from '@/lib/types';

const STATUS_LABELS: Record<LabTask['status'], string> = {
  todo: '待开始',
  in_progress: '进行中',
  done: '已完成',
};

const STATUS_TONES: Record<LabTask['status'], 'silver' | 'coral' | 'green'> = {
  todo: 'silver',
  in_progress: 'coral',
  done: 'green',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(
    2,
    '0'
  )}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function FeedbackBlock({ feedback }: { feedback: LabFeedback }) {
  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-softpink-300 bg-softpink-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-coral-500">
          AI 反馈
        </span>
        <Badge tone="coral">评分 {feedback.score} / 5</Badge>
      </div>
      <div>
        <p className="text-xs font-bold text-slateblue-900">亮点</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slateblue-800">
          {feedback.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold text-slateblue-900">可执行建议</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slateblue-800">
          {feedback.actionableSuggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold text-slateblue-900">技能差距分析</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slateblue-800">
          {feedback.skillGapAnalysis.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TasksLabPage() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<LabTask[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const data = await apiGet<{ tasks: LabTask[] }>('/api/tasks-lab');
        if (!cancelled) setTasks(data.tasks);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  async function handleSubmit() {
    if (!activeTask || !text.trim()) return;
    setSubmitting(true);
    setError('');
    setJustSubmitted(false);
    try {
      const data = await apiSend<{
        task: LabTask;
        feedback: LabFeedback;
      }>('/api/tasks-lab/submit', 'POST', {
        taskId: activeTask.id,
        text: text.trim(),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? data.task : t))
      );
      setText('');
      setJustSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <EmptyState text="正在加载…" />;
  }
  if (!user) {
    return <EmptyState text="请先登录（可用右上角切换演示账号）" />;
  }

  const sortedSubmissions = activeTask
    ? [...activeTask.submissions].sort((a, b) =>
        a.submittedAt.localeCompare(b.submittedAt)
      )
    : [];
  const curve = sortedSubmissions.map((s, i) => ({
    name: `第${i + 1}次`,
    score: s.feedback.score,
  }));

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Journey ④ 实操任务"
        title="实操任务实验室"
        desc="用 AI 完成一个真实小任务，产出的就是你的作品证据；可反复提交、持续迭代。"
      />

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="正在准备任务…" /> : null}

      {!fetching && tasks.length === 0 ? (
        <EmptyState text="暂时没有可用的任务，请稍后再试。" />
      ) : null}

      {/* 任务列表 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {tasks.map((task) => {
          const active = task.id === activeTaskId;
          return (
            <Card
              key={task.id}
              className={`flex flex-col ${
                active ? 'border-coral-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Badge tone={STATUS_TONES[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
                <span className="flex items-center gap-1 text-xs font-bold text-slateblue-700">
                  <Clock className="h-3.5 w-3.5" />
                  约 {task.estimatedMinutes} 分钟
                </span>
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-slateblue-900">
                {task.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slateblue-700">
                <span className="font-bold">场景：</span>
                {task.scenario}
              </p>
              <p className="mt-2 flex items-start gap-1 text-xs leading-relaxed text-slateblue-700">
                <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-500" />
                <span>
                  <span className="font-bold">工具提示：</span>
                  {task.toolHint}
                </span>
              </p>
              <div className="mt-3">
                <p className="flex items-center gap-1 text-xs font-bold text-slateblue-900">
                  <ClipboardList className="h-3.5 w-3.5" />
                  评分标准
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slateblue-700">
                  {task.rubric.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <Button
                className="mt-4"
                variant={active ? 'primary' : 'secondary'}
                onClick={() => {
                  setActiveTaskId(active ? null : task.id);
                  setText('');
                  setJustSubmitted(false);
                }}
              >
                {active ? '收起提交区' : '开始提交产出'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* 提交区 + 反馈 */}
      {activeTask ? (
        <Card>
          <h3 className="text-sm font-extrabold text-slateblue-900">
            提交产出 · {activeTask.title}
          </h3>
          <p className="mt-1 text-xs text-slateblue-700">
            把你的产出（粘贴文本）贴进来，AI 会按 rubric 给出具体反馈。
          </p>
          <textarea
            className="mt-3 min-h-[140px] w-full resize-y rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴你的产出：例如 3 个改写版本 + 取舍理由 + 你认为最优的一版及原因……"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slateblue-700">
              提交后会自动生成一条「任务成果」证据。
            </p>
            <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
              <Send className="h-4 w-4" />
              {submitting ? '评估中…' : '提交评估'}
            </Button>
          </div>

          {justSubmitted ? (
            <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-sm font-bold text-[#3f7a4a]">
              <Sparkles className="h-4 w-4" />
              已生成证据：本次任务成果已记录到你的证据库。
            </p>
          ) : null}

          {/* 多轮提交记录 */}
          {sortedSubmissions.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-slateblue-900">
                  提交记录（{sortedSubmissions.length} 次）
                </h4>
                {curve.length >= 2 ? (
                  <Badge tone="green">评分在进步</Badge>
                ) : null}
              </div>

              {curve.length >= 2 ? (
                <div className="mb-3 h-48 w-full rounded-2xl border border-silver-300 bg-white p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E1E5EC" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#E8725C"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mb-3 text-xs text-slateblue-700">
                  再提交一次，就能看到你的评分曲线。
                </p>
              )}

              <div className="space-y-3">
                {sortedSubmissions.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-silver-300 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slateblue-900">
                        <CheckCircle2 className="h-3.5 w-3.5 text-warmgreen" />
                        第 {idx + 1} 次提交 · {formatTime(sub.submittedAt)}
                      </span>
                      <Badge tone="coral">{sub.feedback.score} / 5</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap rounded-xl bg-silver-50 px-3 py-2 text-xs text-slateblue-700">
                      {sub.text}
                    </p>
                    <FeedbackBlock feedback={sub.feedback} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <p className="flex items-center gap-1.5 text-xs text-slateblue-700">
                <Lightbulb className="h-3.5 w-3.5 text-coral-500" />
                还没有提交记录，完成第一个版本试试看。
              </p>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
