import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRANDING } from '@/lib/branding';
import Hero3DMockup from '@/components/Hero3DMockup';
import { ExamLogo } from '@/components/ExamLogo';
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
  Filter,
  BrainCircuit,
  Target,
  GraduationCap,
  Flame,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const examCategories = [
    { id: 'all', label: 'All Exams', href: '/tests' },
    { id: 'ssc-cgl', label: 'SSC CGL Tier-1 & Tier-2', href: '/tests?exam=ssc-cgl', hot: true },
    { id: 'ssc-chsl', label: 'SSC CHSL 10+2', href: '/tests?exam=ssc-chsl' },
    { id: 'ssc-gd', label: 'SSC GD Constable (-0.25 Neg)', href: '/tests?exam=ssc-gd', hot: true },
    { id: 'ssc-mts', label: 'SSC MTS & Havaldar', href: '/tests?exam=ssc-mts' },
    { id: 'rrb-ntpc', label: 'RRB NTPC (Grad & UG)', href: '/tests?exam=rrb-ntpc', hot: true },
    { id: 'rrb-group-d', label: 'RRB Group D (CEN RRC)', href: '/tests?exam=rrb-group-d' },
    { id: 'rrb-alp', label: 'RRB ALP (Technician)', href: '/tests?exam=rrb-alp' }
  ];

  const subjectPracticeRooms = [
    {
      id: 'math',
      title: 'Quantitative Aptitude & Mathematics',
      subtitle: 'Arithmetic, Advanced Math, Algebra & Geometry',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300',
      btnColor: 'btn-3d-emerald bg-emerald-600 hover:bg-emerald-700 text-white',
      pyqCount: '2,450+ PYQs',
      chapterCount: '48 Chapters',
      topics: ['Number Systems', 'Percentage & Profit-Loss', 'Geometry & Mensuration', 'Trigonometry', 'Algebra', 'Data Interpretation'],
      href: '/tests?section=math'
    },
    {
      id: 'reasoning',
      title: 'General Intelligence & Reasoning',
      subtitle: 'Analogy, Syllogisms, Coding-Decoding & Puzzles',
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300',
      btnColor: 'btn-3d-purple bg-indigo-600 hover:bg-indigo-700 text-white',
      pyqCount: '1,980+ PYQs',
      chapterCount: '36 Chapters',
      topics: ['Coding-Decoding', 'Blood Relations', 'Syllogism', 'Analogy & Classification', 'Series & Pattern', 'Mirror & Water Images'],
      href: '/tests?section=reasoning'
    },
    {
      id: 'english',
      title: 'English Language & Comprehension',
      subtitle: 'Grammar, Vocab, Cloze Test & Reading',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300',
      btnColor: 'btn-3d-primary bg-amber-600 hover:bg-amber-700 text-white',
      pyqCount: '2,120+ PYQs',
      chapterCount: '42 Chapters',
      topics: ['Error Detection', 'Synonyms & Antonyms', 'Idioms & Phrases', 'One Word Substitution', 'Cloze Test Passages', 'Active/Passive Voice'],
      href: '/tests?section=english'
    },
    {
      id: 'ga',
      title: 'General Awareness & Current Affairs',
      subtitle: 'Polity, History, Geography, Static GK & Science',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300',
      btnColor: 'btn-3d-primary bg-blue-600 hover:bg-blue-700 text-white',
      pyqCount: '3,100+ PYQs',
      chapterCount: '55 Chapters',
      topics: ['Indian Constitution & Polity', 'Modern History', 'Indian Geography', 'Physics & Chemistry', 'Biology & Environment', '2026 Current Events'],
      href: '/tests?section=ga'
    }
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
      difficulty: 'Hard Shift • High Cutoff Impact',
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
      difficulty: 'High Yield Arithmetic & Algebra',
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
      difficulty: 'Tier-1 CBT Standard',
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
      difficulty: 'Full Mock CBT Pattern',
      sections: ['General Awareness', 'Mathematics', 'General Intelligence']
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-12">
      {/* ── 1. Hero Section (ExamGoal Inspired 3D Focus & Elevation) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Top Session Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active CBT Practice &amp; Analytics &bull; 2026–2027 Examination Session</span>
        </div>

        {/* Official Logos Side-by-Side with 3D tactile card depth */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-3.5 p-3 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-3d">
            <ExamLogo type="ssc" size="md" />
            <div className="text-left">
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">SSC Examination Portal</div>
              <div className="text-[11px] text-slate-500 font-medium">CGL &bull; CHSL &bull; GD &bull; MTS &bull; Eduquity Pattern</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm card-3d">
            <ExamLogo type="rrb" size="md" />
            <div className="text-left">
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Railway Recruitment Portal</div>
              <div className="text-[11px] text-slate-500 font-medium">NTPC &bull; Group D &bull; ALP &bull; 21 RRB Zones</div>
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Digital CBT Practice Hall &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400">
              Answer Key Rank Analyzer
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Practice official SSC and Railway papers on the authentic <strong>Eduquity Right-Palette CBT interface</strong> with sectional timers. Instantly evaluate response sheets with shift-wise normalization and category ranking.
          </p>
        </div>

        {/* 3D Tactile CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/tests"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 btn-3d-primary cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice CBT Mocks &amp; PYQs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/score-calculator"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 font-extrabold text-sm flex items-center justify-center gap-2 btn-3d-secondary cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Check Answer Key Rank</span>
          </Link>

          <Link
            href="/my-tests"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>My Attempted Tests</span>
          </Link>
        </div>

        {/* ── ExamGoal-Style 3D Exam Category Switcher Chips ── */}
        <div className="pt-2 flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {examCategories.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap card-3d ${
                c.hot
                  ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600'
              }`}
            >
              {c.hot && <Flame className="w-3 h-3 text-amber-500 fill-current" />}
              <span>{c.label}</span>
            </Link>
          ))}
        </div>

        {/* ── THE INTERACTIVE 3D CBT TERMINAL MOCKUP ── */}
        <div className="pt-4">
          <Hero3DMockup />
        </div>
      </section>

      {/* ── 2. Performance Stats Counter Bar ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-3 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">540+</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Verified Questions</div>
            <div className="text-[11px] text-slate-500">With detailed KaTeX solutions</div>
          </div>
          <div className="p-3 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Eduquity CBT Right Palette</div>
            <div className="text-[11px] text-slate-500">Authentic 2026-27 format</div>
          </div>
          <div className="p-3 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">1-Click</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Pause &amp; Resume State</div>
            <div className="text-[11px] text-slate-500">Saved to candidate session</div>
          </div>
          <div className="p-3 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">Zero</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Spoiler Reattempt Terminal</div>
            <div className="text-[11px] text-slate-500">Locked solutions until submit</div>
          </div>
        </div>
      </section>

      {/* ── 3. ExamGoal Signature: 3D Subject Practice Rooms ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <BrainCircuit className="w-4 h-4" />
              <span>ExamGoal-Style Modular Practice</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Subject Practice Rooms &amp; Chapter Tests
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Target your weak chapters with past 7-year solved question banks and timer-based practice sets.
            </p>
          </div>
          <Link
            href="/tests"
            className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Explore All Chapters</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjectPracticeRooms.map((room) => (
            <div
              key={room.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${room.badgeColor}`}>
                    {room.chapterCount} &bull; {room.pyqCount}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">2018–2025 PYQ Sets</span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {room.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {room.subtitle}
                  </p>
                </div>

                {/* Topics Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {room.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enter Practice Room Tactile Button */}
              <div className="pt-2">
                <Link
                  href={room.href}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${room.btnColor}`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Enter {room.title.split('&')[0].trim()} Room</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Featured CBT Tests (3D Tactile Cards) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <Target className="w-4 h-4" />
              <span>Full Length CBT Simulation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Official Examination Papers (2026–2027)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Attempt in authentic Eduquity full-screen interface. Detailed solutions and community rank unlock upon submission.
            </p>
          </div>
          <Link
            href="/tests"
            className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All Papers</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredTests.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ExamLogo type={t.family as any} size="sm" />
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {t.badge}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    {t.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {t.title}
                </h3>

                {/* Exam Specs Pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> {t.duration}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> {t.questions} Questions
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> {t.marks} Marks
                  </span>
                </div>

                {/* Section tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {t.sections.map((s, idx) => (
                    <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Start Action Button */}
              <div className="pt-2">
                <Link
                  href={`/tests/${t.id}`}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 btn-3d-primary cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Practice Examination</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Score Calculator & Rank Evaluation Showcase ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden card-3d">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>Shift Normalization &amp; Category Rank</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Evaluate Your Official Answer Key URL in 1 Click
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Supports official answer key domains: <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-300">sscexams.cbexams.com</code> and <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300">digialm.com</code>. Generates raw score, negative penalty calculations (-0.25 for SSC GD, -0.50 for CGL), zone-wise percentile, and community rank.
            </p>

            <div className="pt-3 flex flex-wrap gap-3">
              <Link
                href="/score-calculator"
                className="px-6 py-3 rounded-xl bg-white text-slate-900 font-black text-xs flex items-center gap-2 hover:bg-slate-100 transition shadow-lg"
              >
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Submit Answer Key URL</span>
              </Link>

              <Link
                href="/score-calculator?tab=roll"
                className="px-6 py-3 rounded-xl bg-blue-800/80 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 border border-blue-600/50 transition"
              >
                <span>Check by Roll Number</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Official Community Channels (Telegram & WhatsApp) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href={BRANDING.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 sm:p-7 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-lg transition flex items-center justify-between group card-3d"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Official Telegram
                </span>
              </div>
              <h3 className="text-lg font-black">Exam Informer Telegram Channel</h3>
              <p className="text-xs text-white/90 max-w-sm">
                Get shift-wise answer keys, cutoff predictions, and instant notices for newly released test series.
              </p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition shrink-0" />
          </a>

          <a
            href={BRANDING.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 sm:p-7 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white shadow-lg transition flex items-center justify-between group card-3d"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  WhatsApp Channel
                </span>
              </div>
              <h3 className="text-lg font-black">Exam Informer WhatsApp Channel</h3>
              <p className="text-xs text-white/90 max-w-sm">
                Follow for live exam announcements, CBT admit card alerts, and test updates.
              </p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition shrink-0" />
          </a>
        </div>
      </section>
    </div>
  );
}
