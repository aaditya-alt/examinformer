'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExamLogo } from '@/components/ExamLogo';
import {
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface HomeSeriesItem {
  id: string;
  examCode: string;
  name: string;
  testCount: string;
  category: 'ssc' | 'rrb';
  logoType: 'ssc' | 'rrb';
  tierSupport: string;
}

// Strictly only exams for which we have official questions
const REAL_SERIES_CATALOG: HomeSeriesItem[] = [
  {
    id: 'ssc-cgl-series',
    examCode: 'ssc-cgl',
    name: 'SSC CGL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    testCount: '46 Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Tier I & Tier II'
  },
  {
    id: 'ssc-chsl-series',
    examCode: 'ssc-chsl',
    name: 'SSC CHSL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    testCount: '50 Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Tier I & Tier II'
  },
  {
    id: 'ssc-mts-series',
    examCode: 'ssc-mts',
    name: 'SSC MTS & Havaldar Mock Test Series 2026 PYQs',
    testCount: '16 Official 2025 Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: 'Session 1 & 2'
  },
  {
    id: 'rrb-ntpc-ug-series',
    examCode: 'rrb-ntpc-ug',
    name: 'RRB NTPC Under Graduate (UG) 2025-26 (CBT 1 & 2)',
    testCount: '32 Official Shifts (Section-Wise)',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'CBT 1 & CBT 2'
  },
  {
    id: 'rrb-ntpc-grad-series',
    examCode: 'rrb-ntpc-grad',
    name: 'RRB NTPC Graduate 2025-26 (CBT 1 & 2)',
    testCount: '56 Official Shifts (Mixed Format)',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'CBT 1 & CBT 2'
  },
  {
    id: 'rrb-group-d-series',
    examCode: 'rrb-group-d',
    name: 'RRB Group D Mock Test Series 2025-26 (RRC Level-1)',
    testCount: '20 Official 2025-26 Shifts (4 Subjects)',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'CBT 1'
  },
  {
    id: 'rrb-section-controller-series',
    examCode: 'rrb-section-controller',
    name: 'RRB Section Controller 2025-26 Mock Test Series',
    testCount: '8 Full Tests & Subject Drills',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'CBT 1'
  },
  {
    id: 'rrb-alp-series',
    examCode: 'rrb-alp',
    name: 'RRB ALP (CBT 1 + CBT 2) Mock Test Series 2026',
    testCount: '22 Official 2026 Shifts & Trade Tests',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: 'Stage 1 & 2'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrending, setActiveTrending] = useState<'all' | 'ssc' | 'rrb'>('all');

  const filteredSeries = useMemo(() => {
    return REAL_SERIES_CATALOG.filter((item) => {
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

          {/* Trending Pills: Relevant Exams Only */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-bold shrink-0">Trending:</span>
            {[
              { id: 'all', label: 'All Series' },
              { id: 'ssc', label: 'SSC Exams' },
              { id: 'rrb', label: 'Railway Exams' }
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
              Every question is verified against official commission answer keys. Test papers feature dual sectional countdowns, candidate watermark authentication, and KaTeX mathematical proofs.
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

      {/* ─────────────────────────────────────────────────────────────
          SECTION: OFFICIAL COMMUNITY & SOCIAL CHANNELS
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                <span>Official Channels &bull; ExamInformerNitesh</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Join MockYoddha Official Communities
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Get real-time exam notifications, answer key release links, cutoff predictions, and free CBT test updates.
              </p>
            </div>
            <img
              src="/images/mockyoddha-logo.jpg"
              alt="MockYoddha Emblem"
              className="w-12 h-12 rounded-2xl object-cover shadow-sm self-start sm:self-auto shrink-0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Telegram Card */}
            <a
              href="https://t.me/Examinformer_nitesh"
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-gradient-to-br from-[#0088cc]/10 to-[#0088cc]/5 border border-[#0088cc]/30 hover:border-[#0088cc] hover:shadow-md transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0088cc] transition">
                    ExamInformer Telegram Channel
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Fastest official updates &amp; answer key PDF links
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#0088cc] group-hover:translate-x-1 transition-transform" />
            </a>

            {/* WhatsApp Card */}
            <a
              href="https://whatsapp.com/channel/0029Vb6QbClCXC3BmLaHbT2a"
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-gradient-to-br from-[#25d366]/10 to-[#25d366]/5 border border-[#25d366]/30 hover:border-[#25d366] hover:shadow-md transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#25d366] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.33 3.83.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.3z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#25d366] transition">
                    WhatsApp Official Channel
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Direct alerts &amp; question bank notifications
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#25d366] group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* YouTube Channel Attached Directly Below Telegram & WhatsApp */}
          <a
            href="https://www.youtube.com/channel/UCBjhNClaScmszUPD1yTaSfQ"
            target="_blank"
            rel="noreferrer"
            className="p-5 rounded-2xl bg-gradient-to-r from-red-600/10 via-rose-600/5 to-slate-50 dark:to-slate-800/40 border border-red-600/30 hover:border-red-600 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <div className="text-base font-black text-slate-900 dark:text-white group-hover:text-red-600 transition flex items-center gap-2">
                  <span>ExamInformerNitesh Official YouTube</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">Subscribe</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete video analysis, shift reviews, strategy sessions &amp; CBT mock walkthroughs
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 self-end sm:self-center">
              <span>Watch on YouTube</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
