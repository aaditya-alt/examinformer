'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth/AuthContext';
import {
  Home,
  Bookmark,
  History,
  BarChart3,
  Flag,
  Calendar,
  User as UserIcon,
  Heart,
  LogIn,
  LogOut,
  X,
  Crown,
  ChevronRight
} from 'lucide-react';

interface BorderlandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BorderlandDrawer({ isOpen, onClose }: BorderlandDrawerProps) {
  const pathname = usePathname();
  const { user, openAuthModal, signOut } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const candidateName = user?.name || 'Guest Student';
  const initial = candidateName.charAt(0).toUpperCase() || 'G';

  const mainNavItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Saved Questions', href: '/tests?hub=topic-wise', icon: Bookmark },
    { label: 'Attempt History', href: '/profile', icon: History },
    { label: 'Mock Analysis', href: '/profile', icon: BarChart3 },
    { label: 'My Reports', href: '/profile', icon: Flag },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-out drawer matching BorderlandSSC screenshot */}
      <aside className="relative w-80 max-w-[85vw] bg-[#111216] text-white h-full shadow-2xl flex flex-col justify-between z-10 border-r border-slate-800/80 animate-in slide-in-from-left duration-200 select-none">
        {/* Scrollable upper content */}
        <div className="overflow-y-auto p-4 space-y-4 scrollbar-none">
          {/* User profile row & close button */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-md">
                  {initial}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111216]" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-100 tracking-tight leading-snug">
                  {candidateName}
                </h3>
                <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {user ? 'Verified Candidate' : 'Normal User'}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Premium User Banner Card (Matching BorderlandSSC) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex items-center justify-between group cursor-pointer hover:border-amber-400/50 transition">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-4 h-4 fill-amber-400/30" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black text-amber-300">Premium User</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Unlock all 2025 official PYQs &amp; accelerate your preparation.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition" />
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-rose-950/30 text-rose-400 border border-rose-900/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </Link>
              );
            })}
          </nav>

          {/* MANAGE Section */}
          <div className="pt-2">
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              MANAGE
            </div>
            <Link
              href="/tests"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Study Plan &amp; Mocks</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
          </div>

          {/* ACCOUNT Section */}
          <div className="pt-2">
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              ACCOUNT
            </div>
            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile &amp; Roll Number</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
              <a
                href="https://t.me/mockmatrixhub"
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Support Us &bull; Telegram</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Auth Button (Matching BorderlandSSC reddish/orange outlined pill) */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0d0e11]">
          {user ? (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
