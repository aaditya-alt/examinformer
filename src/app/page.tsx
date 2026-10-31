'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExamLogo } from '@/components/ExamLogo';
import {
  Search,
  Plus,
  Bookmark,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface HomeSeriesItem {
  id: string;
  examCode: string;
  name: string;
  testCount: string;
  category: 'ssc' | 'rrb' | 'state' | 'bank';
  logoType: 'ssc' | 'rrb';
  tierSupport: string;
}

const HOME_SERIES_CATALOG: HomeSeriesItem[] = [
  {
    id: 'ssc-cgl-series',
    examCode: 'ssc-cgl',
    name: 'SSC CGL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    testCount: 'Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Tier I & Tier II'
  },
  {
    id: 'ssc-chsl-series',
    examCode: 'ssc-chsl',
    name: 'SSC CHSL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    testCount: 'Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Tier I & Tier II'
  },
  {
    id: 'ssc-mts-series',
    examCode: 'ssc-mts',
    name: 'SSC MTS & Havaldar Mock Test Series 2026 PYQs',
    testCount: 'Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Session 1 & 2'
  },
  {
    id: 'ssc-gd-series',
    examCode: 'ssc-gd',
    name: 'SSC GD Constable Mock Test Series 2026 PYQs',
    testCount: 'Official 2025 Shifts & Speed Drills',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'CBT Screening'
  },
  {
    id: 'ssc-cpo-series',
    examCode: 'ssc-cpo',
    name: 'SSC CPO (SI in Delhi Police & CAPF) Mock Test Series',
    testCount: 'Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Paper 1 & 2'
  },
  {
    id: 'rrb-ntpc-series',
    examCode: 'rrb-ntpc',
    name: 'RRB NTPC (Graduate & Under-Graduate CBT 1 & 2) PYQs',
    testCount: 'Official 2025 Shifts & Sectionals',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'CBT 1 & CBT 2'
  },
  {
    id: 'rrb-alp-series',
    examCode: 'rrb-alp',
    name: 'RRB ALP (CBT 1 + CBT 2 + CBAT) Mock Test Series 2026',
    testCount: 'Official 2025 Shifts & Speed Drills',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'Stage 1 & 2'
  },
  {
    id: 'rrb-group-d-series',
    examCode: 'rrb-group-d',
    name: 'RRB Group D (CEN RRC Level-1 CBT) Mock Test Series',
    testCount: 'Official 2025 Shifts & Speed Drills',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'Level-1 CBT'
  },
  {
    id: 'rrb-sc-series',
    examCode: 'rrb-section-controller',
    name: 'RRB Section Controller & Station Master 2026 PYQs',
    testCount: 'Official 2025 Shifts & Sectionals',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'Operating CBT'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrending, setActiveTrending] = useState<'all' | 'ssc' | 'rrb'>('all');

  const filteredSeries = useMemo(() => {
    return HOME_SERIES_CATALOG.filter((item) => {
      if (activeTrending !== 'all' && item.category !== activeTrending) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || item.examCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeTrending, searchQuery]);

  const handleOpenSeries = (examCode: string) => {
    router.push(`/tests?series=${examCode}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors pb-24">
      {/* ─────────────────────────────────────────────────────────────
          HERO & BROWSE SECTION (EXACT REPEATERMOCK AESTHETIC)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0f1117] border-b border-slate-200/90 dark:border-slate-800 pt-10 pb-12 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Mock Test Series for Government Exams
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Authentic previous-year test series for SSC and Railways — attempt timed mocks with Eduquity right-palette CBT simulator, sectional timers, and instant section-wise analysis.
            </p>
          </div>

          {/* Browse Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider hidden sm:block">
              Browse
            </div>
            <div className="relative flex-1 max-w-xl flex items-center">
              <input
                type="text"
                placeholder="Search test series (e.g. SSC CGL, RRB NTPC, CHSL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
              />
              <button
                type="button"
                className="absolute right-1.5 w-9 h-9 rounded-full bg-[#06b6d4] hover:bg-[#0891b2] text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trending Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-bold shrink-0">Trending:</span>
            {[
              { id: 'all', label: 'All Series' },
              { id: 'ssc', label: 'Ssc' },
              { id: 'rrb', label: 'Rrb' },
              { id: 'state', label: 'State Exam' },
              { id: 'police', label: 'Police' },
              { id: 'bank', label: 'Bank' },
              { id: 'upsc', label: 'Upsc' },
              { id: 'defence', label: 'Defence' }
            ].map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveTrending(tag.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTrending === tag.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SERIES CARDS GRID (EXACT REPEATERMOCK CARDS)
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Select Your Target Examination
          </h2>
          <Link
            href="/tests"
            className="text-xs font-bold text-[#0891b2] dark:text-[#06b6d4] hover:underline flex items-center gap-1"
          >
            <span>Explore All Tests</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSeries.map((series) => (
            <div
              key={series.id}
              onClick={() => handleOpenSeries(series.examCode)}
              className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#12141a] hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Official Exam Logo rounded */}
                <div className="w-13 h-13 rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                  <ExamLogo type={series.logoType} size="sm" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {series.name}
                  </h3>
                  <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {series.testCount}
                  </div>
                </div>

                {/* Bookmark / Plus */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="absolute right-4 top-4 w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
                  aria-label="Bookmark"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Info Row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
                <span className="font-bold flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <span>Pattern:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{series.tierSupport}</span>
                </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Series</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: OFFICIAL CBT SIMULATOR FEATURES
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
              ExamInformer Authenticity Standard
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              100% Genuine 2025 Examination Papers
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every question is verified against official answer keys released by the commission. Test papers feature dual sectional countdowns, candidate watermark authentication, and KaTeX mathematical proofs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <Clock className="w-5 h-5 text-amber-400" />
              <h4 className="font-black text-sm">Strict Sectional Timers</h4>
              <p className="text-xs text-slate-400">
                15-min speed caps per section for CGL &amp; CHSL Tier 1; 30m/40m/20m for Mains with auto-lock on expiry.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-black text-sm">Anti-Leak Candidate Watermark</h4>
              <p className="text-xs text-slate-400">
                Your registered mobile number repeats diagonally across every mock screen as proof of candidate identity.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h4 className="font-black text-sm">Real Percentile &amp; Rank</h4>
              <p className="text-xs text-slate-400">
                Live performance analytics comparing your section-wise accuracy against real commission aspirants.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
