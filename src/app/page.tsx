import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  FileText,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';

/** Home "What we offer": the three steps of the core journey */
const WHATS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
}[] = [
  {
    icon: FileText,
    title: 'Career Diagnosis',
    desc: 'One report to clarify your direction',
    href: '/onboarding',
  },
  {
    icon: Bot,
    title: 'AI Mentor',
    desc: 'Guides you through your plan',
    href: '/coach',
  },
  {
    icon: HeartHandshake,
    title: 'Community Plaza',
    desc: 'Talk with fellow travelers',
    href: '/plaza',
  },
];

export default function HomePage() {
  return (
    <div className="hero-warm relative overflow-hidden rounded-[2rem] border border-white/70 px-6 py-20 text-center shadow-card sm:py-24">
      {/* Background decoration: soft glow, petal outlines, light dots (non-interactive, never covers text) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[2rem]"
      >
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-softpink-300/50 blur-3xl" />
        <div className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full bg-coral-200/40 blur-3xl" />
        {/* Five-petal flower outline (the ReBloom blooming motif) */}
        <svg
          className="absolute -right-8 top-8 h-44 w-44 rotate-12 text-coral-400/30 sm:h-56 sm:w-56"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="50"
              cy="29"
              rx="11"
              ry="19"
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="6" />
        </svg>
        {/* Small petal at bottom-left */}
        <svg
          className="absolute -left-10 bottom-10 h-32 w-32 -rotate-12 text-softpink-400/40"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="50"
              cy="29"
              rx="11"
              ry="19"
              transform={`rotate(${a} 50 50)`}
            />
          ))}
        </svg>
        {/* Light dots */}
        <span className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-coral-300 shadow-[0_0_12px_rgba(232,114,92,0.7)]" />
        <span className="absolute right-[24%] top-[52%] h-1.5 w-1.5 rounded-full bg-softpink-400 shadow-[0_0_10px_rgba(243,184,200,0.9)]" />
        <span className="absolute bottom-[18%] right-[14%] h-2.5 w-2.5 rounded-full bg-coral-200 shadow-[0_0_14px_rgba(232,114,92,0.6)]" />
      </div>

      {/* Main content */}
      <div className="relative">
        <p className="flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-coral-500">
          <span className="h-px w-8 bg-coral-300" />
          ReBloom AI
          <span className="h-px w-8 bg-coral-300" />
        </p>

        <h1 className="mx-auto mt-6 max-w-xl text-4xl font-black leading-[1.22] tracking-tight text-slateblue-900 sm:text-[3.4rem]">
          Turn your experience into
          <br />
          <span className="text-coral-500">a new career in the AI era</span>
        </h1>

        <p className="mt-5 text-base font-bold text-slateblue-700">
          &ldquo;From Why me, to Why not me.&rdquo;
        </p>

        <div className="mt-9 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-9 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-coral-600"
          >
            Start your free career diagnosis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-5 text-xs text-slateblue-700/80">
          For women exploring student life, facing career uncertainty, returning
          after parental leave, or transitioning through part-time work
        </p>

        {/* What we offer */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 md:grid-cols-3">
          {WHATS.map((w, i) => {
            const Icon = w.icon;
            return (
              <Link
                key={w.title}
                href={w.href}
                className="relative flex flex-col items-center gap-2.5 rounded-3xl bg-white/80 p-7 shadow-card backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              >
                <span className="absolute right-5 top-4 text-xs font-black text-coral-300">
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-softpink-200 text-coral-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-base font-black tracking-wide text-slateblue-900">
                  {w.title}
                </span>
                <span className="text-xs text-slateblue-700">{w.desc}</span>
              </Link>
            );
          })}
        </div>

        <p className="mt-9 text-xs text-slateblue-700/70">
          Plus{' '}
          <Link href="/tasks-lab" className="underline decoration-coral-300 underline-offset-4 transition-colors hover:text-coral-600">
            Hands-on Tasks
          </Link>{' '}
          and{' '}
          <Link href="/community" className="underline decoration-coral-300 underline-offset-4 transition-colors hover:text-coral-600">
            Certified Coaches
          </Link>{' '}
          available for you
        </p>
      </div>
    </div>
  );
}
