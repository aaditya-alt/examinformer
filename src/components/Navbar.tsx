'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { ExamLogo } from './ExamLogo';
import { useAuth } from './auth/AuthContext';
import { BorderlandDrawer } from './BorderlandDrawer';
import {
  Globe,
  Menu,
  User as UserIcon
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'English' | 'Hindi'>('English');
  const { user, openAuthModal } = useAuth();

  const navLinks = [
    {
      name: 'Test Series',
      href: '/tests'
    },
    {
      name: 'Score Calculator',
      href: '/score-calculator',
      badge: 'Live Keys'
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo styled as ExamInformer matching RepeaterMock font aesthetic */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <ExamLogo type="combo" size="sm" />
                <div className="flex items-center font-black text-xl sm:text-2xl tracking-tight">
                  <span className="text-slate-900 dark:text-white">Exam</span>
                  <span className="text-[#0891b2] dark:text-[#06b6d4]">Informer</span>
                </div>
              </Link>

              {/* RepeaterMock Style Navigation */}
              <nav className="hidden md:flex items-center gap-1 sm:gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'text-slate-950 dark:text-white bg-slate-100/80 dark:bg-slate-800/80'
                          : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{link.name}</span>
                      {link.badge && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hidden lg:inline">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Language, ThemeToggle, Log In / Candidate Pill, and Borderland Drawer Trigger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Dropdown */}
              <div className="relative hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as any)}
                  className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="English" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                    English
                  </option>
                  <option value="Hindi" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                    हिन्दी
                  </option>
                </select>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Auth Button: Cyan rounded pill Log In (RepeaterMock Style) OR Candidate Profile */}
              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-black">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="truncate max-w-[100px] hidden sm:inline">{user.name}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="px-5 py-2 rounded-full bg-[#06b6d4] hover:bg-[#0891b2] text-white text-xs font-black tracking-wide shadow-xs shadow-cyan-500/20 transition cursor-pointer"
                >
                  Log In
                </button>
              )}

              {/* Borderland Drawer Hamburger Trigger */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-xl text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Open Borderland navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Borderland Slide-out Navigation Drawer */}
      <BorderlandDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
