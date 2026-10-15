'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiSend } from '@/lib/client';
import { LIFE_STAGE_DESCRIPTIONS, LIFE_STAGE_LABELS } from '@/lib/constants';
import type { LifeStage, Segment, UserConstraints } from '@/lib/types';

const TOTAL_STEPS = 8;

const LIFE_STAGE_ORDER: LifeStage[] = [
  'student',
  'early_career',
  'growth',
  'pregnancy_planning',
  'parental_leave',
  'returning_parent',
  'parttime_transition',
];

interface ConfidenceQuestion {
  key: string;
  label: string;
  desc: string;
}

const CONFIDENCE_QUESTIONS: ConfidenceQuestion[] = [
  {
    key: 'techSelfEfficacy',
    label: '技术自我效能感',
    desc: '我对自己学习和使用 AI / 技术工具的能力有信心。',
  },
  {
    key: 'aiToolReadiness',
    label: 'AI 工具就绪度',
    desc: '我能够把 AI 工具真正用进日常工作与场景。',
  },
  {
    key: 'gapValue',
    label: '职业空窗价值感',
    desc: '我相信空窗 / 照护期也沉淀了可迁移的能力。',
  },
  {
    key: 'domainTransfer',
    label: '领域迁移能力',
    desc: '我能把原有行业经验迁移到 AI 相关场景。',
  },
  {
    key: 'problemDecompose',
    label: '问题拆解',
    desc: '我能把复杂问题拆成可执行的步骤。',
  },
  {
    key: 'ethicsJudgment',
    label: '伦理判断',
    desc: '我能判断 AI 输出是否可靠、是否符合伦理。',
  },
];

const COACH_LINES: Record<number, string> = {
  1: '你好呀，我是你的 AI Coach。先认识一下你——这些信息会帮我把后面的画像做得更贴合你，不着急，慢慢填。',
  2: '把你走过的路写下来就好，不用「润色」成漂亮的简历。真实经历里藏着很多可迁移的能力。',
  3: '目标可以同时有几个，方向也可以中途调整。告诉我你现在的约束，我来帮你设计一个能做到的节奏。',
  4: '简历是可选的。原型阶段我们只记录文件名，真正的解析会在接入 AI 后完成。',
  5: '你现在所处的人生阶段会直接影响计划节奏——它没有好坏，只有不同的安排方式。',
  6: '接下来是自信度自评。请凭直觉打分，没有标准答案；我稍后会基于你的证据做客观校准。',
  7: '最后三题啦。记住：女性常常系统性低估自己，你打的分可能比真实能力要低。',
  8: '确认一下信息，我这就为你生成技能画像、AI 机会与 30 天回归计划。你只需要点一下「完成」。',
};

const inputCls =
  'w-full rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [backgroundSummary, setBackgroundSummary] = useState('');
  const [constraints, setConstraints] = useState({
    returnToWork: false,
    newIndustry: false,
    flexibility: false,
  });
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [resumeName, setResumeName] = useState('');
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null);
  const [confidence, setConfidence] = useState<Record<string, number>>(
    () => Object.fromEntries(CONFIDENCE_QUESTIONS.map((q) => [q.key, 5]))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 登录后预填已有档案
  React.useEffect(() => {
    if (!user) return;
    setName((v) => v || user.name);
    setCurrentRole((v) => v || user.currentRole);
    setTargetRole((v) => v || user.targetRole);
    setBackgroundSummary((v) => v || user.backgroundSummary);
    setResumeName((v) => v || user.resumePath || '');
    setLifeStage((v) => v ?? user.lifeStage);
    setConstraints((c) => ({
      returnToWork: c.returnToWork || user.constraints.returnToWork,
      newIndustry: c.newIndustry || user.constraints.newIndustry,
      flexibility: c.flexibility || user.constraints.flexibility,
    }));
  }, [user]);

  function toggleConstraint(key: keyof typeof constraints) {
    setConstraints((c) => ({ ...c, [key]: !c[key] }));
  }

  function setConfidenceValue(key: string, value: number) {
    setConfidence((c) => ({ ...c, [key]: value }));
  }

  async function handleFinish() {
    if (!user) return;
    if (!name.trim()) {
      setError('请先填写你的姓名');
      setStep(1);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const values = CONFIDENCE_QUESTIONS.map((q) => confidence[q.key] ?? 5);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const confidenceSelf = Math.max(1, Math.min(10, Math.round(avg)));

      const goals: string[] = [];
      if (constraints.returnToWork) goals.push('重返职场');
      if (constraints.newIndustry) goals.push('换行业');
      if (constraints.flexibility) goals.push('灵活办公');

      const segment: Segment =
        constraints.returnToWork ||
        constraints.newIndustry ||
        (lifeStage ?? 'student') !== 'student'
          ? 'setter'
          : 'explorer';

      const payloadConstraints: UserConstraints = {
        returnToWork: constraints.returnToWork,
        newIndustry: constraints.newIndustry,
        flexibility: constraints.flexibility,
        weeklyHours,
      };

      await apiSend('/api/profile', 'POST', {
        name: name.trim(),
        currentRole: currentRole.trim(),
        targetRole: targetRole.trim(),
        backgroundSummary,
        constraints: payloadConstraints,
        lifeStage: lifeStage ?? 'student',
        confidenceSelf,
        goals,
        skills: [],
        segment,
        resumePath: resumeName.trim() || undefined,
      });
      await apiSend('/api/skills', 'POST');
      await apiSend('/api/opportunities', 'POST');
      await refresh();
      router.push('/coach');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState text="正在加载你的档案…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState text="请先登录（可用右上角切换演示账号）" />
      </div>
    );
  }

  const confidenceSlice =
    step === 6 ? CONFIDENCE_QUESTIONS.slice(0, 3) : CONFIDENCE_QUESTIONS.slice(3, 6);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        eyebrow={`Step ${step} / ${TOTAL_STEPS}`}
        title="建立你的专属档案"
        desc="约 8 屏，几分钟就能完成；中途退出也没关系，信息会随账号保存。"
      />

      <div className="mb-4">
        <ProgressBar value={(step / TOTAL_STEPS) * 100} />
      </div>

      {/* AI Coach 气泡引导语 */}
      <div className="mb-4 rounded-2xl border border-softpink-300 bg-softpink-100 p-3">
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white">
            <Bot className="h-4 w-4" />
          </span>
          <p className="text-sm leading-relaxed text-slateblue-800">
            {COACH_LINES[step]}
          </p>
        </div>
      </div>

      <Card>
        {/* ① 姓名 + 岗位 */}
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                你的姓名
              </label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：林薇"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                当前岗位
              </label>
              <input
                className={inputCls}
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="如：小学数学老师 / 全职妈妈"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                目标岗位
              </label>
              <input
                className={inputCls}
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="如：AI 运营 / AI 产品经理"
              />
            </div>
          </div>
        ) : null}

        {/* ② 过往经历 */}
        {step === 2 ? (
          <div>
            <label className="mb-1 block text-sm font-bold text-slateblue-900">
              过往经历（背景总结）
            </label>
            <p className="mb-2 text-xs text-slateblue-700">
              写下你做过的项目、承担的角色、解决过的问题——越具体，画像越准。
            </p>
            <textarea
              className={`${inputCls} min-h-[160px] resize-y`}
              value={backgroundSummary}
              onChange={(e) => setBackgroundSummary(e.target.value)}
              placeholder="示例：带过 6 个班级的数学课，主导过校内线上答疑群，把家长常见问题整理成可复用的问答模板……"
            />
          </div>
        ) : null}

        {/* ③ 目标与约束 */}
        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-bold text-slateblue-900">
                职业目标与约束（可多选）
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={constraints.returnToWork}
                  onClick={() => toggleConstraint('returnToWork')}
                >
                  重返职场
                </Chip>
                <Chip
                  active={constraints.newIndustry}
                  onClick={() => toggleConstraint('newIndustry')}
                >
                  换行业
                </Chip>
                <Chip
                  active={constraints.flexibility}
                  onClick={() => toggleConstraint('flexibility')}
                >
                  灵活办公
                </Chip>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                每周可投入小时数
              </label>
              <input
                type="number"
                min={1}
                max={60}
                className={inputCls}
                value={weeklyHours}
                onChange={(e) =>
                  setWeeklyHours(Math.max(1, Number(e.target.value) || 1))
                }
              />
              <p className="mt-1 text-xs text-slateblue-700">
                AI 会按这个时长安排可中断的节奏，不必勉强。
              </p>
            </div>
          </div>
        ) : null}

        {/* ④ 简历上传 */}
        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-slateblue-900">
              上传简历（可选）
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-silver-400 bg-silver-50 px-6 py-8 text-center transition-colors hover:border-coral-500 hover:bg-coral-50">
              <Upload className="h-5 w-5 text-coral-500" />
              <span className="text-sm font-bold text-slateblue-900">
                点击选择文件
              </span>
              <span className="text-xs text-slateblue-700">
                原型阶段仅记录文件名，不会真正上传
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setResumeName(f.name);
                }}
              />
            </label>
            {resumeName ? (
              <div className="flex items-center gap-2 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2 text-sm font-bold text-coral-700">
                <FileText className="h-4 w-4" />
                {resumeName}
                <button
                  type="button"
                  onClick={() => setResumeName('')}
                  className="ml-auto text-xs font-bold text-slateblue-700 hover:text-coral-600"
                >
                  移除
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ⑤ 人生阶段 */}
        {step === 5 ? (
          <div>
            <p className="mb-3 text-sm font-bold text-slateblue-900">
              你当前所处的人生阶段
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LIFE_STAGE_ORDER.map((stage) => {
                const active = lifeStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setLifeStage(stage)}
                    className={`rounded-2xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-coral-500 bg-coral-50'
                        : 'border-silver-300 bg-white hover:bg-silver-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? 'border-coral-500 bg-coral-500 text-white'
                            : 'border-silver-400'
                        }`}
                      >
                        {active ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="text-sm font-bold text-slateblue-900">
                        {LIFE_STAGE_LABELS[stage]}
                      </span>
                    </div>
                    <p className="mt-1 pl-7 text-xs leading-relaxed text-slateblue-700">
                      {LIFE_STAGE_DESCRIPTIONS[stage]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ⑥ AI 自信度量表（分两屏） */}
        {step === 6 || step === 7 ? (
          <div className="space-y-5">
            <p className="text-sm font-bold text-slateblue-900">
              AI 自信度自评（1-10 分，凭直觉）
            </p>
            {confidenceSlice.map((q) => (
              <div key={q.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slateblue-900">
                    {q.label}
                  </span>
                  <Badge tone="pink">{confidence[q.key] ?? 5} / 10</Badge>
                </div>
                <p className="mb-2 text-xs text-slateblue-700">{q.desc}</p>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={confidence[q.key] ?? 5}
                  onChange={(e) =>
                    setConfidenceValue(q.key, Number(e.target.value))
                  }
                  className="w-full cursor-pointer accent-coral-500"
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* ⑧ 确认与完成 */}
        {step === 8 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-coral-500" />
              <p className="text-sm font-bold text-slateblue-900">
                确认你的信息
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['姓名', name || '—'],
                ['当前岗位', currentRole || '—'],
                ['目标岗位', targetRole || '—'],
                ['人生阶段', lifeStage ? LIFE_STAGE_LABELS[lifeStage] : '—'],
                ['每周可投入', `${weeklyHours} 小时`],
                [
                  '职业目标',
                  [
                    constraints.returnToWork ? '重返职场' : '',
                    constraints.newIndustry ? '换行业' : '',
                    constraints.flexibility ? '灵活办公' : '',
                  ]
                    .filter(Boolean)
                    .join('、') || '—',
                ],
                ['简历', resumeName || '未上传（可选）'],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-start justify-between gap-4 rounded-xl bg-silver-50 px-3 py-2"
                >
                  <dt className="shrink-0 font-bold text-slateblue-700">{k}</dt>
                  <dd className="text-right text-slateblue-900">{v}</dd>
                </div>
              ))}
            </dl>
            {error ? (
              <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {error && step !== 8 ? (
          <p className="mt-4 rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
            {error}
          </p>
        ) : null}

        {/* 导航 */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={step === 1 || saving}
            onClick={() => {
              setError('');
              setStep((s) => Math.max(1, s - 1));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            上一步
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => {
                setError('');
                setStep((s) => Math.min(TOTAL_STEPS, s + 1));
              }}
            >
              下一步
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  正在生成…
                </>
              ) : (
                '完成，生成我的画像'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
