'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { JOURNEY_STEPS } from '@/lib/constants';

export function JourneyBanner({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6 rounded-2xl border border-silver-300 bg-white p-3 shadow-card">
      <div className="no-scrollbar flex items-stretch gap-2 overflow-x-auto">
        {JOURNEY_STEPS.map((s, idx) => {
          const done = currentStep > s.step;
          const active = currentStep === s.step;
          return (
            <React.Fragment key={s.step}>
              <Link
                href={s.href}
                className={`flex min-w-[104px] flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition-colors ${
                  active
                    ? 'border-coral-500 bg-coral-50'
                    : done
                      ? 'border-silver-300 bg-silver-100'
                      : 'border-silver-300 bg-white'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                    active
                      ? 'bg-coral-500 text-white'
                      : done
                        ? 'bg-warmgreen text-white'
                        : 'bg-silver-200 text-slateblue-700'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : s.step}
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    active ? 'text-coral-700' : 'text-slateblue-700'
                  }`}
                >
                  {s.label}
                </span>
              </Link>
              {idx < JOURNEY_STEPS.length - 1 ? (
                <span className="metal-bar my-4 h-[3px] w-4 shrink-0 self-center rounded" />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-silver-200 pt-2 text-[11px] font-bold text-slateblue-700">
        <span>🤖 AI Coach 全程陪伴</span>
        <span>💗 Community 持续支持（同辈互助免费）</span>
      </div>
    </div>
  );
}
