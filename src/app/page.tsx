import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Send,
  MessageCircle,
  HelpCircle,
  Play,
  Search,
  Filter
} from 'lucide-react';

export default function HomePage() {
  const examCategories = [
    { id: 'all', label: 'All Exams', href: '/tests' },
    { id: 'ssc-cgl', label: 'SSC CGL', href: '/tests?exam=ssc-cgl' },
    { id: 'ssc-chsl', label: 'SSC CHSL', href: '/tests?exam=ssc-chsl' },
    { id: 'ssc-gd', label: 'SSC GD', href: '/tests?exam=ssc-gd' },
    { id: 'ssc-mts', label: 'SSC MTS', href: '/tests?exam=ssc-mts' },
    { id: 'rrb-ntpc', label: 'RRB NTPC', href: '/tests?exam=rrb-ntpc' },
    { id: 'rrb-group-d', label: 'RRB Group D', href: '/tests?exam=rrb-group-d' },
    { id: 'rrb-alp', label: 'RRB ALP', href: '/tests?exam=rrb-alp' }
  ];

  const featuredTests = [
    {
      id: 'cgl-2025-12-sep-shift-3',
      title: 'SSC CGL Tier-1 Official Paper (12 Sep Shift 3 - Hardest Shift)',
      family: 'ssc',
      badge: 'SSC CGL 2026–2027',
      questions: 100,
      marks: 200,
      duration: '60 Min',
      difficulty: 'Hard Shift',
      sections: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English']
    },
    {
      id: 'rrb-ntpc-2025-math-top-mock-1',
      title: 'RRB NTPC Graduate 2026 — Mathematics Top 50 Practice Mock',
      family: 'rrb',
      badge: 'RRB NTPC 2026–2027',
      questions: 50,
      marks: 50,
      duration: '45 Min',
      difficulty: 'High Yield',
      sections: ['Mathematics & Arithmetic']
    },
    {
      id: 'cgl-2025-18-sep-shift-3',
      title: 'SSC CGL Tier-1 Official Paper (18 Sep Shift 3)',
      family: 'ssc',
      badge: 'SSC CGL 2026–2027',
      questions: 100,
      marks: 200,
      duration: '60 Min',
      difficulty: 'Tier-1 CBT',
      sections: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English']
    },
    {
      id: 'rrb-ntpc-2025-full-mock-1',
      title: 'RRB NTPC Graduate & UG — All-India CBT-1 Full Paper',
      family: 'rrb',
      badge: 'Railway Recruitment Board',
      questions: 107,
      marks: 107,
      duration: '90 Min',
      difficulty: 'Full Mock',
      sections: ['General Awareness', 'Mathematics', 'General Intelligence']
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      {/* ── 1. Hero Section (ExamGoal Inspired: Clean, High-Focus, Productive) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Session Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Practice &amp; Analytics &bull; 2026–2027 Examination Session</span>
        </div>

        {/* Official Logos Side-by-Side */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 pt-1">
          <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-9 h-9 relative flex items-center justify-center">
              <img
                src="/ssc-logo.png"
                alt="Staff Selection Commission"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">SSC Examination Portal</div>
              <div className="text-[10px] text-slate-500">CGL, CHSL, GD, MTS &bull; Eduquity CBT</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-9 h-9 relative flex items-center justify-center">
              <img
                src="/rrb-logo.png"
                alt="Railway Recruitment Boards"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Railway Recruitment Portal</div>
              <div className="text-[11px] text-slate-500">NTPC, Group D, ALP &bull; 21 RRB Boards</div>
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Digital CBT Practice Hall &amp;
          <span className="block text-blue-600 dark:text-blue-400 mt-1">
            Answer Key Rank Evaluation Engine
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Practice official SSC and Railway papers in the authentic examination environment. Evaluate response sheet URLs for instant shift rankings, raw marks, and negative marking audits.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/tests"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice CBT Mocks &amp; PYQs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/score-calculator"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
          >
            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Check Answer Key Rank</span>
          </Link>

          <Link
            href="/my-tests"
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>My Attempted Tests</span>
          </Link>
        </div>

        {/* ── Exam Category Switcher Chips (ExamGoal Style) ── */}
        <div className="pt-4 flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {examCategories.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 text-slate-700 dark:text-slate-300 shadow-sm whitespace-nowrap transition"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── 2. Performance Stats Counter Bar ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
          <div className="p-2 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">540+</div>
            <div className="text-[11px] font-semibold text-slate-500">Official Questions with Proofs</div>
          </div>
          <div className="p-2 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
            <div className="text-[11px] font-semibold text-slate-500">Eduquity CBT Right Palette</div>
          </div>
          <div className="p-2 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">1-Click</div>
            <div className="text-[11px] font-semibold text-slate-500">Pause &amp; Resume State</div>
          </div>
          <div className="p-2 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">Zero</div>
            <div className="text-[11px] font-semibold text-slate-500">Spoiler Reattempt Terminal</div>
          </div>
        </div>
      </section>

      {/* ── 3. Featured CBT Tests (ExamGoal High-Density Card Layout) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Official Examination Papers (2026–2027)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Attempt in real Eduquity full-screen interface. Detailed solutions and community rank unlock upon submission.
            </p>
          </div>
          <Link
            href="/tests"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All Papers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featuredTests.map((t) => (
            <div
              key={t.id}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 relative shrink-0">
                      <img
                        src={t.family === 'rrb' ? '/rrb-logo.png' : '/ssc-logo.png'}
                        alt={t.family}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {t.badge}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {t.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {t.title}
                </h3>

                {/* Exam Specs Pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {t.duration}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-emerald-500" /> {t.questions} Questions</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-500" /> {t.marks} Marks</span>
                </div>

                {/* Section tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {t.sections.map((s, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Start Action Button */}
              <div className="pt-2">
                <Link
                  href={`/tests/${t.id}`}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Practice Examination</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. ExamGoal-Style Feature Pillars ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="max-w-xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Why Aspirants Practice on Exam Informer
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Active drilling, zero fluff, authentic exam screens, and instant data-driven rank analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Authentic Eduquity Interface</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Matches the exact layout of official Tier-1 tests with the Question Number Palette on the right, Part-A/B/C/D tabs, and live status indicators.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pause &amp; Resume Any Time</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Need a break? Pause your test and come back later. Signed-in candidates resume seamlessly with all responses preserved.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Locked Post-Test Solutions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Solutions stay strictly locked until submission. Then, review full KaTeX mathematical explanations or re-solve with Reattempt Mode ON.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Official Community Channels (Telegram & WhatsApp) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <a
            href={BRANDING.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-sm transition flex items-center justify-between group"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Official Telegram
                </span>
              </div>
              <h3 className="text-lg font-bold">Exam Informer Telegram Channel</h3>
              <p className="text-xs text-white/90 max-w-sm">
                Get shift-wise answer keys, cutoff predictions, and instant notices for newly released test series.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition shrink-0" />
          </a>

          <a
            href={BRANDING.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white shadow-sm transition flex items-center justify-between group"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  WhatsApp Channel
                </span>
              </div>
              <h3 className="text-lg font-bold">Exam Informer WhatsApp Channel</h3>
              <p className="text-xs text-white/90 max-w-sm">
                Follow for live exam announcements, CBT admit card alerts, and test updates.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition shrink-0" />
          </a>
        </div>
      </section>
    </div>
  );
}
