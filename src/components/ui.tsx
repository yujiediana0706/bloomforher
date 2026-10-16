'use client';

import React from 'react';

// —— Card ——
export function Card({
  className = '',
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-2xl border border-silver-300 bg-white p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

// —— Button ——
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      'bg-coral-500 text-white hover:bg-coral-600 disabled:bg-silver-400',
    secondary:
      'bg-silver-100 text-slateblue-900 border border-silver-300 hover:bg-silver-200',
    ghost: 'text-slateblue-700 hover:bg-silver-100',
    outline:
      'border border-coral-500 text-coral-600 bg-white hover:bg-coral-50',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// —— Badge ——
export function Badge({
  children,
  tone = 'silver',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'silver' | 'coral' | 'pink' | 'green' | 'red';
  className?: string;
}) {
  const tones = {
    silver: 'bg-silver-100 text-slateblue-900 border-silver-300',
    coral: 'bg-coral-50 text-coral-600 border-coral-100',
    pink: 'bg-softpink-200 text-coral-700 border-softpink-300',
    green: 'bg-warmgreen/15 text-[#3f7a4a] border-warmgreen/40',
    red: 'bg-warmred/15 text-warmred border-warmred/40',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// —— Section title ——
export function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-coral-500">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-lg font-extrabold text-slateblue-900 sm:text-xl">
        {title}
      </h2>
      {desc ? (
        <p className="mt-1 text-sm leading-relaxed text-slateblue-700">{desc}</p>
      ) : null}
    </div>
  );
}

// —— Empty state ——
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-silver-400 bg-silver-50 px-6 py-10 text-center text-sm text-slateblue-700">
      {text}
    </div>
  );
}

// —— Match-score ring ——
export function ScoreRing({
  value,
  size = 96,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E1E5EC"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8725C"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slateblue-900">{value}</span>
        {label ? (
          <span className="text-[10px] font-bold text-slateblue-700">{label}</span>
        ) : null}
      </div>
    </div>
  );
}

// —— Checkbox / radio chip ——
export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? 'border-coral-500 bg-coral-500 text-white'
          : 'border-silver-300 bg-white text-slateblue-700 hover:bg-silver-100'
      }`}
    >
      {children}
    </button>
  );
}

// —— Modal ——
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slateblue-900/40 p-4">
      <div className={`w-full ${width} rounded-2xl border border-silver-300 bg-white p-5 shadow-card`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slateblue-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-slateblue-700 hover:bg-silver-100"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// —— Progress bar ——
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-silver-300 bg-silver-100">
      <div
        className="h-full rounded-full bg-coral-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
