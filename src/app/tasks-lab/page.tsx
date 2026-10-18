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
  todo: 'Not started',
  in_progress: 'In progress',
  done: 'Completed',
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
          AI feedback
        </span>
        <Badge tone="coral">Score {feedback.score} / 5</Badge>
      </div>
      <div>
        <p className="text-xs font-bold text-slateblue-900">Highlights</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slateblue-800">
          {feedback.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold text-slateblue-900">
          Actionable suggestions
        </p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slateblue-800">
          {feedback.actionableSuggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold text-slateblue-900">Skill gap analysis</p>
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
    // Anonymous visitors have no client-side `user` object; the server
    // identifies them by cookie. Load as soon as auth state settles.
    if (loading) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const data = await apiGet<{ tasks: LabTask[] }>('/api/tasks-lab');
        if (!cancelled) setTasks(data.tasks);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading]);

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
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <EmptyState text="Loading…" />;
  }
  // Anonymous visitors are welcome: the server tracks them by cookie.

  const sortedSubmissions = activeTask
    ? [...activeTask.submissions].sort((a, b) =>
        a.submittedAt.localeCompare(b.submittedAt)
      )
    : [];
  const curve = sortedSubmissions.map((s, i) => ({
    name: `Attempt ${i + 1}`,
    score: s.feedback.score,
  }));

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Journey ④ Hands-on tasks"
        title="Hands-on Task Lab"
        desc="Complete a small real-world task with AI—your output becomes portfolio evidence. Resubmit as often as you like and keep iterating."
      />

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="Preparing tasks…" /> : null}

      {!fetching && tasks.length === 0 ? (
        <EmptyState text="No tasks are available right now. Please try again later." />
      ) : null}

      {/* Task list */}
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
                  About {task.estimatedMinutes} min
                </span>
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-slateblue-900">
                {task.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slateblue-700">
                <span className="font-bold">Scenario: </span>
                {task.scenario}
              </p>
              <p className="mt-2 flex items-start gap-1 text-xs leading-relaxed text-slateblue-700">
                <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-500" />
                <span>
                  <span className="font-bold">Tool tip: </span>
                  {task.toolHint}
                </span>
              </p>
              <div className="mt-3">
                <p className="flex items-center gap-1 text-xs font-bold text-slateblue-900">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Rubric
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
                {active ? 'Hide submission panel' : 'Submit your work'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Submission panel + feedback */}
      {activeTask ? (
        <Card>
          <h3 className="text-sm font-extrabold text-slateblue-900">
            Submit your work · {activeTask.title}
          </h3>
          <p className="mt-1 text-xs text-slateblue-700">
            Paste your work here and the AI will give specific feedback based on
            the rubric.
          </p>
          <textarea
            className="mt-3 min-h-[140px] w-full resize-y rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your work, e.g. three rewritten versions + your trade-off reasoning + the version you think is best and why…"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slateblue-700">
              Submitting automatically creates a &ldquo;task outcome&rdquo;
              evidence entry.
            </p>
            <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
              <Send className="h-4 w-4" />
              {submitting ? 'Evaluating…' : 'Submit for review'}
            </Button>
          </div>

          {justSubmitted ? (
            <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-sm font-bold text-[#3f7a4a]">
              <Sparkles className="h-4 w-4" />
              Evidence created: this task outcome has been saved to your evidence
              library.
            </p>
          ) : null}

          {/* Multi-round submission history */}
          {sortedSubmissions.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-slateblue-900">
                  Submission history ({sortedSubmissions.length})
                </h4>
                {curve.length >= 2 ? (
                  <Badge tone="green">Your scores are improving</Badge>
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
                  Submit once more to see your score trend.
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
                        Submission {idx + 1} · {formatTime(sub.submittedAt)}
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
                No submissions yet—try completing your first version.
              </p>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
