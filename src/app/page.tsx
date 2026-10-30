import React from 'react';
import Link from 'next/link';
import { BRANDING } from '@/lib/branding';
import {
  Calculator,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Clock,
  Layers,
  FileCheck2
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-24 py-10 sm:py-16">
      {/* ── 1. Hero Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-extrabold shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
          <span>Next-Generation Evaluation Engine &amp; CBT Test Simulator</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          SSC &amp; Railway Exam
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
            Rank Calculator &amp; CBT Mocks
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Paste your official TCS iON or DigiALM answer key URL to calculate instant marks, shift percentiles, and All-India Ranks. Or practice authentic Computer Based Tests (CBT) powered by real ingested exam papers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/score-calculator"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/25 active:scale-95 transition"
          >
            <Calculator className="w-5 h-5" />
            <span>Calculate Your Marks &amp; Rank</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/tests"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-sm active:scale-95 transition"
          >
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Practice CBT Mock Tests</span>
          </Link>
        </div>

        {/* Feature Highlights Pills */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            100% Verified DigiALM / TCS iON Parsing
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Instant Shift &amp; All-India Rankings
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Offline HTML / Paste Fallback Support
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            1-Click Answer Key to Mock Test Conversion
          </span>
        </div>
      </section>

      {/* ── 2. Primary Feature Cards ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Score & Rank Engine */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Official Answer Key &amp; Shift Rank Engine
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                Evaluates response sheets across SSC (CGL, CHSL, MTS, GD, Steno) and Railways (RRB NTPC, Group D, ALP). Handles complex HTML, MathML LaTeX equations, negative marking, and dropped questions.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-blue-100/90 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  Live Shift Benchmark (Average vs Topper Score)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  Category Rank &amp; Zonal Cutoff Projections
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  Clean Printable Scorecard &amp; PDF Export
                </li>
              </ul>
            </div>

            <Link
              href="/score-calculator"
              className="w-full py-4 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Launch Score Calculator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: CBT Mock Test Series */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Real CBT Examination Environment
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Take full-length tests and official shift PYQs in an authentic exam screen. Features bilingual question toggle (Hindi/English), section timers, 5-state palette status, and KaTeX math formulas.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  TCS iON CBT 5-state color coded palette
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Step-by-step solutions with KaTeX LaTeX math
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Papers ingested directly from official response sheets
                </li>
              </ul>
            </div>

            <Link
              href="/tests"
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Explore All CBT Tests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Supported Exams Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Supported Exam Agencies
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Tailored evaluation logic and negative marking formulas for every major competitive board.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'SSC CGL', mark: '+2 / -0.50', cat: 'SSC', href: '/score-calculator' },
            { name: 'SSC CHSL', mark: '+2 / -0.50', cat: 'SSC', href: '/score-calculator' },
            { name: 'SSC MTS', mark: '+3 / -1.00', cat: 'SSC', href: '/score-calculator' },
            { name: 'RRB NTPC', mark: '+1 / -0.33', cat: 'Railway', href: '/score-calculator' },
            { name: 'RRB Group D', mark: '+1 / -0.33', cat: 'Railway', href: '/score-calculator' },
            { name: 'RRB ALP', mark: '+1 / -0.33', cat: 'Railway', href: '/score-calculator' },
          ].map((exam, i) => (
            <Link
              key={i}
              href={exam.href}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 text-center space-y-1 transition group"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase">{exam.cat}</div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                {exam.name}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {exam.mark}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 4. Admin Pipeline Feature Spotlight ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-400/30">
              Admin &amp; Pipeline Engine
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Ingest Answer Keys &rarr; Instant Live Mock Tests
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              When candidates submit their official response sheets to check marks, our engine scrapes and structures all questions, diagrams, and options. Admins can review them in the Admin Studio and publish them into CBT test series with a single click.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
