import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Compass,
  FileText,
  HeartHandshake,
  Laptop,
  Rocket,
  Target,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { JOURNEY_STEPS } from '@/lib/constants';

const JOURNEY_ICONS: LucideIcon[] = [
  UserPlus,
  Compass,
  Target,
  Laptop,
  CalendarClock,
  Users,
];

/** 每步一句话说明（与旅程图一致） */
const STEP_DESCS: string[] = [
  '说说背景、目标与每周可用时间',
  'AI 从你的经历里找出可迁移能力',
  '看你的职业画像匹配哪些岗位',
  '30 分钟做出第一个 AI 作品',
  '按你的节奏生成 30 天计划，可暂停',
  '对话广场与导师社区，姐妹同行',
];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: FileText,
    title: '职场诊断报告',
    desc: '旅程走完，职业画像自动成形',
  },
  {
    icon: Rocket,
    title: '真实任务模拟',
    desc: '练习即作品，反馈即成长',
  },
  {
    icon: HeartHandshake,
    title: '同辈互助社区',
    desc: '免费 · 我愿同行',
  },
  {
    icon: CalendarClock,
    title: '可执行计划',
    desc: '暂停不等于淘汰',
  },
];

const primaryLink =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-coral-600';
const secondaryLink =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-silver-300 bg-white px-5 py-2.5 text-sm font-bold text-slateblue-900 transition-colors hover:bg-silver-100';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero：一句话定位 */}
      <section className="pt-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-coral-500">
          ReBloom AI · Your experience. A brighter future in the AI era.
        </p>
        <h1 className="mt-4 text-3xl font-black leading-tight text-slateblue-900 sm:text-4xl">
          走完六步，
          <br className="sm:hidden" />
          得到你的
          <span className="text-coral-600">职场诊断报告</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slateblue-700 sm:text-base">
          把经历变成 AI 时代的职业画像——让女性的 AI 选择，从 Why me 走向 Why not me。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding" className={primaryLink}>
            开始职业诊断
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard" className={secondaryLink}>
            查看我的职业画像
          </Link>
        </div>
        <p className="mt-3 text-xs text-slateblue-700">
          演示账号右上角一键切换 · 无需注册
        </p>
      </section>

      {/* 六步旅程（AI Coach 顶部贯穿 · 社区底部贯穿） */}
      <section>
        <Link
          href="/coach"
          className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-softpink-300 bg-softpink-100 px-4 py-3 text-sm font-bold text-coral-700 transition-colors hover:bg-softpink-200"
        >
          <Bot className="h-4 w-4" />
          AI Coach 全程陪伴 · 诊断、答疑、反馈
        </Link>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {JOURNEY_STEPS.map((s, idx) => {
            const Icon = JOURNEY_ICONS[idx];
            return (
              <Link
                key={s.step}
                href={s.href}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-silver-300 bg-white p-4 text-center shadow-card transition-colors hover:border-coral-500 hover:bg-coral-50"
              >
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-black text-white">
                    {s.step}
                  </span>
                </span>
                <span className="text-sm font-extrabold text-slateblue-900">
                  {s.label}
                </span>
                <span className="text-[11px] leading-relaxed text-slateblue-700">
                  {STEP_DESCS[idx]}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/plaza"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-softpink-300 bg-softpink-100 px-4 py-3 text-sm font-bold text-coral-700 transition-colors hover:bg-softpink-200"
        >
          <HeartHandshake className="h-4 w-4" />
          社区支持贯穿全程 · 对话广场「我愿同行」· 导师社区
        </Link>
      </section>

      {/* Key Features */}
      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-2xl border border-silver-300 bg-white p-4 shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-softpink-200 text-coral-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slateblue-900">
                    {f.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slateblue-700">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
