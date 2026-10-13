'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Flag,
  Heart,
  Plus,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Modal,
  ProgressBar,
  ScoreRing,
  SectionTitle,
} from '@/components/ui';
import { EVIDENCE_TYPE_LABELS } from '@/lib/constants';
import type { EvidenceItem, EvidenceType } from '@/lib/types';

const EMPTY_TEXT =
  '还没有证据——完成一次技能发现，让第一份『我可以』自动出现';

const TYPE_ICONS: Record<
  EvidenceType,
  React.ComponentType<{ className?: string }>
> = {
  assessment_result: Target,
  skill_progress: TrendingUp,
  task_outcome: CheckCircle2,
  project_work: Briefcase,
  mentor_endorsement: Award,
  community_kudos: Sparkles,
  peer_appreciation: Heart,
  milestone: Flag,
};

const ALL_TYPES = Object.keys(EVIDENCE_TYPE_LABELS) as EvidenceType[];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

interface EvidenceData {
  evidences: EvidenceItem[];
  confidence: number;
  weeklySummary: string;
}

export default function EvidencePage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<EvidenceData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [view, setView] = useState<'timeline' | 'wall'>('timeline');
  const [filter, setFilter] = useState<EvidenceType | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    detail: '',
    tags: '',
    isPublic: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await apiGet<EvidenceData>('/api/evidence');
      setData(res);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const evidences = data?.evidences ?? [];
  const filtered =
    filter === 'all' ? evidences : evidences.filter((e) => e.type === filter);

  const submitEvidence = async () => {
    if (!form.title.trim()) {
      setFormError('请填写标题');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await apiSend('/api/evidence', 'POST', {
        title: form.title.trim(),
        detail: form.detail,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPublic: form.isPublic,
      });
      setModalOpen(false);
      setForm({ title: '', detail: '', tags: '', isPublic: false });
      setNotice('证据已添加');
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const shareToPlaza = async (ev: EvidenceItem) => {
    try {
      await apiSend('/api/plaza', 'POST', {
        type: 'win',
        title: `分享我的成果：${ev.title}`,
        body: ev.detail,
        tags: ['成果分享'],
        anonymous: false,
      });
      setNotice('已分享到对话广场');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '分享失败');
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
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          eyebrow="贯穿层 · 证据库"
          title="我的『我可以』"
          desc="每一次学习、任务、被认可，都会沉淀成一份证据，悄悄把自信度往上抬。"
        />
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          添加证据
        </Button>
      </div>

      {notice ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-xs font-bold text-[#3f7a4a]">
          <span>{notice}</span>
          <Link href="/plaza" className="underline">
            前往对话广场 →
          </Link>
        </div>
      ) : null}

      <div className="mb-4 inline-flex rounded-xl border border-silver-300 bg-white p-1">
        <button
          type="button"
          onClick={() => setView('timeline')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
            view === 'timeline'
              ? 'bg-coral-500 text-white'
              : 'text-slateblue-700 hover:bg-silver-100'
          }`}
        >
          时间线
        </button>
        <button
          type="button"
          onClick={() => setView('wall')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
            view === 'wall'
              ? 'bg-coral-500 text-white'
              : 'text-slateblue-700 hover:bg-silver-100'
          }`}
        >
          我可以墙
        </button>
      </div>

      {fetching && !data ? (
        <p className="text-sm text-slateblue-700">加载中…</p>
      ) : evidences.length === 0 ? (
        <EmptyState text={EMPTY_TEXT} />
      ) : view === 'timeline' ? (
        <div>
          <div className="no-scrollbar mb-4 flex flex-wrap gap-2">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              全部
            </Chip>
            {ALL_TYPES.map((t) => (
              <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>
                {EVIDENCE_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState text="该类型下还没有证据。" />
          ) : (
            <div className="space-y-0">
              {filtered.map((ev, idx) => {
                const Icon = TYPE_ICONS[ev.type];
                return (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-silver-300 bg-white text-coral-500">
                        <Icon className="h-4 w-4" />
                      </span>
                      {idx < filtered.length - 1 ? (
                        <span className="metal-bar my-1 w-[3px] flex-1 rounded" />
                      ) : null}
                    </div>
                    <div className="flex-1 pb-4">
                      <Card className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="coral">
                            {EVIDENCE_TYPE_LABELS[ev.type]}
                          </Badge>
                          {ev.source === 'auto' ? (
                            <Badge tone="silver">自动记录</Badge>
                          ) : (
                            <Badge tone="silver">手动添加</Badge>
                          )}
                          {ev.isPublic ? <Badge tone="pink">公开</Badge> : null}
                          <span className="ml-auto text-[11px] font-bold text-slateblue-700">
                            {formatDate(ev.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-extrabold text-slateblue-900">
                          {ev.title}
                        </p>
                        {ev.detail ? (
                          <p className="mt-1 text-sm leading-relaxed text-slateblue-700">
                            {ev.detail}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => void shareToPlaza(ev)}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            分享到广场
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-4">
              <ScoreRing value={data?.confidence ?? 0} label="自信度" />
              <div>
                <p className="text-sm font-extrabold text-slateblue-900">
                  我的自信度
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slateblue-700">
                  每份证据都在为你加分，越积累越笃定。
                </p>
                <div className="mt-2 w-32">
                  <ProgressBar value={data?.confidence ?? 0} />
                </div>
              </div>
            </Card>
            <Card className="border-softpink-300 bg-softpink-100">
              <p className="text-xs font-black uppercase tracking-wide text-coral-600">
                本周自信总结
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slateblue-900">
                {data?.weeklySummary || '这周还没有记录，去完成一个小任务吧。'}
              </p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidences.map((ev, idx) => {
              const Icon = TYPE_ICONS[ev.type];
              const pink = idx % 2 === 0;
              return (
                <div
                  key={ev.id}
                  className={`flex flex-col rounded-2xl border p-4 shadow-card ${
                    pink
                      ? 'border-softpink-300 bg-softpink-100'
                      : 'border-silver-300 bg-silver-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-coral-500">
                      <Icon className="h-4 w-4" />
                    </span>
                    <Badge tone="coral">{EVIDENCE_TYPE_LABELS[ev.type]}</Badge>
                    <span className="ml-auto text-[11px] font-bold text-slateblue-700">
                      {formatDate(ev.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-extrabold text-slateblue-900">
                    {ev.title}
                  </p>
                  {ev.detail ? (
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slateblue-700">
                      {ev.detail}
                    </p>
                  ) : null}
                  <div className="mt-auto pt-3">
                    <Button
                      variant="outline"
                      className="w-full px-3 py-1.5 text-xs"
                      onClick={() => void shareToPlaza(ev)}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      分享到广场
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="添加证据"
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">标题</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：完成第一份竞品分析"
              className="mt-1 w-full rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">详情</span>
            <textarea
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              rows={3}
              placeholder="做了什么、产出了什么、被谁认可…"
              className="mt-1 w-full resize-none rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">
              标签（逗号分隔）
            </span>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="例如：AI 产品,运营"
              className="mt-1 w-full rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="h-4 w-4 rounded border-silver-400"
            />
            <span className="text-xs font-bold text-slateblue-900">
              公开这份证据到我的『我可以』墙
            </span>
          </label>
          {formError ? (
            <p className="text-xs font-bold text-warmred">{formError}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void submitEvidence()} disabled={saving}>
              {saving ? '保存中…' : '保存证据'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
