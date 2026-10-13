'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Bot,
  BrainCog,
  CalendarClock,
  Check,
  Circle,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, ProgressBar } from '@/components/ui';
import { apiGet, apiSend } from '@/lib/client';
import type { EvidenceItem, PlanTask, ReturnPlan } from '@/lib/types';

interface ChatMsg {
  role: 'user' | 'coach';
  content: string;
  microAction?: string;
}

const OPENING = '我看过你的档案、计划和证据，今天想先聊聊哪一步？';

const QUICK_QUESTIONS = [
  '这周我该先做哪一步？',
  '我觉得我不适合做 AI',
  '我不想执行计划了',
];

export default function CoachPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'coach', content: OPENING },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // —— 计划进度数据（右侧 dashboard）——
  const [plan, setPlan] = useState<ReturnPlan | null>(null);
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  const tasks: PlanTask[] = plan?.weeks.flatMap((w) => w.practiceTasks) ?? [];
  const done = tasks.filter((t) => t.completed).length;
  const nextTask = tasks.find((t) => !t.completed)?.title;

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const [planRes, evRes, sessionRes] = await Promise.allSettled([
        apiGet<{ plan: ReturnPlan | null }>('/api/plan'),
        apiGet<{ evidences: EvidenceItem[] }>('/api/evidence'),
        apiGet<{ bookings: { status: string }[] }>('/api/my-sessions'),
      ]);
      if (!alive) return;
      if (planRes.status === 'fulfilled') setPlan(planRes.value.plan);
      if (evRes.status === 'fulfilled') {
        setEvidenceCount(evRes.value.evidences.length);
      }
      if (sessionRes.status === 'fulfilled') {
        setSessionCount(
          sessionRes.value.bookings.filter(
            (b) => b.status === 'completed' || b.status === 'released'
          ).length
        );
      }
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
      const res = await apiSend<{ plan: ReturnPlan; evidence: EvidenceItem | null }>(
        '/api/plan-tasks',
        'PATCH',
        { taskId, completed }
      );
      setPlan(res.plan);
      if (res.evidence) setEvidenceCount((c) => (c ?? 0) + 1);
    } catch {
      setError('更新任务状态失败，请稍后重试');
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
      if (!res.ok || !res.body) throw new Error('对话失败，请稍后重试');

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
      setError(e instanceof Error ? e.message : '对话失败');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slateblue-700">加载中…</p>;
  }

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-slateblue-700">
          请先登录（右上角可切换演示账号）
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* 标题区（压缩） */}
      <div className="py-4">
        <h1 className="text-xl font-black text-slateblue-900">
          AI Mentor · 你的专属陪伴
        </h1>
        <p className="mt-0.5 text-xs text-slateblue-700">
          左边聊，右边看进度——计划和每一次真人交流，我都记着。
        </p>
      </div>

      {/* 双栏工作台：左聊天 1fr / 右进度 1.2fr */}
      <div className="grid gap-4 lg:h-[calc(100vh-140px)] lg:grid-cols-[1fr_1.2fr]">
        {/* 左：AI 对话框 */}
        <Card className="flex min-h-[520px] flex-col p-0 lg:min-h-0">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user'
                      ? 'bg-slateblue-800 text-white'
                      : 'bg-coral-500 text-white'
                  }`}
                >
                  {m.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </span>
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
                        正在思考…
                      </span>
                    )}
                  </div>
                  {m.microAction ? (
                    <div className="rounded-2xl border border-softpink-300 bg-softpink-100 px-3.5 py-2.5 text-left">
                      <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                        微行动建议 · 10 分钟内
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

          {/* 输入区（固定底部） */}
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
                placeholder="说说你现在的处境或困惑…（Enter 发送）"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
              />
              <Button
                onClick={() => void send()}
                disabled={sending || !input.trim()}
              >
                <Send className="h-4 w-4" />
                发送
              </Button>
            </div>
          </div>
        </Card>

        {/* 右：计划进度 dashboard */}
        <div className="min-h-0 space-y-4 overflow-y-auto pr-0.5">
          {/* 今日提醒 */}
          <Card className="border-softpink-300 !bg-softpink-100 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-500 text-white">
                <BellRing className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                  今日提醒
                </p>
                {plan && tasks.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm font-bold text-slateblue-900">
                      {nextTask
                        ? `今天先只做这一件：「${nextTask}」，做完就算赢。`
                        : '计划里的任务都完成了——我们聊聊下一步去哪？'}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slateblue-700">
                      按你的节奏，可暂停
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-bold text-slateblue-900">
                    你还没有 30 天回归计划——
                    <Link href="/plan" className="text-coral-600 underline">
                      去生成一份
                    </Link>
                    ，我来提醒你执行。
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 进度总览 + 记忆信号 */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                计划进度
              </p>
              <span className="text-xs font-black text-slateblue-900">
                {done}/{tasks.length || '—'} 已完成
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={tasks.length ? (done / tasks.length) * 100 : 0} />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slateblue-700">
              <BrainCog className="h-3.5 w-3.5 shrink-0 text-coral-500" />
              <span className="text-slateblue-700/80">我越来越懂你：</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-silver-300 bg-silver-50 px-2.5 py-0.5 text-[11px] font-bold text-slateblue-700">
                诊断报告 ✓
              </span>
              {typeof evidenceCount === 'number' ? (
                <span className="rounded-full border border-silver-300 bg-silver-50 px-2.5 py-0.5 text-[11px] font-bold text-slateblue-700">
                  任务证据 {evidenceCount} 条
                </span>
              ) : null}
              {typeof sessionCount === 'number' && sessionCount > 0 ? (
                <span className="rounded-full border border-silver-300 bg-silver-50 px-2.5 py-0.5 text-[11px] font-bold text-slateblue-700">
                  导师会话 {sessionCount} 次
                </span>
              ) : null}
            </div>
          </Card>

          {/* 进度记录表（按周分组，可勾选） */}
          {plan ? (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-coral-500" />
                <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                  进度记录 · {plan.paceLabel}
                </p>
              </div>
              <div className="mt-3 space-y-4">
                {plan.weeks.map((week) => (
                  <div key={week.week}>
                    <div className="flex items-baseline justify-between border-b border-silver-200 pb-1.5">
                      <p className="text-xs font-black text-slateblue-900">
                        第 {week.week} 周 · {week.theme}
                      </p>
                      <p className="text-[11px] font-bold text-slateblue-700/70">
                        每周 {week.weeklyHours} 小时
                      </p>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {week.practiceTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => void toggleTask(t.id, !t.completed)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-silver-100"
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
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                              t.category === 'milestone'
                                ? 'bg-coral-100 text-coral-600'
                                : 'bg-silver-100 text-slateblue-700'
                            }`}
                          >
                            {t.category === 'milestone' ? '里程碑' : '练习'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slateblue-700/70">
                点任务即可标记完成，完成的任务会自动沉淀进你的证据库。
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
