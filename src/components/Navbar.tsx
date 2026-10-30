'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRANDING } from '@/lib/branding';
import { ThemeToggle } from './ThemeToggle';
import { ExamLogo } from './ExamLogo';
import { useAuth } from './auth/AuthContext';
import { Calculator, BookOpen, Sparkles, Menu, X, ArrowUpRight, User, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, openAuthModal, signOut } = useAuth();

  const navLinks = [
    {
      name: 'Practice Mocks',
      href: '/tests',
      icon: BookOpen,
      badge: '2026–27'
    },
    {
      name: 'Score Calculator',
      href: '/score-calculator',
      icon: Calculator,
      badge: 'Live Keys'
    },
    {
      name: 'My Tests',
      href: '/my-tests',
      icon: Sparkles,
      badge: 'Dashboard'
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Round Official Emblems */}
          <Link href="/" className="flex items-center gap-3 group">
            <ExamLogo type="combo" size="sm" />
            <div>
              <div className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                {BRANDING.name}
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  CBT
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold -mt-0.5 hidden sm:block">
                SSC &amp; Railway National Assessment Portal
              </div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Candidate Profile / Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[120px]">{user.name}</span>
                </div>
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Sign In
              </button>
            )}

            <Link
              href="/score-calculator"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition"
            >
              <span>Calculate Score</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
