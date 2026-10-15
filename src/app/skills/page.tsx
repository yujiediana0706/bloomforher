'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ProgressBar,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { SkillProfile } from '@/lib/types';

function ScoreBar({ value, tone }: { value: number; tone: 'self' | 'ai' }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-silver-300 bg-silver-100">
      <div
        className={`h-full rounded-full transition-all ${
          tone === 'ai' ? 'bg-coral-500' : 'bg-silver-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SkillsPage() {
  const { user, loading } = useAuth();
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const data = await apiGet<{ skillProfile: SkillProfile | null }>(
        '/api/skills'
      );
      setSkillProfile(data.skillProfile);
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
      const data = await apiSend<{ skillProfile: SkillProfile }>(
        '/api/skills',
        'POST'
      );
      setSkillProfile(data.skillProfile);
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
          诊断详情 · 技能发现
        </p>
        <h1 className="mt-1 text-2xl font-black text-slateblue-900">
          你的技能画像
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          把过往经历翻译成 AI 工作流语言，并重新校准你的自信度。
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {fetching ? <EmptyState text="正在读取你的技能画像…" /> : null}

      {!fetching && !skillProfile ? (
        <Card className="text-center">
          <p className="text-sm text-slateblue-700">
            还没有你的技能画像。点击下方按钮，AI 会基于你的档案生成。
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
                生成我的技能画像
              </>
            )}
          </Button>
        </Card>
      ) : null}

      {skillProfile ? (
        <>
          {/* 独特价值 */}
          <Card className="border-softpink-300 bg-gradient-to-br from-softpink-100 to-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-coral-500">
              你的独特价值
            </p>
            <p className="mt-2 text-base font-extrabold leading-relaxed text-slateblue-900">
              {skillProfile.uniqueValue}
            </p>
          </Card>

          {/* 可迁移技能 */}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slateblue-900">
              可迁移技能（{skillProfile.transferableSkills.length} 项）
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {skillProfile.transferableSkills.map((skill) => (
                <Card key={skill.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slateblue-900">
                      {skill.name}
                    </h4>
                    <span className="shrink-0 rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-black text-coral-700">
                      AI 相关度 {skill.aiRelevance}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={skill.aiRelevance} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-coral-700">
                    证据：{skill.evidence}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slateblue-700">
                    {skill.narrative}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* 自信度矫正板 */}
          <section>
            <h3 className="mb-1 text-sm font-extrabold text-slateblue-900">
              自信度矫正板
            </h3>
            <p className="mb-2 text-xs text-slateblue-700">
              灰条是你的自评，珊瑚色条是 AI 基于证据的客观评分。
            </p>
            <div className="space-y-2.5">
              {skillProfile.confidenceCalibration.map((item) => (
                <Card key={item.dimension}>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slateblue-900">
                      {item.dimension}
                    </h4>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-slateblue-700">
                        自评 {item.selfScore}/10
                      </span>
                      <span className="text-coral-600">
                        AI {item.aiScore}/10
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-[10px] font-bold text-slateblue-700">
                        自评
                      </span>
                      <ScoreBar value={item.selfScore} tone="self" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-[10px] font-bold text-coral-600">
                        AI
                      </span>
                      <ScoreBar value={item.aiScore} tone="ai" />
                    </div>
                  </div>
                  <p className="mt-2 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2 text-xs leading-relaxed text-coral-700">
                    {item.evidenceRef}
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
