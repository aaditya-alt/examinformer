'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CBTTest } from '@/lib/types/cbt';
import { ExamLogo } from '@/components/ExamLogo';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  TOPIC_PRACTICE_LIST,
  TopicItem,
  ExamDefinition
} from '@/lib/types/taxonomy';
import {
  Search,
  Plus,
  Lock,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Zap,
  Globe,
  ArrowRight,
  ShieldCheck,
  Filter,
  Check,
  ChevronRight,
  Sliders,
  Play,
  Bookmark,
  Share2
} from 'lucide-react';

// Master Series Catalog matching RepeaterMock Image 1
interface ExamSeriesItem {
  id: string;
  examCode: string;
  name: string;
  badge: string;
  testCount: string;
  isFree: boolean;
  category: 'ssc' | 'rrb' | 'state' | 'bank';
  logoType: 'ssc' | 'rrb';
  tierSupport: ('tier1' | 'tier2')[];
}

const MASTER_SERIES_CATALOG: ExamSeriesItem[] = [
  {
    id: 'ssc-cgl-series',
    examCode: 'ssc-cgl',
    name: 'SSC CGL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    badge: '1350 Free Tests',
    testCount: '1350',
    isFree: true,
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1', 'tier2']
  },
  {
    id: 'ssc-chsl-series',
    examCode: 'ssc-chsl',
    name: 'SSC CHSL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    badge: '850 Free Tests',
    testCount: '850',
    isFree: true,
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1', 'tier2']
  },
  {
    id: 'ssc-mts-series',
    examCode: 'ssc-mts',
    name: 'SSC MTS & Havaldar Mock Test Series 2026 PYQs',
    badge: '540 Free Tests',
    testCount: '540',
    isFree: true,
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1']
  },
  {
    id: 'ssc-gd-series',
    examCode: 'ssc-gd',
    name: 'SSC GD Constable Mock Test Series 2026 PYQs',
    badge: '720 Free Tests',
    testCount: '720',
    isFree: true,
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1']
  },
  {
    id: 'ssc-cpo-series',
    examCode: 'ssc-cpo',
    name: 'SSC CPO (SI in Delhi Police & CAPF) Mock Test Series',
    badge: '320 Free Tests',
    testCount: '320',
    isFree: true,
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1', 'tier2']
  },
  {
    id: 'rrb-ntpc-series',
    examCode: 'rrb-ntpc',
    name: 'RRB NTPC (Graduate & Under-Graduate CBT 1 & 2) PYQs',
    badge: '450 Free Tests',
    testCount: '450',
    isFree: true,
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1', 'tier2']
  },
  {
    id: 'rrb-alp-series',
    examCode: 'rrb-alp',
    name: 'RRB ALP (CBT 1 + CBT 2 + CBAT) Mock Test Series 2026',
    badge: '111 Free Tests',
    testCount: '111',
    isFree: true,
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1']
  },
  {
    id: 'rrb-group-d-series',
    examCode: 'rrb-group-d',
    name: 'RRB Group D (CEN RRC Level-1 CBT) Mock Test Series',
    badge: '380 Free Tests',
    testCount: '380',
    isFree: true,
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1']
  },
  {
    id: 'rrb-sc-series',
    examCode: 'rrb-section-controller',
    name: 'RRB Section Controller & Station Master 2026 PYQs',
    badge: '190 Free Tests',
    testCount: '190',
    isFree: true,
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1']
  }
];

function TestsExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Selected series from query or default
  const paramSeries = searchParams.get('series');
  const [selectedSeries, setSelectedSeries] = useState<ExamSeriesItem>(() => {
    if (paramSeries) {
      const found = MASTER_SERIES_CATALOG.find((s) => s.examCode === paramSeries || s.id === paramSeries);
      if (found) return found;
    }
    return MASTER_SERIES_CATALOG[0]; // Default SSC CGL
  });

  // Active Category Tab inside Series (Image 2):
  // 'pyq_tier1' | 'pyst_tier1' (Sectional) | 'pyq_tier2' | 'topic_practice'
  const [activeCategoryTab, setActiveCategoryTab] = useState<'pyq_tier1' | 'pyst_tier1' | 'pyq_tier2' | 'topic_practice'>('pyq_tier1');

  // Year Filter Pill inside Series (Image 2): 'all' | '2025' | '2024' | '2023' | '2022'
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Search in series / test items
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [seriesCatalogSearch, setSeriesCatalogSearch] = useState('');
  const [trendingFilter, setTrendingFilter] = useState<'all' | 'ssc' | 'rrb'>('all');

  // Sort: 'newest' | 'oldest'
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // All Tests loaded from API
  const [allTests, setAllTests] = useState<CBTTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Attempted tests record for showing direct "View Solutions"
  const [attemptedMap, setAttemptedMap] = useState<Record<string, { score?: number; accuracy?: number }>>({});

  // Topic Drill Configuration Modal State
  const [activeTopicModal, setActiveTopicModal] = useState<TopicItem | null>(null);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(15);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(15);

  // Load Tests
  useEffect(() => {
    setLoading(true);
    fetch('/api/tests')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setAllTests(json.data);
        }
      })
      .catch((err) => console.error('Failed to load tests catalog:', err))
      .finally(() => setLoading(false));
  }, []);

  // Load Attempted Tests from Supabase & SessionStorage
  useEffect(() => {
    const map: Record<string, { score?: number; accuracy?: number }> = {};

    // 1. Session Storage
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(sessionStorage);
        for (const k of keys) {
          if (k.startsWith('cbt_result_')) {
            const raw = sessionStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.testId) {
                map[parsed.testId] = {
                  score: parsed.finalScore,
                  accuracy: parsed.accuracyPercentage
                };
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not read sessionStorage:', err);
      }
    }

    // 2. Supabase if logged in
    if (user && isSupabaseConfigured && supabase) {
      supabase
        .from('test_attempts')
        .select('test_id, total_score, accuracy')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (!error && data) {
            data.forEach((row: any) => {
              if (row.test_id && !map[row.test_id]) {
                map[row.test_id] = {
                  score: row.total_score,
                  accuracy: row.accuracy
                };
              }
            });
            setAttemptedMap({ ...map });
          }
        })
        .catch((err) => console.warn('Supabase attempt read err:', err));
    }

    setAttemptedMap(map);
  }, [user]);

  // Filtered series list for Top Catalog
  const filteredCatalogSeries = useMemo(() => {
    return MASTER_SERIES_CATALOG.filter((s) => {
      if (trendingFilter !== 'all' && s.category !== trendingFilter) return false;
      if (seriesCatalogSearch) {
        const q = seriesCatalogSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.examCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [trendingFilter, seriesCatalogSearch]);

  // Compute test list for selected series & active subtab
  const currentSeriesTests = useMemo(() => {
    let codePattern = selectedSeries.examCode;
    let targetTier = activeCategoryTab === 'pyq_tier2' ? 'tier2' : 'tier1';

    let list = allTests.filter((t) => {
      const code = (t.examCode || '').toLowerCase();
      // Match exam family
      const matchesExam = code.includes(codePattern);
      if (!matchesExam) return false;

      // Tier check if applicable
      if (activeCategoryTab === 'pyq_tier2') {
        return code.includes('tier2') || code.includes('cbt2');
      } else if (activeCategoryTab === 'pyq_tier1' || activeCategoryTab === 'pyst_tier1') {
        if (code.includes('tier2') || code.includes('cbt2')) return false;
        return true;
      }
      return true;
    });

    // Year filter
    if (selectedYear !== 'all') {
      list = list.filter((t) => {
        const titleLower = t.title.toLowerCase();
        return titleLower.includes(selectedYear) || (t.examCode || '').includes(selectedYear);
      });
    }

    // Search query
    if (testSearchQuery) {
      const q = testSearchQuery.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }

    // Sort
    if (sortOrder === 'oldest') {
      return [...list].reverse();
    }
    return list;
  }, [allTests, selectedSeries, activeCategoryTab, selectedYear, testSearchQuery, sortOrder]);

  // Open custom modal for topic
  const handleOpenTopicModal = (topic: TopicItem) => {
    setActiveTopicModal(topic);
    setCustomQuestionCount(Math.min(15, topic.questionCountEstimate));
    setCustomDurationMinutes(15);
  };

  const handleLaunchCustomTopicTest = () => {
    if (!activeTopicModal) return;
    const testId = `topic-${activeTopicModal.subject}-${activeTopicModal.id}-${customQuestionCount}`;
    router.push(`/tests/${testId}`);
    setActiveTopicModal(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors pb-24">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REPEATERMOCK TOP HERO & SERIES BROWSE (IMAGE 1)
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f1117] pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Free Mock Test Series for Government Exams
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Free previous-year test series for SSC, Railways, Banking, and more — attempt timed mocks and get instant section-wise analysis.{' '}
              <button
                type="button"
                onClick={() => {
                  setSelectedSeries(MASTER_SERIES_CATALOG[0]);
                  setActiveCategoryTab('pyq_tier1');
                }}
                className="text-[#0891b2] dark:text-[#06b6d4] font-bold hover:underline cursor-pointer"
              >
                try free mock tests.
              </button>
            </p>
          </div>

          {/* Search bar & Browse (RepeaterMock style) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider hidden sm:block">
              Browse
            </div>
            <div className="relative flex-1 max-w-xl flex items-center">
              <input
                type="text"
                placeholder="Search test series (e.g. SSC CGL, RRB NTPC, CHSL)..."
                value={seriesCatalogSearch}
                onChange={(e) => setSeriesCatalogSearch(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
              />
              <button
                type="button"
                className="absolute right-1 w-8 h-8 rounded-full bg-[#06b6d4] hover:bg-[#0891b2] text-white flex items-center justify-center transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trending Pills (Image 1) */}
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
                onClick={() => setTrendingFilter(tag.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  trendingFilter === tag.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Series Cards Grid (Image 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredCatalogSeries.map((series) => {
              const isSelected = selectedSeries.id === series.id;
              return (
                <div
                  key={series.id}
                  onClick={() => setSelectedSeries(series)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative bg-white dark:bg-[#12141a] flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#06b6d4] ring-2 ring-[#06b6d4]/20 shadow-md'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-cyan-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Official Exam Logo rounded */}
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-1 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                      <ExamLogo type={series.logoType} size="sm" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {series.name}
                      </h3>
                      <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {series.badge}
                      </div>
                    </div>

                    {/* Plus Bookmark icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute right-3.5 top-3.5 w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
                      aria-label="Save series"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom pill row */}
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <span className="font-bold text-slate-500">Official Blueprints</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      FREE
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REPEATERMOCK SERIES DETAIL VIEW (IMAGE 2)
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Breadcrumb matching Image 2 */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 truncate">{selectedSeries.name}</span>
        </div>

        {/* Series Banner Card matching Image 2 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <ExamLogo type={selectedSeries.logoType} size="md" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Free {selectedSeries.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  free mock tests without signup
                </span>
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                  {selectedSeries.badge.toUpperCase()}
                </span>
                <span className="text-[11px] font-bold text-slate-500">English, Hindi</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
          >
            Add to Dashboard
          </button>
        </div>

        {/* Main Content Area: Left Test Series List + Right Pass Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: TESTS DIRECTORY (8 COLS) ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header + Search & Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {selectedSeries.name} All Tests ({currentSeriesTests.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search shifts..."
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 shrink-0"
                >
                  {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                </button>
              </div>
            </div>

            {/* Main Category Tabs matching Image 2 */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveCategoryTab('pyq_tier1')}
                className={`pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                  activeCategoryTab === 'pyq_tier1'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Previous Year Paper (Tier I) (New Pattern) ({allTests.filter(t => t.examCode.includes(selectedSeries.examCode) && !t.examCode.includes('tier2')).length})
                {activeCategoryTab === 'pyq_tier1' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('pyst_tier1')}
                className={`pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                  activeCategoryTab === 'pyst_tier1'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                PYST (Tier I) Sectional Tests ({allTests.filter(t => t.examCode.includes(selectedSeries.examCode)).length * 4})
                {activeCategoryTab === 'pyst_tier1' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>

              {selectedSeries.tierSupport.includes('tier2') && (
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('pyq_tier2')}
                  className={`pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                    activeCategoryTab === 'pyq_tier2'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Previous Year Paper (Tier II) (55)
                  {activeCategoryTab === 'pyq_tier2' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveCategoryTab('topic_practice')}
                className={`pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                  activeCategoryTab === 'topic_practice'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Topic-Wise Practice Tests (120)
                {activeCategoryTab === 'topic_practice' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Year Filter Pills matching Image 2 */}
            {activeCategoryTab !== 'topic_practice' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: '2025', label: '2025 (45)' },
                  { id: '2024', label: '2024 (36)' },
                  { id: '2023', label: '2023 (39)' },
                  { id: '2022', label: '2022 (40)' },
                  { id: '2021', label: '2021 - 2022 (21)' },
                  { id: '2020', label: '2020 - 2021 (21)' }
                ].map((yr) => (
                  <button
                    key={yr.id}
                    type="button"
                    onClick={() => setSelectedYear(yr.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedYear === yr.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {yr.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── SUB-TAB 1 & 2: FULL SHIFTS LIST (TIER 1 or TIER 2) ── */}
            {(activeCategoryTab === 'pyq_tier1' || activeCategoryTab === 'pyq_tier2') && (
              <div className="space-y-3.5">
                {currentSeriesTests.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      No shift papers matching filters
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Switch year filter to "All" or "2025" to view available official papers.
                    </p>
                  </div>
                ) : (
                  currentSeriesTests.map((test) => {
                    const attemptedInfo = attemptedMap[test.id];
                    const isAttempted = !!attemptedInfo;

                    return (
                      <div
                        key={test.id}
                        className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                            {test.title}
                          </h4>

                          {/* Metadata row matching Image 2 */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{test.durationMinutes} Mins</span>
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>{test.totalMarks} Marks</span>
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>{test.totalQuestions} Questions</span>
                            </span>
                          </div>

                          {/* Status text matching Image 2 */}
                          <div className="text-[11px] font-bold">
                            {isAttempted ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Completed &bull; Score: {attemptedInfo.score ?? '—'} / {test.totalMarks} &bull; Accuracy: {attemptedInfo.accuracy ?? 85}%
                              </span>
                            ) : (
                              <span className="text-[#d97706] dark:text-amber-500">
                                Ready to attempt &bull; Eduquity right-palette CBT simulator
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>English, Hindi</span>
                          </div>
                        </div>

                        {/* Action buttons matching Image 2 */}
                        <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0">
                          {isAttempted ? (
                            <>
                              <Link
                                href={`/tests/${test.id}?mode=solution`}
                                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>View Solutions</span>
                              </Link>
                              <Link
                                href={`/tests/${test.id}`}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                              >
                                Reattempt
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/tests/${test.id}`}
                              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-black text-xs tracking-wide shadow-xs transition text-center"
                            >
                              Attempt
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── SUB-TAB 3: PYST SECTIONAL TESTS ORGANIZED BY SHIFT NAME ── */}
            {activeCategoryTab === 'pyst_tier1' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <span>
                    ⚡ <strong>Eduquity Sectional Speed Mocks:</strong> Organized shift-wise. Select any shift to drill its 4 individual 15-minute sections!
                  </span>
                </div>

                {currentSeriesTests.map((shiftTest) => (
                  <div
                    key={shiftTest.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Authentic Shift Paper
                        </span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {shiftTest.title}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        4 Sections &bull; 15 Mins Each
                      </span>
                    </div>

                    {/* 4 Shift Sections */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {shiftTest.sections.map((sec, secIdx) => {
                        const secTestId = `sec-${shiftTest.id}-sec-${secIdx}`;
                        const isSecAttempted = !!attemptedMap[secTestId];

                        return (
                          <div
                            key={secIdx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {sec.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {sec.questions.length} Qs &bull; 15 Mins &bull; {sec.questions.length * 2} Marks
                              </div>
                            </div>

                            {isSecAttempted ? (
                              <Link
                                href={`/tests/${secTestId}?mode=solution`}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] shrink-0 hover:bg-emerald-700 transition"
                              >
                                Solutions
                              </Link>
                            ) : (
                              <Link
                                href={`/tests/${secTestId}`}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shrink-0 transition"
                              >
                                Start Section
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SUB-TAB 4: DEDICATED TOPIC-WISE DRILLS ── */}
            {activeCategoryTab === 'topic_practice' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                  <span>
                    🎯 <strong>Custom Topic Drills:</strong> Pick any chapter to configure question count &amp; time. Real 2025 shift questions with authenticity badges!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TOPIC_PRACTICE_LIST.map((topic) => (
                    <div
                      key={topic.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                            {topic.subject.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {topic.questionCountEstimate} Questions Bank
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {topic.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          2025 PYQs with step-by-step KaTeX mathematical solutions.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTopicModal(topic)}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Configure &amp; Practice</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: PASS & SIDEBAR INFO (4 COLS MATCHING IMAGE 2) ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Available Languages Card matching Image 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                AVAILABLE LANGUAGES
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200">
                  English
                </span>
                <span className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Hindi
                </span>
              </div>
            </div>

            {/* 1-DAY PASS Card matching Image 2 */}
            <div className="p-6 rounded-3xl bg-[#091e36] text-white shadow-xl relative overflow-hidden space-y-4 border border-blue-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200/20 flex items-center justify-center text-xs font-black">
                    ₹
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                    1-DAY PASS
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black tracking-tight leading-snug">
                  Unlock every test in this series.
                </h4>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Attempt pure 2025 PYQ shifts in Eduquity exam hall with live candidate watermark and dual sectional timer.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-blue-100 font-semibold pt-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All 2025 official shifts unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant step-by-step KaTeX solutions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Free for serious aspirants</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('pyq_tier1');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Access All Tests Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CUSTOM TOPIC PRACTICE CONFIGURATION
      ───────────────────────────────────────────────────────────── */}
      {activeTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  {activeTopicModal.subject.toUpperCase()} PRACTICE DRILL
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {activeTopicModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopicModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Select Number of Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Number of Questions:</span>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                  {customQuestionCount} Qs (Max {activeTopicModal.questionCountEstimate})
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={Math.min(30, activeTopicModal.questionCountEstimate)}
                step="5"
                value={customQuestionCount}
                onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>5 Qs</span>
                <span>10 Qs</span>
                <span>15 Qs</span>
                <span>20 Qs</span>
                <span>{Math.min(30, activeTopicModal.questionCountEstimate)} Qs</span>
              </div>
            </div>

            {/* Select Time */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Practice Time Limit:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mins: 10, label: '10 Mins' },
                  { mins: 15, label: '15 Mins' },
                  { mins: 20, label: '20 Mins' }
                ].map((t) => (
                  <button
                    key={t.mins}
                    type="button"
                    onClick={() => setCustomDurationMinutes(t.mins)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      customDurationMinutes === t.mins
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Authenticity Guarantee notice */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              📌 Every question includes its official 2025 examination shift stamp and KaTeX step-by-step mathematical proofs.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTopicModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchCustomTopicTest}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20"
              >
                Start CBT Drill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestsExplorerPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading CBT mock hall...</div>}>
      <TestsExplorerContent />
    </Suspense>
  );
}
