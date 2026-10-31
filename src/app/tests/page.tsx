'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CBTTest } from '@/lib/types/cbt';
import { ExamLogo } from '@/components/ExamLogo';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  TOPIC_PRACTICE_LIST,
  TopicItem,
  ExamDefinition
} from '@/lib/types/taxonomy';
import {
  Layers,
  BrainCircuit,
  Timer,
  Sparkles,
  Play,
  Zap,
  Search,
  CheckCircle2,
  FileText,
  Target,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Filter,
  Check
} from 'lucide-react';

function TestsExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHub = searchParams.get('hub') || 'ssc';

  // Primary Hub Tab: 'ssc' | 'rrb' | 'topic-wise' | 'generator'
  const [hubTab, setHubTab] = useState<'ssc' | 'rrb' | 'topic-wise' | 'generator'>(initialHub as any);

  // SSC / RRB Hierarchical State
  const [selectedSscExam, setSelectedSscExam] = useState<'ssc-cgl' | 'ssc-chsl' | 'ssc-mts' | 'ssc-gd' | 'ssc-cpo'>('ssc-cgl');
  const [selectedRrbExam, setSelectedRrbExam] = useState<'rrb-ntpc' | 'rrb-alp' | 'rrb-group-d' | 'rrb-section-controller'>('rrb-ntpc');
  
  // Tier / Stage State
  const [sscTier, setSscTier] = useState<'tier1' | 'tier2'>('tier1');
  const [rrbStage, setRrbStage] = useState<'cbt1' | 'cbt2'>('cbt1');

  // Sub-Tab under selected Tier: 'pyq' (Previous Year Papers 2025) | 'sectional' | 'full_mock' | 'topic_practice'
  const [examSubTab, setExamSubTab] = useState<'pyq' | 'sectional' | 'full_mock' | 'topic_practice'>('pyq');

  // Dedicated Topic-Wise Module State
  const [topicScope, setTopicScope] = useState<'all' | 'ssc' | 'rrb'>('all');
  const [topicSubject, setTopicSubject] = useState<'math' | 'reasoning' | 'english' | 'ga'>('math');
  const [topicSearch, setTopicSearch] = useState('');

  // Shift search query
  const [shiftSearchQuery, setShiftSearchQuery] = useState('');

  // Generator State
  const [genExam, setGenExam] = useState('ssc-cgl-tier1');
  const [genYear, setGenYear] = useState('2025');
  const [isGenerating, setIsGenerating] = useState(false);

  // All Tests loaded from API
  const [allTests, setAllTests] = useState<CBTTest[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Compute current active examCode for SSC & RRB
  const currentExamCode = useMemo(() => {
    if (hubTab === 'ssc') {
      if (selectedSscExam === 'ssc-mts') return 'ssc-mts';
      if (selectedSscExam === 'ssc-gd') return 'ssc-gd';
      return `${selectedSscExam}-${sscTier}`;
    }
    if (hubTab === 'rrb') {
      if (selectedRrbExam === 'rrb-alp') return 'rrb-alp-cbt1';
      if (selectedRrbExam === 'rrb-group-d') return 'rrb-group-d';
      if (selectedRrbExam === 'rrb-section-controller') return 'rrb-section-controller';
      return `rrb-ntpc-${rrbStage}`;
    }
    return 'ssc-cgl-tier1';
  }, [hubTab, selectedSscExam, sscTier, selectedRrbExam, rrbStage]);

  // Exam Definition for Current Selection
  const currentExamDef = useMemo(() => {
    return EXAM_REGISTRY.find((e) => e.id === currentExamCode) || EXAM_REGISTRY[0];
  }, [currentExamCode]);

  // Filtered shifts for active exam & tier
  const activeShiftPapers = useMemo(() => {
    const q = shiftSearchQuery.toLowerCase().trim();
    return allTests.filter((t) => {
      const code = (t.examCode || '').toLowerCase();
      const isMatch = code.includes(currentExamCode) || (currentExamCode.startsWith('rrb-ntpc') && code.includes('rrb-ntpc'));
      if (!isMatch) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    });
  }, [allTests, currentExamCode, shiftSearchQuery]);

  // Topic practice list filtered
  const filteredTopics = useMemo(() => {
    return TOPIC_PRACTICE_LIST.filter((t) => {
      if (topicSubject && t.subject !== topicSubject) return false;
      if (topicScope !== 'all' && t.scope !== 'all' && t.scope !== topicScope) return false;
      if (topicSearch) {
        return t.name.toLowerCase().includes(topicSearch.toLowerCase()) || (t.highlight && t.highlight.toLowerCase().includes(topicSearch.toLowerCase()));
      }
      return true;
    });
  }, [topicSubject, topicScope, topicSearch]);

  const handleLaunchGenerated = () => {
    setIsGenerating(true);
    setTimeout(() => {
      router.push(`/tests/smart-mock-${genExam}`);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* ── Top Header Banner (ExamGoal / Eduquity Aesthetic) ── */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-900 shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Official 2025 PYQ CBT Hall &bull; Eduquity Interface</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          CBT Mock Hall &amp; Previous Year Papers
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Comprehensive test series mapped by <strong>Exam &bull; Tier &bull; Shift &bull; Section &bull; Topic</strong>. Every paper delivers authentic Eduquity right-palette CBT simulator, sectional timers, KaTeX mathematical proofs, and guaranteed shift authenticity.
        </p>
      </div>

      {/* ── 1. PRIMARY HUB NAVIGATION (SSC, RRB, TOPIC-WISE, GENERATOR) ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => {
            setHubTab('ssc');
            setExamSubTab('pyq');
          }}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            hubTab === 'ssc'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ExamLogo type="ssc" size="xs" />
          <span>SSC Examinations Hub</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            112 Official Shifts
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setHubTab('rrb');
            setExamSubTab('pyq');
          }}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            hubTab === 'rrb'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ExamLogo type="rrb" size="xs" />
          <span>Railway (RRB) Hub</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            67 Official Shifts
          </span>
        </button>

        <button
          type="button"
          onClick={() => setHubTab('topic-wise')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            hubTab === 'topic-wise'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-purple-500" />
          <span>Dedicated Topic-Wise Practice</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            35+ Topics
          </span>
        </button>

        <button
          type="button"
          onClick={() => setHubTab('generator')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            hubTab === 'generator'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Smart CBT Mock Generator</span>
        </button>
      </div>

      {/* ── 2. SSC EXAMINATIONS HUB ── */}
      {hubTab === 'ssc' && (
        <div className="space-y-6">
          {/* Exam Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'ssc-cgl', label: 'SSC CGL', desc: 'Combined Graduate Level' },
              { id: 'ssc-chsl', label: 'SSC CHSL', desc: '10+2 Higher Secondary' },
              { id: 'ssc-mts', label: 'SSC MTS & Havaldar', desc: 'Non-Technical Staff' },
              { id: 'ssc-gd', label: 'SSC GD Constable', desc: 'CAPFs & Assam Rifles' },
              { id: 'ssc-cpo', label: 'SSC CPO SI', desc: 'Delhi Police & CAPF SI' },
            ].map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedSscExam(ex.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer card-3d flex items-center gap-2 ${
                  selectedSscExam === ex.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                }`}
              >
                <span>{ex.label}</span>
                <span className={`text-[10px] opacity-75 font-normal hidden sm:inline`}>({ex.desc})</span>
              </button>
            ))}
          </div>

          {/* Tier / Stage Selection (For exams that have Tier 1 & Tier 2) */}
          {selectedSscExam !== 'ssc-mts' && selectedSscExam !== 'ssc-gd' && (
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setSscTier('tier1')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  sscTier === 'tier1'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tier-1 (Preliminary CBT &bull; 100 Qs &bull; 200 Marks)
              </button>
              <button
                type="button"
                onClick={() => setSscTier('tier2')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  sscTier === 'tier2'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tier-2 (Main Examination &bull; Merit Deciding)
              </button>
            </div>
          )}

          {/* Sub-Tabs: 1. Previous Year Papers (Shift-Wise) | 2. Sectional Speed Mocks | 3. Full Mock Tests | 4. Topic-Wise Practice */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 text-xs font-bold">
            <button
              onClick={() => setExamSubTab('pyq')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'pyq'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Official 2025 Shift-Wise Papers ({activeShiftPapers.length})</span>
            </button>

            <button
              onClick={() => setExamSubTab('sectional')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'sectional'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>2. Sectional Speed Mocks ({currentExamDef.sections.length} Sections)</span>
            </button>

            <button
              onClick={() => setExamSubTab('full_mock')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'full_mock'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>3. Full Mock Simulation</span>
            </button>

            <button
              onClick={() => setExamSubTab('topic_practice')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'topic_practice'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>4. Topic-Wise Practice for this Exam</span>
            </button>
          </div>

          {/* SUB-TAB CONTENT */}
          {examSubTab === 'pyq' && (
            <div className="space-y-4">
              {/* Search input for shifts */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter shift papers (e.g. 12 Sept, Shift 2)..."
                  value={shiftSearchQuery}
                  onChange={(e) => setShiftSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">Loading shift papers from database...</p>
                </div>
              ) : activeShiftPapers.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 card-3d">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No shift tests found</h4>
                  <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switch tiers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeShiftPapers.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {test.examCode.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                            Official 2025 Paper
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {test.title}
                        </h3>

                        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 dark:border-slate-800 text-[11px]">
                          <div>
                            <div className="text-slate-400 text-[9px] uppercase font-semibold">Questions</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{test.totalQuestions} Qs</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[9px] uppercase font-semibold">Duration</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{test.durationMinutes} Mins</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[9px] uppercase font-semibold">Max Marks</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{test.totalMarks} M</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {test.sections.map((s, idx) => (
                            <span key={idx} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/tests/${test.id}`}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 btn-3d-primary cursor-pointer text-center"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Attempt Official CBT Exam</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {examSubTab === 'sectional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentExamDef.sections.map((sec, idx) => {
                const secSlug = sec.name.replace(/\s+/g, '-').toLowerCase();
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>Section #{idx + 1}</span>
                        <span className="text-emerald-600">Eduquity Speed Mode</span>
                      </div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{sec.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {sec.questionCount} Questions &bull; {sec.marks} Marks &bull; Sectional Timer Enabled
                      </p>
                    </div>

                    <Link
                      href={`/tests/sec-${currentExamDef.id}-${secSlug}`}
                      className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 btn-3d-primary cursor-pointer text-center"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start {sec.name.split(' ')[0]} Section</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {examSubTab === 'full_mock' && (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d max-w-xl mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">
                {currentExamDef.name} — Full Simulation Mock
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                100% authentic CBT simulation with {currentExamDef.totalQuestions} questions, {currentExamDef.durationMinutes} minutes timer, official +{currentExamDef.marksPerCorrect} / -{currentExamDef.negativePerWrong} marking scheme, and Eduquity right-palette controls.
              </p>
              <Link
                href={`/tests/smart-mock-${currentExamDef.id}`}
                className="inline-flex py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs items-center gap-2 btn-3d-primary cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Full CBT Mock Test</span>
              </Link>
            </div>
          )}

          {examSubTab === 'topic_practice' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300">
                📌 <strong>Authenticity Guarantee:</strong> Every question in these topic drills originates from official 2025 papers and includes the authentic shift badge.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOPIC_PRACTICE_LIST.filter(t => t.scope === 'ssc' || t.scope === 'all').map((topic) => (
                  <div
                    key={topic.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                        {topic.subject.toUpperCase()}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">
                        {topic.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{topic.questionCountEstimate}+ Official Questions</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/tests/topic-${topic.subject}-${topic.id}-10`}
                        className="py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] text-center btn-3d-primary"
                      >
                        Practice 10 Qs
                      </Link>
                      <Link
                        href={`/tests/topic-${topic.subject}-${topic.id}-20`}
                        className="py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] text-center border border-slate-200 dark:border-slate-700"
                      >
                        Full 20 Qs
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. RAILWAY (RRB) EXAMINATIONS HUB ── */}
      {hubTab === 'rrb' && (
        <div className="space-y-6">
          {/* Exam Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'rrb-ntpc', label: 'RRB NTPC', desc: 'Graduate & Under-Graduate' },
              { id: 'rrb-alp', label: 'RRB ALP & Tech', desc: 'Assistant Loco Pilot' },
              { id: 'rrb-group-d', label: 'RRB Group D', desc: 'CEN RRC Level-1' },
              { id: 'rrb-section-controller', label: 'Section Controller', desc: 'Operating & Station Master' },
            ].map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedRrbExam(ex.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer card-3d flex items-center gap-2 ${
                  selectedRrbExam === ex.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                }`}
              >
                <span>{ex.label}</span>
                <span className={`text-[10px] opacity-75 font-normal hidden sm:inline`}>({ex.desc})</span>
              </button>
            ))}
          </div>

          {/* Stage Selector for RRB NTPC */}
          {selectedRrbExam === 'rrb-ntpc' && (
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setRrbStage('cbt1')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  rrbStage === 'cbt1'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                CBT-1 (Common Screening &bull; 100 Qs &bull; 90 Mins &bull; 100 Marks)
              </button>
              <button
                type="button"
                onClick={() => setRrbStage('cbt2')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  rrbStage === 'cbt2'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                CBT-2 (Main Examination &bull; 120 Qs &bull; Merit Ranking)
              </button>
            </div>
          )}

          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 text-xs font-bold">
            <button
              onClick={() => setExamSubTab('pyq')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'pyq'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Official 2025 Shift-Wise Papers ({activeShiftPapers.length})</span>
            </button>

            <button
              onClick={() => setExamSubTab('sectional')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'sectional'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>2. Sectional Speed Mocks ({currentExamDef.sections.length} Sections)</span>
            </button>

            <button
              onClick={() => setExamSubTab('full_mock')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                examSubTab === 'full_mock'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>3. Full Mock Simulation</span>
            </button>
          </div>

          {/* Sub-Tab Content */}
          {examSubTab === 'pyq' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter railway shifts (e.g. Shift 1, Shift 2)..."
                  value={shiftSearchQuery}
                  onChange={(e) => setShiftSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {activeShiftPapers.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 card-3d">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No railway shift tests found</h4>
                  <p className="text-xs text-slate-500 mt-1">Try switching to RRB NTPC or clearing search filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeShiftPapers.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                            {test.examCode.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                            Official Shift
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {test.title}
                        </h3>

                        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 dark:border-slate-800 text-[11px]">
                          <div>
                            <div className="text-slate-400 text-[9px] uppercase font-semibold">Questions</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{test.totalQuestions} Qs</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[9px] uppercase font-semibold">Duration</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{test.durationMinutes} Mins</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[9px] uppercase font-semibold">Max Marks</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{test.totalMarks} M</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {test.sections.map((s, idx) => (
                            <span key={idx} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/tests/${test.id}`}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 btn-3d-primary cursor-pointer text-center"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Attempt Railway CBT Exam</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {examSubTab === 'sectional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentExamDef.sections.map((sec, idx) => {
                const secSlug = sec.name.replace(/\s+/g, '-').toLowerCase();
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>Section #{idx + 1}</span>
                        <span className="text-emerald-600">Eduquity Speed Mode</span>
                      </div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{sec.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {sec.questionCount} Questions &bull; {sec.marks} Marks &bull; Negative: 0.33
                      </p>
                    </div>

                    <Link
                      href={`/tests/sec-${currentExamDef.id}-${secSlug}`}
                      className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 btn-3d-primary cursor-pointer text-center"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start {sec.name.split(' ')[0]} Section</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {examSubTab === 'full_mock' && (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d max-w-xl mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">
                {currentExamDef.name} — Full Mock
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                100% authentic CBT simulation with {currentExamDef.totalQuestions} questions, 90 minutes timer, official +1.00 / -0.33 negative marking, and Eduquity right-palette controls.
              </p>
              <Link
                href={`/tests/smart-mock-${currentExamDef.id}`}
                className="inline-flex py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs items-center gap-2 btn-3d-primary cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Full CBT Mock Test</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── 4. DEDICATED TOPIC-WISE TESTS MODULE ── */}
      {hubTab === 'topic-wise' && (
        <div className="space-y-6">
          {/* Header Callout with Authenticity Guarantee */}
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                Authentic Exam Origin Display Guaranteed
              </h4>
              <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                Every practice test in this module pulls real questions from official 2025 examination shifts (SSC CGL, CHSL, MTS, and RRB NTPC). The exact exam shift and date is displayed below each question inside the Eduquity test hall.
              </p>
            </div>
          </div>

          {/* Scope Filters: All/Mixed | SSC Only | Railway Only */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Exam Scope:</span>
              {[
                { id: 'all', label: 'Mixed (SSC + Railway)' },
                { id: 'ssc', label: 'SSC Topics' },
                { id: 'rrb', label: 'Railway (RRB) Topics' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setTopicScope(sc.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    topicScope === sc.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Search topic */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search topics (e.g. Trigonometry)..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subject Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'math', name: 'Quantitative Aptitude', color: 'text-emerald-600 dark:text-emerald-400', count: '12 Core Topics' },
              { id: 'reasoning', name: 'General Intelligence', color: 'text-indigo-600 dark:text-indigo-400', count: '10 Core Topics' },
              { id: 'english', name: 'English Language', color: 'text-amber-600 dark:text-amber-400', count: '9 Core Topics (SSC)' },
              { id: 'ga', name: 'General Awareness / Science', color: 'text-blue-600 dark:text-blue-400', count: '8 Core Topics' },
            ].map((sub) => {
              const isSelected = topicSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setTopicSubject(sub.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition card-3d cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className={`font-black text-xs sm:text-sm ${sub.color}`}>{sub.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub.count}</div>
                </button>
              );
            })}
          </div>

          {/* Topic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {topic.scope === 'ssc' ? 'SSC Pattern' : topic.scope === 'rrb' ? 'Railway Pattern' : 'SSC & Railway'}
                    </span>
                    {topic.highlight && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {topic.highlight}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                    {topic.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {topic.questionCountEstimate}+ real 2025 PYQ questions with full step-by-step KaTeX solutions.
                  </p>
                </div>

                {/* Practice Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/tests/topic-${topic.subject}-${topic.id}-10`}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 btn-3d-primary cursor-pointer text-center"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Practice 10 Qs</span>
                  </Link>
                  <Link
                    href={`/tests/topic-${topic.subject}-${topic.id}-20`}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer text-center"
                  >
                    <Zap className="w-3 h-3 text-amber-500 fill-current" />
                    <span>Speed 20 Qs</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. AI SMART FULL MOCK GENERATOR ── */}
      {hubTab === 'generator' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              AI Smart Mock Test Generator
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Select your targeted exam and past year range. Our engine synthesizes a full CBT paper matching official blueprints and weightages with zero spoiler bias.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Targeted Examination
              </label>
              <select
                value={genExam}
                onChange={(e) => setGenExam(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXAM_REGISTRY.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Source Pool
                </label>
                <select
                  value={genYear}
                  onChange={(e) => setGenYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2025">2025 Official Shifts (Pure)</option>
                  <option value="2024">2024 Official Shifts</option>
                  <option value="all">Past 5 Years High Yield</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Exam Interface
                </label>
                <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Eduquity Right Palette</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchGenerated}
            disabled={isGenerating}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 btn-3d-primary cursor-pointer transition"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Assembling Full Mock Paper...</span>
              </div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Generate &amp; Launch Full CBT Mock</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
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
