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

/** 首页四大板块（六步旅程打包为 4 块，内页仍按 6 步推进） */
const BLOCKS: {
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
    icon: Laptop,
    title: '实操任务',
    desc: '30 分钟做出第一个作品',
    href: '/tasks-lab',
  },
  {
    icon: CalendarClock,
    title: '回归计划',
    desc: '按你的节奏，可暂停',
    href: '/plan',
  },
  {
    icon: HeartHandshake,
    title: '同辈社区',
    desc: '对话广场「我愿同行」',
    href: '/plaza',
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
          走完四步，
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

      {/* 四大板块（AI Coach 顶部贯穿） */}
      <section>
        <Link
          href="/coach"
          className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-softpink-300 bg-softpink-100 px-4 py-3 text-sm font-bold text-coral-700 transition-colors hover:bg-softpink-200"
        >
          <Bot className="h-4 w-4" />
          AI Coach 全程陪伴 · 诊断、答疑、反馈
        </Link>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {BLOCKS.map((b, idx) => {
            const Icon = b.icon;
            return (
              <Link
                key={b.title}
                href={b.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-silver-300 bg-white p-5 text-center shadow-card transition-colors hover:border-coral-500 hover:bg-coral-50"
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
      </section>
    </div>
  );
}
