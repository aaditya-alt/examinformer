'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CBTTest } from '@/lib/testService';
import { ExamLogo } from '@/components/ExamLogo';
import { EXAM_REGISTRY, CHAPTER_TAXONOMY, ExamDefinition } from '@/lib/questionBank';
import {
  BookOpen,
  Clock,
  Award,
  Filter,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Play,
  Sparkles,
  Zap,
  Flame,
  BrainCircuit,
  Target,
  ChevronRight,
  GraduationCap,
  Timer,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

function TestsExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialExam = searchParams.get('exam') || 'all';

  const [activeTab, setActiveTab] = useState<'shifts' | 'chapters' | 'sectional' | 'generator'>('shifts');
  const [tests, setTests] = useState<CBTTest[]>([]);
  const [selectedExam, setSelectedExam] = useState(initialExam);
  const [loading, setLoading] = useState(true);

  // Chapter-wise state
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'reasoning' | 'english' | 'ga'>('math');

  // Generator state
  const [genExam, setGenExam] = useState('ssc-cgl-tier1');
  const [genYear, setGenYear] = useState('2024');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tests?exam=${selectedExam}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setTests(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const examCategories = [
    { id: 'all', label: 'All Exams', family: 'all' },
    // SSC
    { id: 'ssc-cgl', label: 'SSC CGL Tier 1 & 2', family: 'ssc' },
    { id: 'ssc-chsl', label: 'SSC CHSL 10+2', family: 'ssc' },
    { id: 'ssc-cpo', label: 'SSC CPO SI', family: 'ssc' },
    { id: 'ssc-mts', label: 'SSC MTS & Havaldar', family: 'ssc' },
    { id: 'ssc-gd', label: 'SSC GD Constable', family: 'ssc' },
    { id: 'delhi-police', label: 'Delhi Police', family: 'ssc' },
    // RRB
    { id: 'rrb-ntpc', label: 'RRB NTPC (Grad & UG)', family: 'rrb' },
    { id: 'rrb-section-controller', label: 'Section Controller', family: 'rrb' },
    { id: 'rrb-group-d', label: 'RRB Group D', family: 'rrb' },
    { id: 'rrb-alp', label: 'RRB ALP & Tech', family: 'rrb' },
  ];

  const filteredTests = tests.filter((t) => {
    if (selectedExam === 'all') return true;
    return t.examCode.toLowerCase().includes(selectedExam.toLowerCase()) || t.examFamily === selectedExam;
  });

  const shiftPapers = filteredTests.filter((t) => t.type === 'pyq');
  const sectionalPapers = filteredTests.filter((t) => t.type === 'sectional' || t.sections.length === 1);
  const fullMocks = filteredTests.filter((t) => t.type === 'full_mock' || t.type === 'live');

  const handleLaunchGenerated = () => {
    setIsGenerating(true);
    setTimeout(() => {
      router.push(`/tests/smart-mock-${genExam}`);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* ── Top Header Banner (ExamGoal / TestRanking Aesthetic) ── */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-900 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>National CBT Question Bank &bull; 2026–2027 Session</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          CBT Mock Hall &amp; Previous Year Papers
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Comprehensive test series mapped by <strong>Exam, Tier, Shift, Section, and Chapter</strong>. Practice with authentic Eduquity right-palette CBT simulator, sectional timers, KaTeX mathematical proofs, and zero spoilers.
        </p>
      </div>

      {/* ── Mode Switcher Tabs (Shift-wise, Chapters, Sectional, Generator) ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'shifts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Shift-Wise Official PYQs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {shiftPapers.length || 6}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chapters')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'chapters'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          <span>Chapter-Wise Practice Rooms</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            44 Chapters
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sectional')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'sectional'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Timer className="w-4 h-4 text-purple-500" />
          <span>Sectional Speed Mocks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'generator'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Smart Full Mock Generator</span>
        </button>
      </div>

      {/* ── TAB 1: SHIFT-WISE OFFICIAL PYQ PAPERS ── */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          {/* Exam Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {examCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedExam(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedExam === c.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-bold">Loading shift papers from database...</p>
            </div>
          ) : shiftPapers.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto card-3d">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No Shift Papers Found</h3>
              <p className="text-xs text-slate-500 mt-1">Select &ldquo;All Exams&rdquo; to browse available shift papers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shiftPapers.map((test) => (
                <div
                  key={test.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ExamLogo type={test.examFamily as any} size="xs" />
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {test.examCode.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                        {test.difficulty || 'Official Shift Paper'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {test.title}
                    </h3>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase font-semibold">Questions</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{test.totalQuestions} Qs</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase font-semibold">Duration</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{test.durationMinutes} Mins</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase font-semibold">Max Marks</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{test.totalMarks} M</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {test.sections.map((s, idx) => (
                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/tests/${test.id}`}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 btn-3d-primary cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Practice Examination</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CHAPTER-WISE PRACTICE ROOMS ── */}
      {activeTab === 'chapters' && (
        <div className="space-y-6">
          {/* Subject Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'math', name: 'Quantitative Aptitude', chapters: 13, color: 'text-emerald-600 dark:text-emerald-400', count: '2,450+ PYQs' },
              { id: 'reasoning', name: 'General Intelligence', chapters: 11, color: 'text-indigo-600 dark:text-indigo-400', count: '1,980+ PYQs' },
              { id: 'english', name: 'English Language', chapters: 11, color: 'text-amber-600 dark:text-amber-400', count: '2,120+ PYQs' },
              { id: 'ga', name: 'General Awareness', chapters: 9, color: 'text-blue-600 dark:text-blue-400', count: '3,100+ PYQs' }
            ].map((sub) => {
              const isSelected = selectedSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubject(sub.id as any)}
                  className={`p-4 rounded-2xl border text-left transition card-3d cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className={`font-black text-sm ${sub.color}`}>{sub.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub.chapters} Chapters &bull; {sub.count}</div>
                </button>
              );
            })}
          </div>

          {/* Chapters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CHAPTER_TAXONOMY[selectedSubject].map((chapter, idx) => {
              const slug = encodeURIComponent(chapter).replace(/%20/g, '-').toLowerCase();
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Chapter #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Past 7-Year Solved
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {chapter}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Step-by-step KaTeX solutions, smart short-tricks, and concept derivations.
                    </p>
                  </div>

                  {/* Practice 15Q and 25Q Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/tests/ch-${selectedSubject}-${slug}-15`}
                      className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 btn-3d-primary cursor-pointer text-center"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Practice 15 Qs</span>
                    </Link>
                    <Link
                      href={`/tests/ch-${selectedSubject}-${slug}-25`}
                      className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer text-center"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-current" />
                      <span>Speed 25 Qs</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: SECTIONAL SPEED MOCKS ── */}
      {activeTab === 'sectional' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EXAM_REGISTRY.slice(0, 8).map((exam) => (
              <div
                key={exam.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-4"
              >
                <div className="flex items-center gap-3">
                  <ExamLogo type={exam.family} size="sm" />
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{exam.name}</h3>
                    <div className="text-xs text-slate-500">{exam.sections.length} Official Sections &bull; Sectional Countdown Timer</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {exam.sections.map((sec, sIdx) => {
                    const secSlug = sec.name.replace(/\s+/g, '-').toLowerCase();
                    return (
                      <div
                        key={sIdx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{sec.name}</div>
                          <div className="text-[11px] text-slate-500">{sec.questionCount} Questions &bull; {sec.marks} Marks</div>
                        </div>

                        <Link
                          href={`/tests/sec-${exam.id}-${secSlug}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 btn-3d-primary cursor-pointer shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start Section</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: SMART FULL MOCK GENERATOR ── */}
      {activeTab === 'generator' && (
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
                  <option value="2024">2024 Official Shifts</option>
                  <option value="2023">2023–2024 Blended</option>
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
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading tests explorer...</div>}>
      <TestsExplorerContent />
    </Suspense>
  );
}
