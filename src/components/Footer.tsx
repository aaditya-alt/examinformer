import React from 'react';
import Link from 'next/link';
import { BRANDING } from '@/lib/branding';
import { ShieldCheck, Sparkles, Send, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/mockyoddha-logo.jpg"
                alt="MockYoddha Logo"
                className="w-10 h-10 rounded-xl object-cover shadow-sm"
              />
              <div className="flex flex-col">
                <span className="font-black text-xl text-slate-900 dark:text-white leading-none">
                  Mock<span className="text-red-600">Yoddha</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-none">
                  by ExamInformerNitesh
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              The premier CBT examination platform and official answer key evaluation engine. Live mock tests, genuine previous papers, instant All-India Ranks, and authentic solutions.
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={BRANDING.telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Join Telegram Community</span>
                </a>
                <a
                  href={BRANDING.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Channel</span>
                </a>
              </div>
              <a
                href={BRANDING.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition shadow-xs self-start"
              >
                <svg className="w-4 h-4 text-red-600 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>Subscribe on YouTube (ExamInformerNitesh)</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Evaluation &amp; Tests
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/score-calculator" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Answer Key Calculator
                </Link>
              </li>
              <li>
                <Link href="/tests" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  All CBT Mock Tests
                </Link>
              </li>
              <li>
                <Link href="/tests?exam=ssc-cgl" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  SSC CGL Previous Papers
                </Link>
              </li>
              <li>
                <Link href="/tests?exam=rrb-ntpc" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  RRB NTPC CBT Series
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Agencies */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Agencies &amp; Portals
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>TCS iON / DigiALM Portal</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Staff Selection Commission (SSC)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Railway Recruitment Boards (RRB)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>State PSCs &amp; Police Recruitment</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} {BRANDING.name}. An independent educational testing engine. Not affiliated with SSC, RRB, or TCS.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Server Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
