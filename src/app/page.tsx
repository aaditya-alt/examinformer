import React from 'react';
import Link from 'next/link';
import { BRANDING } from '@/lib/branding';
import {
  Calculator,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  Layers,
  FileCheck2,
  BarChart3,
  Users,
  Compass,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  Eye,
  Send,
  MessageCircle
} from 'lucide-react';

export default function HomePage() {
  const featuredTests = [
    {
      id: 'cgl-2025-12-sep-shift-3',
      title: 'SSC CGL Tier-1 Official Paper (12 Sep Shift 3 - Hardest Shift)',
      family: 'ssc',
      badge: 'Eduquity Pattern',
      questions: 100,
      marks: 200,
      duration: '60 Min',
      difficulty: 'Hard'
    },
    {
      id: 'rrb-ntpc-2025-math-top-mock-1',
      title: 'RRB NTPC Graduate 2025 — Mathematics Top 50 Questions Mock',
      family: 'rrb',
      badge: 'CBT-1 Standard',
      questions: 50,
      marks: 50,
      duration: '45 Min',
      difficulty: 'Moderate'
    },
    {
      id: 'cgl-2025-18-sep-shift-3',
      title: 'SSC CGL Tier-1 Official Paper (18 Sep Shift 3)',
      family: 'ssc',
      badge: 'Eduquity Pattern',
      questions: 100,
      marks: 200,
      duration: '60 Min',
      difficulty: 'Hard'
    },
    {
      id: 'rrb-ntpc-2025-full-mock-1',
      title: 'RRB NTPC Graduate & UG 2025 — Full Length CBT-1 Mock',
      family: 'rrb',
      badge: 'Indian Railways',
      questions: 107,
      marks: 107,
      duration: '90 Min',
      difficulty: 'All India Live'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-14">
      {/* ── 1. Hero Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
        {/* Institutional Authority Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-blue-950/80 border border-slate-700 dark:border-blue-800 text-xs sm:text-sm font-bold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Staff Selection Commission (SSC) &bull; Railway Recruitment Boards (RRB)</span>
        </div>

        {/* Emblems Showcase */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-3 p-2.5 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-1 border border-amber-300">
              <img src="/ssc-logo.svg" alt="SSC Emblem" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-slate-900 dark:text-white">SSC CBT Terminal</div>
              <div className="text-[10px] text-slate-500">Eduquity 2024–2025 Pattern</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-1 border border-amber-300">
              <img src="/rrb-logo.svg" alt="RRB Emblem" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-slate-900 dark:text-white">RRB Railway CBT</div>
              <div className="text-[10px] text-slate-500">All 21 Regional Boards</div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Official Eduquity CBT Mocks &amp;
          <span className="block text-blue-600 dark:text-sky-400 mt-1">
            Answer Key Rank Calculator
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one assessment engine built specifically for SSC &amp; Railway aspirants. Evaluate DigiALM response sheet URLs for instant shift ranks, or test yourself on authentic Eduquity CBT mocks with <strong>zero-spoiler reattempt</strong> and step-by-step mathematical proofs.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <Link
            href="/score-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition"
          >
            <Calculator className="w-5 h-5" />
            <span>Check Rank from Answer Key URL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/tests"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
          >
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>Launch Eduquity CBT Mocks</span>
          </Link>
        </div>

        {/* Real Exam Parameters Row */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Eduquity Right-Side Palette
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            SSC GD -0.25 &amp; RRB -0.33 Logic
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Sectional Auto-Lock Timers
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            KaTeX Step-by-Step Math Solutions
          </span>
        </div>
      </section>

      {/* ── 2. Featured Official CBT Mocks ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-sky-400">
              Official Pattern Based Test Series
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Popular CBT Mock Tests &amp; Shift Papers
            </h2>
          </div>
          <Link
            href="/tests"
            className="text-xs font-extrabold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All Mock Tests</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredTests.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white p-0.5 border border-slate-200 shadow-sm">
                      <img
                        src={t.family === 'rrb' ? '/rrb-logo.svg' : '/ssc-logo.svg'}
                        alt={t.family}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {t.badge}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                    {t.difficulty}
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-snug">
                  {t.title}
                </h3>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                  <span>{t.questions} Questions</span>
                  <span>&bull;</span>
                  <span>{t.marks} Marks</span>
                  <span>&bull;</span>
                  <span>{t.duration}</span>
                </div>
              </div>

              {/* Action Buttons: Take Mock or View Solutions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href={`/tests/${t.id}`}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Attempt Test</span>
                </Link>

                <Link
                  href={`/tests/${t.id}?mode=solution`}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>Solutions &amp; Reattempt</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Testportal-Inspired Interactive Feature Showcase ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-sky-400 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800">
              Exam Informer Assessment Innovations
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Built Specifically for the Exact Real Exam Experience
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every detail has been calibrated to mirror what you will encounter in the actual examination hall.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black">
                1
              </div>
              <h3 className="font-extrabold text-base text-white">Eduquity CBT Right Palette</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Matches the layout of official Tier-1 tests with the Question Number Palette on the right, Part-A/B/C/D tabs, and live question status tracking.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                2
              </div>
              <h3 className="font-extrabold text-base text-white">Interactive Reattempt Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                View solutions in Reattempt Mode to re-solve difficult questions without seeing the answer. Toggle Reattempt OFF to inspect step-by-step KaTeX mathematical derivations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                3
              </div>
              <h3 className="font-extrabold text-base text-white">Instant Answer Key Scoring</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paste your response sheet link from TCS iON or DigiALM. Get instant marks, section marks, negative deduction audits, and All-India shift rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Official Community Channels (Telegram & WhatsApp) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Telegram Channel Card */}
          <a
            href={BRANDING.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 sm:p-8 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-lg transition flex items-center justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Send className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Official Telegram
                </span>
              </div>
              <h3 className="text-xl font-black">Join Exam Informer Telegram</h3>
              <p className="text-xs text-white/90 max-w-sm">
                Get instant shift-wise answer keys, cutoff analysis, question paper PDFs, and real-time rank calculator updates.
              </p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition shrink-0" />
          </a>

          {/* WhatsApp Channel Card */}
          <a
            href={BRANDING.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 sm:p-8 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white shadow-lg transition flex items-center justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  Official WhatsApp Channel
                </span>
              </div>
              <h3 className="text-xl font-black">Follow WhatsApp Channel</h3>
              <p className="text-xs text-white/90 max-w-sm">
                Receive important exam notices, CBT schedule announcements, and direct links to live all-India mock tests.
              </p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition shrink-0" />
          </a>
        </div>
      </section>
    </div>
  );
}
