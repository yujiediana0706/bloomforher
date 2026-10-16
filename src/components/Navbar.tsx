'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Menu, Sparkles, X } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth } from './AuthProvider';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
              ReBloom AI
            </span>
          </Link>

          <nav className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
                  isActive(item.href)
                    ? 'bg-coral-500 text-white'
                    : 'text-slateblue-700 hover:bg-silver-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden max-w-[140px] truncate rounded-xl border border-silver-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slateblue-900 hover:bg-silver-100 sm:block"
                >
                  {user.name}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    router.push('/');
                  }}
                  className="rounded-xl border border-silver-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slateblue-700 hover:bg-silver-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-silver-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slateblue-900 hover:bg-silver-100"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-coral-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-coral-600"
                >
                  Sign up
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-xl border border-silver-300 bg-white p-2 text-slateblue-900 lg:hidden"
              aria-label="Menu"
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
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
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
