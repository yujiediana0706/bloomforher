import React from 'react';

/**
 * HerRise brand mark: a hand-drawn infinity loop whose left lobe curls
 * into a spiral — "your experience keeps unfolding".
 */
export function LogoMark({
  className = 'h-8 w-8',
  stroke = 'currentColor',
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 70"
      fill="none"
      stroke={stroke}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Infinity outline */}
      <path d="M60 35C60 52 45 61 33 61C16 61 7 49 7 35C7 21 16 9 33 9C45 9 60 18 60 35C60 18 75 9 87 9C104 9 113 21 113 35C113 49 104 61 87 61C75 61 60 52 60 35Z" />
      {/* Spiral curl inside the left lobe */}
      <path d="M45 35a12 12 0 1 1-24 0 12 12 0 0 1 24 0" />
      <path d="M41 35a8 8 0 1 1-16 0 8 8 0 0 1 16 0" />
      <path d="M37 35a4 4 0 1 1-8 0" strokeWidth="6" />
    </svg>
  );
}

/** Logo lockup for the navbar: cream tile + wordmark. */
export function Logo() {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6efe3] text-[#141414] shadow-sm ring-1 ring-black/5">
        <LogoMark className="h-6 w-6" />
      </span>
      <span className="text-sm font-black leading-tight text-slateblue-900 sm:text-base">
        HerRise
      </span>
    </span>
  );
}
