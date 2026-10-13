'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, SectionTitle } from '@/components/ui';

interface ChatMsg {
  role: 'user' | 'coach';
  content: string;
  microAction?: string;
}

const OPENING = '我看过你的档案和证据，今天想先聊聊哪一步？';

const QUICK_QUESTIONS = [
  '我产后 2 年，怎么开始？',
  '我觉得我不适合做 AI',
  '帮我看看我该先做哪一步',
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
    <div className="mx-auto w-full max-w-3xl">
      <SectionTitle
        eyebrow="AI 陪伴"
        title="和 AI 教练聊聊"
        desc="基于你的档案与证据，AI Coach 会陪你一步步找到可以落地的小行动。"
      />

      <Card className="p-0">
        <div className="space-y-4 px-4 py-5 sm:px-5">
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
      </Card>

      {error ? (
        <p className="mt-3 rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-xs font-bold text-warmred">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-3 flex items-end gap-2">
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
          placeholder="说说你现在的处境或困惑…（Enter 发送，Shift+Enter 换行）"
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
        />
        <Button onClick={() => void send()} disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
          发送
        </Button>
      </div>
    </div>
  );
}
