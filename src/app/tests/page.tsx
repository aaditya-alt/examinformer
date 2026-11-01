'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CBTTest } from '@/lib/types/cbt';
import { ExamLogo } from '@/components/ExamLogo';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  TOPIC_PRACTICE_LIST,
  TopicItem
} from '@/lib/types/taxonomy';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileText,
  Globe,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Sliders,
  ArrowLeft,
  Play
} from 'lucide-react';

interface ExamSeriesItem {
  id: string;
  examCode: string;
  name: string;
  badge: string;
  category: 'ssc' | 'rrb';
  logoType: 'ssc' | 'rrb';
  tierSupport: ('tier1' | 'tier2')[];
  markingScheme: {
    correct: number;
    negative: number;
    duration: number;
    questions: number;
  };
}

// Strictly only exams for which we have official questions
const MASTER_SERIES_CATALOG: ExamSeriesItem[] = [
  {
    id: 'ssc-cgl-series',
    examCode: 'ssc-cgl',
    name: 'SSC CGL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    badge: '46 Official Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1', 'tier2'],
    markingScheme: { correct: 2, negative: 0.5, duration: 60, questions: 100 }
  },
  {
    id: 'ssc-chsl-series',
    examCode: 'ssc-chsl',
    name: 'SSC CHSL Mock Test Series 2026 (Tier I & Tier II) PYQs',
    badge: '50 Official Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1', 'tier2'],
    markingScheme: { correct: 2, negative: 0.5, duration: 60, questions: 100 }
  },
  {
    id: 'ssc-mts-series',
    examCode: 'ssc-mts',
    name: 'SSC MTS & Havaldar Mock Test Series 2026 PYQs',
    badge: '16 Official Shifts & Sectionals',
    category: 'ssc',
    logoType: 'ssc',
    tierSupport: ['tier1'],
    markingScheme: { correct: 3, negative: 1, duration: 90, questions: 90 }
  },
  {
    id: 'rrb-ntpc-ug-series',
    examCode: 'rrb-ntpc-ug',
    name: 'RRB NTPC Under Graduate (UG) 2025-26 (CBT 1 & 2)',
    badge: 'Official Shifts (Section-Wise)',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1', 'tier2'],
    markingScheme: { correct: 1, negative: 0.33, duration: 90, questions: 100 }
  },
  {
    id: 'rrb-ntpc-grad-series',
    examCode: 'rrb-ntpc-grad',
    name: 'RRB NTPC Graduate 2025-26 (CBT 1 & 2)',
    badge: 'Official Shifts (Mixed Format)',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1', 'tier2'],
    markingScheme: { correct: 1, negative: 0.33, duration: 90, questions: 100 }
  },
  {
    id: 'rrb-group-d-series',
    examCode: 'rrb-group-d',
    name: 'RRB Group D Mock Test Series 2025-26 (RRC Level-1)',
    badge: 'Official 2025-26 Shifts (4 Subjects)',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1'],
    markingScheme: { correct: 1, negative: 0.33, duration: 90, questions: 100 }
  },
  {
    id: 'rrb-section-controller-series',
    examCode: 'rrb-section-controller',
    name: 'RRB Section Controller 2025-26 Mock Test Series',
    badge: 'Official Papers & Subject Tests',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1'],
    markingScheme: { correct: 1, negative: 0.33, duration: 90, questions: 100 }
  },
  {
    id: 'rrb-alp-series',
    examCode: 'rrb-alp',
    name: 'RRB ALP (CBT 1 + CBT 2) Mock Test Series 2026',
    badge: 'Official 2026 Shifts & Trade Tests',
    category: 'rrb',
    logoType: 'rrb',
    tierSupport: ['tier1', 'tier2'],
    markingScheme: { correct: 1, negative: 0.33, duration: 60, questions: 75 }
  }
];

function extractTestExamYear(title: string, examCode?: string, testId?: string): string {
  if (title.includes('—') || title.includes(' - ')) {
    const delimiter = title.includes('—') ? '—' : ' - ';
    const parts = title.split(delimiter);
    const datePart = parts[parts.length - 1];
    const dateYear = datePart.match(/(202\d)/);
    if (dateYear) return dateYear[1];
  }
  const matches = title.match(/(202\d)/g);
  if (matches && matches.length > 0) {
    return matches[matches.length - 1];
  }
  const idMatch = (testId || '').match(/(202\d)/);
  if (idMatch) return idMatch[1];
  const codeMatch = (examCode || '').match(/(202\d)/);
  if (codeMatch) return codeMatch[1];
  return '';
}

function getSeriesTopicCount(topicId: string, subject: string, seriesCode: string): number {
  const code = (seriesCode || '').toLowerCase();
  if (code.includes('ntpc-ug')) {
    if (subject === 'ga') return 160;
    if (subject === 'math') return 140;
    if (subject === 'reasoning') return 140;
  }
  if (code.includes('ntpc-grad') || code === 'rrb-ntpc') {
    if (subject === 'ga') return 110;
    if (subject === 'math') return 95;
    if (subject === 'reasoning') return 95;
  }
  if (code.includes('cgl')) {
    if (topicId.includes('trig')) return 92;
    if (topicId.includes('geomet')) return 88;
    if (topicId.includes('profit')) return 78;
    if (topicId.includes('percent')) return 85;
    if (topicId.includes('coding')) return 75;
    if (topicId.includes('series')) return 90;
    if (topicId.includes('error')) return 84;
    if (topicId.includes('synonym')) return 95;
    if (topicId.includes('polity')) return 76;
    if (topicId.includes('history')) return 68;
    return 65;
  }
  if (code.includes('chsl')) {
    if (topicId.includes('trig')) return 86;
    if (topicId.includes('profit')) return 82;
    if (topicId.includes('percent')) return 90;
    if (topicId.includes('coding')) return 80;
    if (topicId.includes('series')) return 95;
    if (topicId.includes('error')) return 90;
    if (topicId.includes('synonym')) return 102;
    if (topicId.includes('polity')) return 80;
    return 70;
  }
  if (code.includes('alp')) {
    if (subject === 'ga') return 55;
    if (subject === 'math') return 50;
    if (subject === 'reasoning') return 60;
  }
  if (code.includes('group-d')) {
    if (subject === 'ga') return 45;
    if (subject === 'math') return 40;
    if (subject === 'reasoning') return 48;
  }
  if (code.includes('mts')) {
    return 35;
  }
  return 45;
}

function TestsExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active series query param: If present, shows dedicated series page; otherwise shows series catalog
  const seriesQuery = searchParams.get('series');

  // Selected series state
  const selectedSeries = useMemo(() => {
    if (!seriesQuery) return MASTER_SERIES_CATALOG[0];
    const found = MASTER_SERIES_CATALOG.find(
      (item) => item.examCode === seriesQuery || item.id === seriesQuery || (seriesQuery === 'rrb-ntpc' && item.examCode === 'rrb-ntpc-grad')
    );
    return found || MASTER_SERIES_CATALOG[0];
  }, [seriesQuery]);

  // Active Category Tab inside Series Detail View:
  // 'pyq_tier1' | 'pyst_tier1' (Sectional) | 'pyq_tier2' | 'pyst_tier2' | 'topic_practice'
  const [activeCategoryTab, setActiveCategoryTab] = useState<'pyq_tier1' | 'pyst_tier1' | 'pyq_tier2' | 'pyst_tier2' | 'topic_practice'>('pyq_tier1');

  // Year Filter Pill inside Series: 'all' or real years only
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Search & Filter
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [seriesCatalogSearch, setSeriesCatalogSearch] = useState('');
  const [trendingFilter, setTrendingFilter] = useState<'all' | 'ssc' | 'rrb'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // All Tests loaded from API
  const [allTests, setAllTests] = useState<CBTTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Attempted tests record for showing direct "View Solutions"
  const [attemptedMap, setAttemptedMap] = useState<Record<string, { score?: number; accuracy?: number }>>({});
  // Paused tests record for showing "Resume Test"
  const [pausedMap, setPausedMap] = useState<Record<string, { secondsRemaining: number; answeredCount: number }>>({});

  // Topic Drill Configuration Modal State
  const [activeTopicModal, setActiveTopicModal] = useState<TopicItem | null>(null);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(15);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(15);

  // Load Tests Catalog
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

  // Load Attempted Tests
  useEffect(() => {
    const map: Record<string, { score?: number; accuracy?: number }> = {};

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
        });
    }

    setAttemptedMap(map);

    // Read paused sessions from localStorage
    if (typeof window !== 'undefined') {
      try {
        const pMap: Record<string, { secondsRemaining: number; answeredCount: number }> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('cbt_paused_session_')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.testId) {
                pMap[parsed.testId] = {
                  secondsRemaining: parsed.overallSecondsRemaining || 0,
                  answeredCount: parsed.userResponses ? Object.keys(parsed.userResponses).length : 0
                };
              }
            }
          }
        }
        setPausedMap(pMap);
      } catch (err) {
        console.warn('Could not read localStorage for paused sessions:', err);
      }
    }
  }, [user]);

  // Navigate to dedicated series page
  const handleOpenSeries = (series: ExamSeriesItem) => {
    setActiveCategoryTab('pyq_tier1');
    setSelectedYear('all');
    router.push(`/tests?series=${series.examCode}`);
  };

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

  // Base tests for selected series & active category before year/text filters
  const baseCategoryTests = useMemo(() => {
    const codePattern = selectedSeries.examCode;

    return allTests.filter((t) => {
      const code = (t.examCode || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const isUg = id.includes('ug') || title.includes('under graduate') || title.includes(' ug') || title.includes('(ug)');

      let matchesExam = false;
      if (codePattern === 'rrb-ntpc-grad') {
        // Strictly only Graduate level papers; exclude all UG papers!
        matchesExam = !isUg && (id.includes('grad') || title.includes('graduate') || code === 'rrb-ntpc-cbt1' || code.includes('grad') || code.includes('rrb-ntpc'));
      } else if (codePattern === 'rrb-ntpc-ug') {
        // Strictly only Under Graduate (UG) papers
        matchesExam = isUg && (id.includes('ntpc') || code.includes('ntpc') || title.includes('ntpc'));
      } else {
        matchesExam = code.includes(codePattern) || id.includes(codePattern);
      }

      if (!matchesExam) return false;

      if (activeCategoryTab === 'pyq_tier2' || activeCategoryTab === 'pyst_tier2') {
        return code.includes('tier2') || code.includes('cbt2') || id.includes('cbt2') || id.includes('tier2');
      } else if (activeCategoryTab === 'pyq_tier1' || activeCategoryTab === 'pyst_tier1') {
        if (code.includes('tier2') || code.includes('cbt2') || id.includes('cbt2') || id.includes('tier2')) return false;
        return true;
      }
      return true;
    });
  }, [allTests, selectedSeries, activeCategoryTab]);

  // Compute ONLY the REAL years that actually exist in baseCategoryTests (extracting true exam shift year)
  const realAvailableYears = useMemo(() => {
    const yrSet = new Set<string>();
    baseCategoryTests.forEach((t) => {
      const yr = extractTestExamYear(t.title, t.examCode, t.id);
      if (yr) yrSet.add(yr);
    });
    return Array.from(yrSet).sort().reverse();
  }, [baseCategoryTests]);

  // Filter topics strictly according to the exam family (Railway has NO English topics)
  const isRailway = selectedSeries.category === 'rrb' || selectedSeries.examCode.startsWith('rrb-');
  const filteredTopics = useMemo(() => {
    return TOPIC_PRACTICE_LIST.filter((topic) => {
      if (isRailway && (topic.subject === 'english' || topic.scope === 'ssc')) return false;
      if (!isRailway && topic.scope === 'rrb') return false;
      return true;
    });
  }, [isRailway]);

  // Compute filtered test list for selected series, category, year & search
  const currentSeriesTests = useMemo(() => {
    let list = [...baseCategoryTests];

    // Real Year Filter (using exact extracted exam shift year)
    if (selectedYear !== 'all') {
      list = list.filter((t) => {
        const yr = extractTestExamYear(t.title, t.examCode, t.id);
        return yr === selectedYear;
      });
    }

    // Search query
    if (testSearchQuery) {
      const q = testSearchQuery.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }

    if (sortOrder === 'oldest') {
      return [...list].reverse();
    }
    return list;
  }, [baseCategoryTests, selectedYear, testSearchQuery, sortOrder]);

  const handleOpenTopicModal = (topic: TopicItem) => {
    setActiveTopicModal(topic);
    const countInSeries = getSeriesTopicCount(topic.id, topic.subject, selectedSeries.examCode);
    setCustomQuestionCount(Math.min(15, countInSeries));
    setCustomDurationMinutes(15);
  };

  const handleLaunchCustomTopicTest = () => {
    if (!activeTopicModal) return;
    let excludeParam = '';
    try {
      const mastery = JSON.parse(localStorage.getItem('mm_user_question_mastery') || '{}');
      const correctIds = Object.keys(mastery).filter((k: string) => mastery[k] === 'correct');
      if (correctIds.length > 0) {
        excludeParam = `?excludeIds=${encodeURIComponent(correctIds.slice(-50).join(','))}`;
      }
    } catch (e) {}
    const testId = `topic-${selectedSeries.examCode}-${activeTopicModal.subject}-${activeTopicModal.id}-${customQuestionCount}-${customDurationMinutes}`;
    router.push(`/tests/${testId}${excludeParam}`);
    setActiveTopicModal(null);
  };

  // ─────────────────────────────────────────────────────────────
  // VIEW A: MAIN CATALOG PAGE (When no ?series= query param is in URL)
  // ─────────────────────────────────────────────────────────────
  if (!seriesQuery) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors pb-24">
        {/* Top Hero Banner */}
        <section className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f1117] pt-10 pb-12 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Government Exam Test Series
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Attempt authentic previous-year test series for SSC and Railways with official Eduquity right-palette CBT simulator, sectional timers, and instant performance analysis.
              </p>
            </div>

            {/* Search bar & Browse */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="text-xs font-black uppercase text-slate-500 tracking-wider hidden sm:block">
                Browse
              </div>
              <div className="relative flex-1 max-w-xl flex items-center">
                <input
                  type="text"
                  placeholder="Search test series (e.g. SSC CGL, RRB NTPC, CHSL)..."
                  value={seriesCatalogSearch}
                  onChange={(e) => setSeriesCatalogSearch(e.target.value)}
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

            {/* Relevant Trending Tags Only */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-slate-400 font-bold shrink-0">Filter:</span>
              {[
                { id: 'all', label: 'All Series' },
                { id: 'ssc', label: 'SSC Series' },
                { id: 'rrb', label: 'Railway Series' }
              ].map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setTrendingFilter(tag.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    trendingFilter === tag.id
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

        {/* Series Cards Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Select an Examination Series to View Tests
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {filteredCatalogSeries.length} Active Series
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCatalogSeries.map((series) => (
              <div
                key={series.id}
                onClick={() => handleOpenSeries(series)}
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
                      {series.badge}
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
                    <span className="text-slate-900 dark:text-white font-extrabold">
                      {series.tierSupport.join(' & ').toUpperCase()}
                    </span>
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
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW B: DEDICATED SERIES DETAIL PAGE (When ?series=... is selected)
  // ─────────────────────────────────────────────────────────────
  const cbt1TabLabel = isRailway ? 'Official Papers (CBT 1)' : 'Previous Year Paper (Tier I)';
  const sectionalTabLabel = isRailway ? 'Section-Wise Speed Tests' : 'PYST Sectional Tests';
  const cbt2TabLabel = isRailway ? 'Official Papers (CBT 2)' : 'Previous Year Paper (Tier II)';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Bar with Back Button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Link
              href="/tests"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Test Series</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 truncate font-bold">
              {selectedSeries.name}
            </span>
          </div>

          {/* Quick Exam Switcher Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-bold shrink-0 hidden sm:inline">Switch:</span>
            {MASTER_SERIES_CATALOG.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleOpenSeries(s)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedSeries.id === s.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                }`}
              >
                {s.name.split('Mock')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Series Banner Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <ExamLogo type={selectedSeries.logoType} size="md" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedSeries.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  {selectedSeries.badge}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  English, Hindi &bull; Eduquity CBT Simulation
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
          >
            My Attempt History
          </button>
        </div>

        {/* Main Content Area: Left Test Series List + Right Pattern Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: TESTS DIRECTORY (8 COLS) ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header + Search & Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Available Papers ({currentSeriesTests.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter shifts..."
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

            {/* Main Category Tabs */}
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
                {cbt1TabLabel} ({allTests.filter(t => (t.examCode || '').toLowerCase().includes(selectedSeries.examCode) && !(t.examCode || '').toLowerCase().includes('tier2') && !(t.examCode || '').toLowerCase().includes('cbt2')).length})
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
                {sectionalTabLabel}
                {activeCategoryTab === 'pyst_tier1' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>

              {selectedSeries.tierSupport.includes('tier2') && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryTab('pyq_tier2')}
                    className={`pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                      activeCategoryTab === 'pyq_tier2'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cbt2TabLabel} ({allTests.filter(t => (t.examCode || '').toLowerCase().includes(selectedSeries.examCode) && ((t.examCode || '').toLowerCase().includes('tier2') || (t.examCode || '').toLowerCase().includes('cbt2'))).length})
                    {activeCategoryTab === 'pyq_tier2' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategoryTab('pyst_tier2')}
                    className={`pb-2.5 px-1 relative transition whitespace-nowrap cursor-pointer ${
                      activeCategoryTab === 'pyst_tier2'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isRailway ? 'CBT 2 Sectionals' : 'PYST Tier II Sectionals'}
                    {activeCategoryTab === 'pyst_tier2' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </button>
                </>
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
                Topic-Wise Practice Tests
                {activeCategoryTab === 'topic_practice' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Year Filter Pills: Strictly real available years */}
            {activeCategoryTab !== 'topic_practice' && realAvailableYears.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedYear('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedYear === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  All Available ({baseCategoryTests.length})
                </button>

                {realAvailableYears.map((yr) => {
                  const countForYear = baseCategoryTests.filter((t) => t.title.includes(yr)).length;
                  if (countForYear === 0) return null;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedYear === yr
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {yr} ({countForYear})
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── SUB-TAB 1 & 2: FULL SHIFTS LIST (TIER 1 or TIER 2) ── */}
            {(activeCategoryTab === 'pyq_tier1' || activeCategoryTab === 'pyq_tier2') && (
              <div className="space-y-3.5">
                {currentSeriesTests.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      No shift papers found
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Check your search query or switch year filter to "All Available".
                    </p>
                  </div>
                ) : (
                  currentSeriesTests.map((test) => {
                    const attemptedInfo = attemptedMap[test.id];
                    const isAttempted = !!attemptedInfo;
                    const pausedInfo = pausedMap[test.id];
                    const isPaused = !isAttempted && !!pausedInfo;

                    return (
                      <div
                        key={test.id}
                        className={`p-5 rounded-2xl bg-white dark:bg-[#12141a] border ${
                          isPaused
                            ? 'border-amber-400 dark:border-amber-600 shadow-amber-500/10'
                            : 'border-slate-200/90 dark:border-slate-800'
                        } shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                            {test.title}
                          </h4>

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

                          <div className="text-[11px] font-bold">
                            {isPaused ? (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span>In Progress (Paused) &bull; {Math.floor(pausedInfo.secondsRemaining / 60)}m left &bull; {pausedInfo.answeredCount} answered</span>
                              </span>
                            ) : isAttempted ? (
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
                            <span>English, Hindi &bull; {isRailway ? 'Free Section Navigation (No Sectional Lock)' : '15-min Sectional Timer'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0">
                          {isPaused ? (
                            <Link
                              href={`/tests/${test.id}`}
                              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs tracking-wide shadow-sm transition text-center flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Resume Test</span>
                            </Link>
                          ) : isAttempted ? (
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

            {/* ── SUB-TAB 3: PYST SECTIONAL TESTS (TIER 1 & TIER 2) ── */}
            {(activeCategoryTab === 'pyst_tier1' || activeCategoryTab === 'pyst_tier2') && (
              <div className="space-y-4">
                {/* Tier 1 / Tier 2 Switcher for exams with Tier 2 support */}
                {selectedSeries.tierSupport.includes('tier2') && (
                  <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryTab('pyst_tier1')}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                        activeCategoryTab === 'pyst_tier1'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isRailway ? 'CBT 1 Sectionals (+1, -0.33)' : 'Tier 1 Sectionals (+2, -0.5)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategoryTab('pyst_tier2')}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                        activeCategoryTab === 'pyst_tier2'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isRailway ? 'CBT 2 Sectionals (+1, -0.33)' : 'Tier 2 Sectionals (+3, -1)'}
                    </button>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                  ⚡ <strong>{activeCategoryTab === 'pyst_tier2' ? (isRailway ? 'CBT 2 Sectional Speed Mocks (+1, -0.33):' : 'Tier 2 Mains Sectional Speed Mocks (+3, -1 Marking):') : (isRailway ? 'Official Railway Sectional Practice (+1, -0.33):' : 'Eduquity Sectional Speed Mocks (+2, -0.5):')}</strong> Organized shift-wise. Select any shift to drill individual sections!
                </div>

                {currentSeriesTests.map((shiftTest) => {
                  const isTier2Test = (shiftTest.examCode || '').includes('tier2') || shiftTest.title.toLowerCase().includes('tier 2') || shiftTest.title.toLowerCase().includes('tier-2') || activeCategoryTab === 'pyst_tier2';
                  const sectionsList = (shiftTest.sections && shiftTest.sections.length > 0)
                    ? shiftTest.sections
                    : getStandardSections(shiftTest.examCode, shiftTest.title);
                  return (
                    <div
                      key={shiftTest.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {isTier2Test ? 'Tier 2 Authentic Shift Paper' : 'Authentic Shift Paper'}
                          </span>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">
                            {shiftTest.title}
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {sectionsList.length || (isTier2Test ? 5 : (isRailway ? 3 : 4))} Sections
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {sectionsList.map((sec, secIdx) => {
                          const secTestId = `sec-${shiftTest.id}-sec-${secIdx}`;
                          const isSecAttempted = !!attemptedMap[secTestId];
                          const qCount = sec.questions?.length || (sec as any).questionCount || (isTier2Test ? (sec.name.includes('Math') || sec.name.includes('Reasoning') ? 30 : (sec.name.includes('English') ? 45 : (sec.name.includes('Awareness') ? 25 : 20))) : 25);
                          const marksPerQ = isTier2Test ? 3 : (isRailway ? 1 : 2);
                          const negMarks = isTier2Test ? 1 : (isRailway ? 0.33 : 0.5);

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
                                  {qCount} Qs &bull; {qCount * marksPerQ} Marks &bull; <span className="text-emerald-600 font-bold">+{marksPerQ}, -{negMarks}</span>
                                </div>
                              </div>

                              {isSecAttempted ? (
                                <Link
                                  href={`/tests/${secTestId}?mode=solution`}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] shrink-0 hover:bg-emerald-700 transition"
                                >
                                  Solutions
                                </Link>
                              ) : pausedMap[secTestId] ? (
                                <Link
                                  href={`/tests/${secTestId}`}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] shrink-0 transition flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Resume</span>
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
                  );
                })}
              </div>
            )}

            {/* ── SUB-TAB 4: DEDICATED TOPIC-WISE DRILLS ── */}
            {activeCategoryTab === 'topic_practice' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200">
                  🎯 <strong>Adaptive Chapter Drills ({selectedSeries.name.split('Mock')[0].trim()}):</strong> Anti-repetition active learning. Questions you previously solved correctly are automatically excluded so you always practice new or weak questions!
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredTopics.map((topic) => {
                    const countInSeries = getSeriesTopicCount(topic.id, topic.subject, selectedSeries.examCode);
                    return (
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
                              {countInSeries} Qs in this Series
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {topic.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {topic.highlight || 'Official shift questions with step-by-step KaTeX solutions.'}
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: OFFICIAL SCHEME & BLUEPRINT ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Available Languages Card */}
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

            {/* Official Exam Pattern & Blueprint Card */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Official Exam Blueprint
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black tracking-tight leading-snug">
                  {selectedSeries.name.split('Mock')[0].trim()} Examination Pattern
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verified against official commission notices and authentic 2025 examination shifts.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Correct Mark</span>
                  <span className="font-black text-emerald-400">+{selectedSeries.markingScheme.correct}.00</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Negative Mark</span>
                  <span className="font-black text-rose-400">-{selectedSeries.markingScheme.negative}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Duration</span>
                  <span className="font-black text-white">{selectedSeries.markingScheme.duration} Mins</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Questions</span>
                  <span className="font-black text-white">{selectedSeries.markingScheme.questions} Qs</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-semibold">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isRailway ? 'Free section switching (No sectional lock)' : '15-min strict sectional timer'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eduquity right-palette CBT controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Candidate watermark identity authentication</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Select Number of Questions */}
            {(() => {
              const maxInSeries = getSeriesTopicCount(activeTopicModal.id, activeTopicModal.subject, selectedSeries.examCode);
              const maxAllowed = Math.min(30, maxInSeries);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Number of Questions:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                      {customQuestionCount} Qs (Available: {maxInSeries} Qs)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max={maxAllowed}
                    step="5"
                    value={Math.min(customQuestionCount, maxAllowed)}
                    onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>5 Qs</span>
                    <span>10 Qs</span>
                    <span>15 Qs</span>
                    <span>20 Qs</span>
                    <span>{maxAllowed} Qs</span>
                  </div>
                </div>
              );
            })()}

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
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
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

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              📌 Every question includes its official 2025 examination shift stamp and KaTeX step-by-step mathematical proofs.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTopicModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchCustomTopicTest}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
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
