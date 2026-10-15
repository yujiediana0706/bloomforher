'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Heart, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ScoreRing,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { OpportunityReport, RoleMatch } from '@/lib/types';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slateblue-700">
        {label}
      </p>
      <div className="mt-0.5 text-xs leading-relaxed text-slateblue-900">
        {children}
      </div>
    </div>
  );
}

function RoleDetails({ role }: { role: RoleMatch }) {
  return (
    <div className="mt-3 border-t border-silver-200 pt-2">
      <DetailRow label="岗位说明">{role.description}</DetailRow>
      <DetailRow label="为什么适合你">{role.whyFit}</DetailRow>
      <DetailRow label="所需技能">
        <div className="flex flex-wrap gap-1">
          {role.requiredSkills.map((s) => (
            <Badge key={s} tone="silver">
              {s}
            </Badge>
          ))}
        </div>
      </DetailRow>
      <DetailRow label="典型工作流">
        <ul className="list-disc space-y-0.5 pl-4">
          {role.typicalWorkflows.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </DetailRow>
      <DetailRow label="取舍">
        <span className="text-slateblue-700">{role.tradeoffs}</span>
      </DetailRow>
    </div>
  );
}

export default function OpportunitiesPage() {
  const { user, loading } = useAuth();
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const data = await apiGet<{ opportunityReport: OpportunityReport | null }>(
        '/api/opportunities'
      );
      setReport(data.opportunityReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const data = await apiSend<{ opportunityReport: OpportunityReport }>(
        '/api/opportunities',
        'POST'
      );
      setReport(data.opportunityReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setGenerating(false);
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
          诊断详情 · AI 机会
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          为你匹配的 AI 岗位
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          匹配度是参考，不是判决——你永远可以探索更多方向。
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="正在匹配 AI 机会…" /> : null}

      {!fetching && !report ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            还没有你的机会报告。点击下方按钮，AI 会基于技能画像生成岗位匹配。
          </p>
          <Button className="mt-4" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                正在生成…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成我的 AI 机会
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {report ? (
        <>
          {/* 岗位推荐 */}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slateblue-900">
              岗位推荐（{report.roleMatches.length}）
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.roleMatches.map((role) => {
                const isOpen = expanded === role.id;
                return (
                  <Card key={role.id} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      <ScoreRing value={role.matchScore} label="匹配度" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-slateblue-900">
                          {role.title}
                        </h4>
                        <Badge tone="pink">{role.category}</Badge>
                        <p className="mt-1 text-xs leading-relaxed text-slateblue-700">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((v) => (v === role.id ? null : role.id))
                      }
                      className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-silver-300 bg-white px-3 py-1.5 text-xs font-bold text-slateblue-700 transition-colors hover:bg-silver-100"
                    >
                      {isOpen ? '收起详情' : '查看详情'}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expanded === role.id ? <RoleDetails role={role} /> : null}
                  </Card>
                );
              })}
            </div>
          </section>

          {/* 女性友好赛道 */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                女性友好赛道
              </h3>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {report.womenFriendlyTracks.map((track) => (
                <Card key={track.title} className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-softpink-200 text-coral-700">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slateblue-900">
                      {track.title}
                    </h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-slateblue-700">
                      {track.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 温和提示 */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                温和提示：可能遇到的顾虑
              </h3>
            </div>
            <div className="space-y-2.5">
              {report.genderRiskHints.map((hint) => (
                <Card
                  key={hint.scenario}
                  className="border-softpink-300 bg-softpink-100"
                >
                  <p className="text-xs font-bold text-slateblue-900">
                    {hint.scenario}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-coral-700">
                    {hint.gentleAdvice}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
