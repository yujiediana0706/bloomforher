'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Heart,
  Lightbulb,
  RefreshCw,
  Rocket,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ScoreRing,
  SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { OpportunityReport, RoleMatch } from '@/lib/types';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slateblue-700">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed text-slateblue-900">
        {children}
      </div>
    </div>
  );
}

function RoleDetails({ role }: { role: RoleMatch }) {
  return (
    <div className="mt-4 border-t border-silver-200 pt-2">
      <DetailRow label="岗位说明">{role.description}</DetailRow>
      <DetailRow label="为什么适合你">{role.whyFit}</DetailRow>
      <DetailRow label="所需技能">
        <div className="flex flex-wrap gap-1.5">
          {role.requiredSkills.map((s) => (
            <Badge key={s} tone="silver">
              {s}
            </Badge>
          ))}
        </div>
      </DetailRow>
      <DetailRow label="典型工作流">
        <ul className="list-disc space-y-1 pl-5">
          {role.typicalWorkflows.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </DetailRow>
      <DetailRow label="真实案例">
        <ul className="list-disc space-y-1 pl-5">
          {role.realWorldExamples.map((e) => (
            <li key={e}>{e}</li>
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
  const router = useRouter();
  const { user, loading } = useAuth();
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

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

  function toggleSelected(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  if (loading) {
    return <EmptyState text="正在加载…" />;
  }
  if (!user) {
    return <EmptyState text="请先登录（可用右上角切换演示账号）" />;
  }

  const compared = report
    ? report.roleMatches.filter((r) => selected.includes(r.id))
    : [];

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Journey ③ AI 机会"
        title="为你匹配的 AI 岗位"
        desc="基于你的技能画像做匹配；匹配度是参考，不是判决——你永远可以探索更多方向。"
      />

      {fetching ? <EmptyState text="正在匹配 AI 机会…" /> : null}

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slateblue-900">
                岗位推荐（{report.roleMatches.length}）
              </h3>
              <Button
                variant={compareMode ? 'primary' : 'secondary'}
                onClick={() => {
                  setCompareMode((v) => !v);
                  if (compareMode) setSelected([]);
                }}
              >
                {compareMode ? '退出对比' : '对比岗位'}
              </Button>
            </div>
            {compareMode ? (
              <p className="mb-3 text-xs text-slateblue-700">
                选择 2 个岗位并排比较（已选 {selected.length}/2）。
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {report.roleMatches.map((role) => {
                const isOpen = compareMode
                  ? selected.includes(role.id)
                  : expanded === role.id;
                return (
                  <Card key={role.id} className="flex flex-col">
                    <div className="flex items-start gap-4">
                      <ScoreRing value={role.matchScore} label="匹配度" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-slateblue-900">
                          {role.title}
                        </h4>
                        <div className="mt-1">
                          <Badge tone="pink">{role.category}</Badge>
                        </div>
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slateblue-700">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        compareMode
                          ? toggleSelected(role.id)
                          : setExpanded((v) => (v === role.id ? null : role.id))
                      }
                      className={`mt-4 flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                        compareMode && selected.includes(role.id)
                          ? 'border-coral-500 bg-coral-50 text-coral-600'
                          : 'border-silver-300 bg-white text-slateblue-700 hover:bg-silver-100'
                      }`}
                    >
                      {compareMode
                        ? selected.includes(role.id)
                          ? '已加入对比'
                          : '加入对比'
                        : '查看详情'}
                      {!compareMode ? (
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      ) : null}
                    </button>

                    {!compareMode && expanded === role.id ? (
                      <RoleDetails role={role} />
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>

          {/* 对比结果 */}
          {compareMode && compared.length === 2 ? (
            <section>
              <h3 className="mb-3 text-sm font-extrabold text-slateblue-900">
                岗位对比
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {compared.map((role) => (
                  <Card key={role.id} className="border-coral-100">
                    <div className="flex items-center gap-3">
                      <ScoreRing value={role.matchScore} size={72} label="匹配度" />
                      <div>
                        <h4 className="text-sm font-extrabold text-slateblue-900">
                          {role.title}
                        </h4>
                        <Badge tone="pink">{role.category}</Badge>
                      </div>
                    </div>
                    <RoleDetails role={role} />
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* 女性友好赛道 */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                女性友好赛道
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.womenFriendlyTracks.map((track) => (
                <Card key={track.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-softpink-200 text-coral-700">
                    <Heart className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slateblue-900">
                      {track.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slateblue-700">
                      {track.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 性别风险提示（温和） */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-coral-500" />
              <h3 className="text-sm font-extrabold text-slateblue-900">
                温和提示：可能遇到的顾虑
              </h3>
            </div>
            <div className="space-y-3">
              {report.genderRiskHints.map((hint) => (
                <Card
                  key={hint.scenario}
                  className="border-softpink-300 bg-softpink-100"
                >
                  <p className="text-sm font-bold text-slateblue-900">
                    {hint.scenario}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-coral-700">
                    {hint.gentleAdvice}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* 下一步 */}
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slateblue-700">
              光看不够，动手才算数。去实操任务里做出你的第一个 AI 作品吧。
            </p>
            <Button onClick={() => router.push('/tasks-lab')}>
              <Rocket className="h-4 w-4" />
              去做实操任务
            </Button>
          </Card>
        </>
      ) : null}
    </div>
  );
}
