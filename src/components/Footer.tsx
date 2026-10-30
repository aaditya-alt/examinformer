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
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                {BRANDING.name}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              The premier open-architecture CBT examination and official answer key evaluation engine. Instant All-India Ranks, category percentiles, and 1-click test publishing.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={BRANDING.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Join Telegram Community</span>
              </a>
              <a
                href={BRANDING.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Channel</span>
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
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-slate-800 dark:hover:text-slate-200">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
