'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Sparkles, UserCircle, X } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { useAuth } from './AuthProvider';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    setProfileOpen(false);
    setMenuOpen(false);
    await logout();
    router.push('/');
  }

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

          <div className="relative ml-auto flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex max-w-[160px] items-center gap-1 rounded-xl border border-silver-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slateblue-900 hover:bg-silver-100"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="truncate">{user.name}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slateblue-700 transition-transform ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {profileOpen ? (
                  <>
                    <button
                      type="button"
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setProfileOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-silver-300 bg-white py-1 shadow-lg"
                    >
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slateblue-900 hover:bg-silver-100"
                        role="menuitem"
                      >
                        <UserCircle className="h-4 w-4 text-coral-500" />
                        My profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slateblue-700 hover:bg-silver-100"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 text-coral-500" />
                        Log out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
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
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slateblue-700 hover:bg-silver-100"
                >
                  <UserCircle className="h-4 w-4 text-coral-500" />
                  My profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slateblue-700 hover:bg-silver-100"
                >
                  <LogOut className="h-4 w-4 text-coral-500" />
                  Log out
                </button>
              </>
            ) : null}
          </nav>
        ) : null}
      </div>
      <div className="metal-bar h-[3px]" />
    </header>
  );
}
