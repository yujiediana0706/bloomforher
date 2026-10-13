'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, ChevronDown, Menu, Sparkles, X } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth, DEMO_ACCOUNTS } from './AuthProvider';

export function Navbar() {
  const pathname = usePathname();
  const { user, switchAccount, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40">
      <div className="metal-surface border-b border-silver-300">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-black leading-tight text-slateblue-900 sm:text-base">
              ReBloom AI · 她径
            </span>
          </Link>

          <nav className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  isActive(item.href)
                    ? 'bg-coral-500 text-white'
                    : item.extra
                      ? 'text-slateblue-700/60 hover:bg-silver-100 hover:text-slateblue-700'
                      : 'text-slateblue-700 hover:bg-silver-100'
                }`}
              >
                {item.label}
                {item.extra ? (
                  <span className="ml-0.5 align-top text-[9px] font-black text-coral-400">
                    +
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/coach"
              className="hidden items-center gap-1.5 rounded-xl bg-coral-500 px-3 py-2 text-xs font-bold text-white hover:bg-coral-600 sm:inline-flex"
            >
              <Bot className="h-3.5 w-3.5" />
              AI Mentor
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-silver-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slateblue-900 hover:bg-silver-100"
              >
                <span className="max-w-[80px] truncate">
                  {user ? user.name : '未登录'}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-silver-300 bg-white p-2 shadow-card">
                  <p className="px-2 py-1 text-[11px] font-bold text-slateblue-700">
                    演示账号切换（无需注册）
                  </p>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.uid}
                      type="button"
                      onClick={async () => {
                        await switchAccount(acc.uid);
                        setAccountOpen(false);
                      }}
                      className={`block w-full rounded-xl px-2 py-2 text-left text-xs font-bold hover:bg-silver-100 ${
                        user?.uid === acc.uid
                          ? 'bg-coral-50 text-coral-600'
                          : 'text-slateblue-900'
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      setAccountOpen(false);
                    }}
                    className="mt-1 block w-full rounded-xl px-2 py-2 text-left text-xs font-bold text-slateblue-700 hover:bg-silver-100"
                  >
                    退出登录
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-xl border border-silver-300 bg-white p-2 text-slateblue-900 lg:hidden"
              aria-label="菜单"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="grid grid-cols-2 gap-1 border-t border-silver-300 bg-white px-4 py-3 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${
                  isActive(item.href)
                    ? 'bg-coral-500 text-white'
                    : 'text-slateblue-700 hover:bg-silver-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      <div className="metal-bar h-[3px]" />
    </header>
  );
}
