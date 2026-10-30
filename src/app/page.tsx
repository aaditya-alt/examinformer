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
  Compass
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-14">
      {/* ── 1. Hero Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Official SSC &amp; Railway Exam Portal &bull; 2024–2025 Sessions</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Evaluate Answer Keys, Calculate Ranks &amp;
          <span className="block text-blue-600 dark:text-blue-400 mt-1">
            Practice Real CBT Mock Tests
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Paste your official TCS iON or DigiALM response sheet URL for instant marks, section analysis, shift ranks, and percentiles. Or practice full-length CBT tests in the exact official examination interface.
        </p>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <Link
            href="/score-calculator"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition"
          >
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Check Score &amp; Rank</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/tests"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            <span>Practice CBT Mocks</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Official DigiALM / TCS iON URL Support
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Instant All-India &amp; Shift Ranks
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Official Sectional Timers &amp; Math (KaTeX)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            100% Free Open Access
          </span>
        </div>
      </section>

      {/* ── 2. Primary Modules ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Module 1: Score & Rank Engine */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Answer Key Score &amp; Rank Calculator
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Paste your official TCS iON / SSC cbexams response sheet link. The system extracts questions, evaluates negative marks, groups section marks, and provides shift normalization benchmark.
              </p>
              <ul className="space-y-2 text-xs font-medium text-blue-100/90 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                  Detailed Sectional &amp; Category Breakdown
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                  Shift Comparison (Your Marks vs Average vs Shift Topper)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                  Printable Official Format Scorecard
                </li>
              </ul>
            </div>

            <Link
              href="/score-calculator"
              className="w-full py-3 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition"
            >
              <span>Calculate Your Score</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Module 2: CBT Mock Tests */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Full-Length CBT Examination Engine
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                Practice official previous year papers and mock tests in a 1:1 replica of the TCS iON examination terminal. Features official sectional timers, KaTeX math expressions, and 5-state color question palette.
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Latest SSC Sectional Timer (15 Min / Section Auto-lock)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Radio Button Option Selection &amp; Clear Response
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Step-by-Step Solutions &amp; Peer Comparison Metrics
                </li>
              </ul>
            </div>

            <Link
              href="/tests"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition"
            >
              <span>Explore CBT Mock Papers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Supported Exams Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Popular Examination Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tailored negative marking, section patterns, and timing rules for every board.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { name: 'SSC CGL', mark: '+2.0 / -0.50', cat: 'SSC', href: '/tests?exam=ssc-cgl' },
            { name: 'SSC CHSL', mark: '+2.0 / -0.50', cat: 'SSC', href: '/tests?exam=ssc-chsl' },
            { name: 'SSC MTS', mark: '+3.0 / -1.00', cat: 'SSC', href: '/tests?exam=ssc-mts' },
            { name: 'RRB NTPC', mark: '+1.0 / -0.33', cat: 'Railway', href: '/tests?exam=rrb-ntpc' },
            { name: 'RRB Group D', mark: '+1.0 / -0.33', cat: 'Railway', href: '/tests?exam=rrb-group-d' },
            { name: 'RRB ALP', mark: '+1.0 / -0.33', cat: 'Railway', href: '/tests?exam=rrb-alp' },
          ].map((exam, i) => (
            <Link
              key={i}
              href={exam.href}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-center space-y-1 transition group shadow-sm"
            >
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{exam.cat}</div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {exam.name}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {exam.mark}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 4. Exam Preparation & Live Analytics Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider border border-blue-400/30">
              Exam Informer Data Hub
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              540+ Official Shift Questions &amp; Real Papers Ready
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Every mock test in our repository is extracted from official TCS iON candidate answer keys with verified answers, bilingual hindi/english support, and community difficulty ratings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/tests"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              Start Free CBT Mock
            </Link>
            <Link
              href="/score-calculator"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition"
            >
              Enter Answer Key URL
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
