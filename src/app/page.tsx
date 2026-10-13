import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CalendarClock,
  FileText,
  HeartHandshake,
  Laptop,
  type LucideIcon,
} from 'lucide-react';

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
    desc: '生成你的职场诊断报告与 30 天计划',
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
const EXTRA_BLOCKS: { icon: LucideIcon; title: string; desc: string; href: string }[] = [
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
          三步，
          <br className="sm:hidden" />
          从
          <span className="text-coral-600">职业诊断</span>
          到一路同行
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slateblue-700 sm:text-base">
          生成职场诊断报告与计划 → AI Mentor 陪你执行 → 对话广场链接真人。让女性的 AI 选择，从 Why me 走向 Why not me。
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

      {/* 核心链路三步 */}
      <section>
        <div className="grid gap-3 md:grid-cols-3">
          {CORE_BLOCKS.map((b, idx) => {
            const Icon = b.icon;
            return (
              <Link
                key={b.title}
                href={b.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-silver-300 bg-white p-6 text-center shadow-card transition-colors hover:border-coral-500 hover:bg-coral-50"
              >
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-black text-white">
                    {idx + 1}
                  </span>
                </span>
                <span className="text-base font-extrabold text-slateblue-900">
                  {b.title}
                </span>
                <span className="text-xs leading-relaxed text-slateblue-700">
                  {b.desc}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Extra 增值功能 */}
        <div className="mt-6 rounded-2xl border border-dashed border-silver-300 bg-white/60 p-4">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-slateblue-700/70">
            Extra · 增值功能
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {EXTRA_BLOCKS.map((b) => {
              const Icon = b.icon;
              return (
                <Link
                  key={b.title}
                  href={b.href}
                  className="flex items-center gap-3 rounded-xl border border-silver-200 bg-white px-4 py-3 transition-colors hover:border-coral-400 hover:bg-coral-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-softpink-200 text-coral-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slateblue-900">
                      {b.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slateblue-700">
                      {b.desc}
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slateblue-700/50" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
