'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/client';
import {
  Badge,
  Card,
  EmptyState,
  ProgressBar,
  ScoreRing,
  SectionTitle,
} from '@/components/ui';
import { JourneyBanner } from '@/components/JourneyBanner';
import { EVIDENCE_TYPE_LABELS, LIFE_STAGE_LABELS } from '@/lib/constants';
import type { EvidenceItem, UserProfile } from '@/lib/types';

interface BreakdownItem {
  type: string;
  label: string;
  count: number;
  weight: number;
}

interface Impact {
  mentors: number;
  womenSupported: number;
  evidences: number;
  plazaConnections: number;
  avgConfidenceLift: number;
}

interface DashboardData {
  user: UserProfile;
  confidence: number;
  breakdown: BreakdownItem[];
  nextTasks: { title: string; href: string }[];
  recentEvidence: EvidenceItem[];
  impact: Impact;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await apiGet<DashboardData>('/api/dashboard');
        setData(res);
      } catch {
        setData(null);
      }
    })();
  }, [user]);

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

  if (!data) {
    return <p className="text-sm text-slateblue-700">加载中…</p>;
  }

  const breakdown = data.breakdown;
  const maxWeight = breakdown.reduce((m, b) => Math.max(m, b.weight), 1);

  const impactItems: { label: string; value: number; icon: React.ReactNode }[] = [
    { label: '入驻导师', value: data.impact.mentors, icon: <Award className="h-4 w-4" /> },
    {
      label: '被支持女性',
      value: data.impact.womenSupported,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: '沉淀证据',
      value: data.impact.evidences,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      label: '同辈连接',
      value: data.impact.plazaConnections,
      icon: <Heart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <SectionTitle
        eyebrow="个人中心"
        title={`你好，${data.user.name}`}
        desc={data.user.backgroundSummary || '继续积累你的证据，让每一步都算数。'}
      />

      <JourneyBanner currentStep={data.user.journeyStep} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-4">
          <ScoreRing value={data.confidence} size={104} label="自信度" />
          <div>
            <p className="text-sm font-extrabold text-slateblue-900">
              自信度仪表
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge tone="pink">
                {LIFE_STAGE_LABELS[data.user.lifeStage]}
              </Badge>
              <Badge tone="silver">站点阶段 {data.user.journeyStep}/6</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slateblue-700">
              由证据类型与数量加权计算，上限 100。
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <p className="mb-3 text-sm font-extrabold text-slateblue-900">
            自信度构成
          </p>
          {breakdown.length === 0 ? (
            <p className="text-xs text-slateblue-700">
              还没有证据，去完成一次技能发现吧。
            </p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((b) => (
                <div key={b.type}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slateblue-900">
                    <span>{b.label}</span>
                    <span className="text-slateblue-700">
                      {b.count} 条 · 权重 {b.weight}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.round((b.weight / maxWeight) * 100)}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <p className="mb-3 text-sm font-extrabold text-slateblue-900">
          下一步任务 Top3
        </p>
        {data.nextTasks.length === 0 ? (
          <EmptyState text="所有主线任务都已完成，去广场帮助其他同路人吧。" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {data.nextTasks.map((t) => (
              <Link key={t.href + t.title} href={t.href}>
                <Card className="flex h-full items-center justify-between gap-2 transition-colors hover:bg-coral-50">
                  <span className="text-sm font-bold text-slateblue-900">
                    {t.title}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-coral-500" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-slateblue-900">
              最近证据高光
            </p>
            <Link
              href="/evidence"
              className="text-xs font-bold text-coral-600 hover:underline"
            >
              查看全部 →
            </Link>
          </div>
          {data.recentEvidence.length === 0 ? (
            <p className="text-xs text-slateblue-700">
              还没有证据——完成一次技能发现，让第一份『我可以』自动出现
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentEvidence.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start gap-2 rounded-xl border border-silver-200 bg-silver-50 px-3 py-2"
                >
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slateblue-900">
                      {ev.title}
                    </p>
                    <p className="text-[11px] font-bold text-slateblue-700">
                      {EVIDENCE_TYPE_LABELS[ev.type] ?? ev.type}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-extrabold text-slateblue-900">
            我的影响力
          </p>
          <div className="grid grid-cols-2 gap-3">
            {impactItems.map((it) => (
              <div
                key={it.label}
                className="rounded-xl border border-silver-200 bg-silver-50 px-3 py-3"
              >
                <div className="flex items-center gap-1.5 text-coral-500">
                  {it.icon}
                  <span className="text-lg font-black text-slateblue-900">
                    {it.value}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slateblue-700">
                  {it.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2">
            <p className="text-xs font-bold text-slateblue-900">
              社区平均自信度提升：+{data.impact.avgConfidenceLift}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
