'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Baby,
  BellRing,
  Bot,
  BrainCog,
  CalendarClock,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  HeartHandshake,
  Laptop,
  type LucideIcon,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

/* —— Hero 右侧插画（AI 女性侧脸 × 神经网络光效）—— */
const HERO_IMG =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Elegant%20glowing%20neon%20line%20art%20portrait%20of%20a%20woman%20in%20profile%20silhouette%20merging%20with%20flowing%20AI%20neural%20network%20lines%20and%20light%20particles%2C%20coral%20pink%20and%20warm%20silver%20gradient%2C%20futuristic%20minimal%2C%20soft%20dreamy%20light%2C%20clean%20light%20background%2C%20high%20detail&image_size=portrait_4_3';

/** 雷达图演示数据（对应自信度校准六维） */
const RADAR_DATA = [
  { dim: '技术效能', v: 6.5 },
  { dim: '工具就绪', v: 5.8 },
  { dim: '空窗价值', v: 5.2 },
  { dim: '领域迁移', v: 7.0 },
  { dim: '问题拆解', v: 7.5 },
  { dim: '质量判断', v: 8.0 },
];

/** Hero 右侧功能浮卡 */
const HERO_FLOATS: { icon: LucideIcon; text: string }[] = [
  { icon: CheckCircle2, text: '职业画像已生成' },
  { icon: BrainCog, text: '可迁移技能 5 项' },
  { icon: BellRing, text: '今日提醒：重写简历' },
];

/** 平台服务的用户群体（与 onboarding 生命阶段对齐） */
const PERSONAS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: GraduationCap,
    title: '在校探索',
    desc: '快毕业了，不知道 AI 时代自己能做什么',
  },
  {
    icon: Compass,
    title: '职业迷茫',
    desc: '工作几年想转 AI，不知从哪开始',
  },
  {
    icon: Baby,
    title: '产后回归',
    desc: '空窗一两年，怕跟不上、不敢投简历',
  },
  {
    icon: Clock,
    title: '兼职过渡',
    desc: '要兼顾家庭，需要灵活节奏的转型',
  },
];

/** 核心用户链路：诊断 → AI Mentor 陪伴 → 真人社区 */
const CORE_BLOCKS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
}[] = [
  {
    icon: FileText,
    title: '职业诊断',
    desc: '建档 · 技能 · 机会，生成职业画像',
    href: '/onboarding',
  },
  {
    icon: Bot,
    title: 'AI Mentor 陪伴',
    desc: '提醒计划进度，随时对话，越用越懂你',
    href: '/coach',
  },
  {
    icon: HeartHandshake,
    title: '对话广场',
    desc: '链接真人姐妹 · 我愿同行',
    href: '/plaza',
  },
];

/** 增值功能（Extra） */
const EXTRA_BLOCKS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
}[] = [
  {
    icon: Laptop,
    title: '实操任务',
    desc: '30 分钟做出第一个作品',
    href: '/tasks-lab',
  },
  {
    icon: CalendarClock,
    title: '付费教练',
    desc: '认证导师 · 预约担保',
    href: '/community',
  },
];

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-coral-500 px-6 py-3 text-sm font-bold text-white shadow-card transition hover:bg-coral-600';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-silver-300 bg-white px-6 py-3 text-sm font-bold text-slateblue-900 transition hover:bg-silver-100';

export default function HomePage() {
  return (
    <div className="hero-warm rounded-[2rem] border border-white/70 p-4 shadow-card sm:p-6 lg:p-8">
      {/* Hero：左文右图（≥768px 并排，贴近 mockup 布局） */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="pt-2 lg:pt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-500">
            ReBloom AI · Your experience. A brighter future in the AI era.
          </p>
          <h1 className="mt-4 text-3xl font-black leading-[1.18] text-slateblue-900 sm:text-[2.6rem]">
            走完三步，得到你的
            <span className="text-coral-500">职场诊断报告</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slateblue-700 sm:text-base">
            把经历变成 AI 时代的职业画像，AI Mentor 陪你执行计划，对话广场链接真人——让女性的
            AI 选择，从 Why me 走向 Why not me。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/onboarding" className={primaryBtn}>
              开始职业诊断
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className={secondaryBtn}>
              查看我的职业画像
            </Link>
          </div>
          <p className="mt-3 text-xs text-slateblue-700/80">
            演示账号右上角一键切换 · 无需注册
          </p>
        </div>

        {/* 右侧视觉区：插画 + 挂边雷达卡 + 右下浮卡 */}
        <div className="relative mx-auto h-[360px] w-full max-w-md sm:h-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMG}
            alt="AI 时代的女性职业画像"
            className="absolute inset-0 h-full w-full rounded-[2rem] object-cover object-[center_18%]"
          />
          {/* 雷达图浮卡：挂在左缘外，避开人物面部 */}
          <div className="absolute -left-3 top-12 w-36 rounded-2xl bg-white/95 p-2 shadow-lg backdrop-blur sm:-left-6 sm:top-16 sm:w-40 sm:p-2.5">
            <p className="text-center text-[10px] font-black text-slateblue-900 sm:text-[11px]">
              职业画像
            </p>
            <ResponsiveContainer width="100%" height={104}>
              <RadarChart data={RADAR_DATA} outerRadius="78%">
                <PolarGrid stroke="#d7dbe2" />
                <PolarAngleAxis
                  dataKey="dim"
                  tick={{ fontSize: 8, fill: '#3e4c63' }}
                />
                <Radar
                  dataKey="v"
                  stroke="#E8725C"
                  strokeWidth={2}
                  fill="#F3B8C8"
                  fillOpacity={0.55}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* 功能浮卡：右下挂边（窄屏隐藏） */}
          <div className="absolute -right-2 bottom-6 hidden w-44 space-y-1.5 rounded-2xl bg-white/95 p-2.5 shadow-lg backdrop-blur sm:block">
            {HERO_FLOATS.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-softpink-200 text-coral-600">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[11px] font-bold text-slateblue-900">
                    {f.text}
                  </span>
                </div>
              );
            })}
          </div>
          {/* 光点装饰 */}
          <span className="absolute -left-1 top-1/2 h-2.5 w-2.5 rounded-full bg-coral-300 shadow-[0_0_12px_rgba(232,114,92,0.8)]" />
          <span className="absolute bottom-10 left-10 h-1.5 w-1.5 rounded-full bg-softpink-400 shadow-[0_0_10px_rgba(243,184,200,0.9)]" />
        </div>
      </section>

      {/* AI Mentor 玻璃胶囊横条 */}
      <Link
        href="/coach"
        className="glass-pill mt-7 flex items-center justify-center gap-2 rounded-full border border-white/80 px-4 py-3 text-sm font-bold text-slateblue-900 transition hover:shadow-card"
      >
        <Bot className="h-4 w-4 text-coral-500" />
        AI Mentor 全程陪伴 · 提醒、答疑、反馈
      </Link>

      {/* 核心链路三步（横向大圆角卡） */}
      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {CORE_BLOCKS.map((b, idx) => {
          const Icon = b.icon;
          return (
            <Link
              key={b.title}
              href={b.href}
              className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-softpink-200 text-coral-600">
                <Icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-[10px] font-black text-white">
                  {idx + 1}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-black text-slateblue-900">
                  {b.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slateblue-700">
                  {b.desc}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      {/* 我们为谁而做 */}
      <section className="mt-8">
        <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-slateblue-700/70">
          我们为谁而做
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-3xl border border-white/80 bg-white/70 px-4 py-3.5 shadow-card backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-coral-600" />
                  <span className="text-sm font-extrabold text-slateblue-900">
                    {p.title}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slateblue-700">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 text-center text-xs text-slateblue-700/80">
          以及每一个想在 AI 时代重新出发的你。
        </p>
      </section>

      {/* Extra 增值功能 */}
      <section className="mt-8">
        <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-slateblue-700/70">
          Extra · 增值功能
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {EXTRA_BLOCKS.map((b) => {
            const Icon = b.icon;
            return (
              <Link
                key={b.title}
                href={b.href}
                className="flex items-center gap-4 rounded-3xl bg-white/70 p-5 shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-softpink-200 text-coral-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black text-slateblue-900">
                    {b.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slateblue-700">
                    {b.desc}
                  </span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slateblue-700/40" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
