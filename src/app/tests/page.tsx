'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CBTTest } from '@/lib/testService';
import {
  BookOpen,
  Clock,
  Award,
  Filter,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  FileText
} from 'lucide-react';

const EXAM_FILTERS = [
  { id: 'all', label: 'All Exams' },
  { id: 'ssc-cgl', label: 'SSC CGL' },
  { id: 'ssc-chsl', label: 'SSC CHSL' },
  { id: 'ssc-mts', label: 'SSC MTS' },
  { id: 'rrb-ntpc', label: 'RRB NTPC' },
  { id: 'rrb-group-d', label: 'RRB Group D' },
  { id: 'rrb-alp', label: 'RRB ALP' }
];

function TestsExplorerContent() {
  const searchParams = useSearchParams();
  const initialExam = searchParams.get('exam') || 'all';

  const [tests, setTests] = useState<CBTTest[]>([]);
  const [selectedExam, setSelectedExam] = useState(initialExam);
  const [selectedType, setSelectedType] = useState<'all' | 'pyq' | 'full_mock' | 'sectional'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tests?exam=${selectedExam}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setTests(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const filteredTests = tests.filter(t => {
    if (selectedType === 'all') return true;
    return t.type === selectedType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Real Examination Simulation</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          CBT Mock Tests &amp; Official Question Papers
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Practice official SSC and Railway papers in an authentic TCS iON examination hall interface. Includes SSC sectional timers, KaTeX mathematical formulas, bilingual question view, and instant peer performance analytics.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Exam Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {EXAM_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedExam(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedExam === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Test Type Select */}
        <div className="flex items-center gap-1.5 self-start md:self-auto shrink-0">
          {[
            { id: 'all', label: 'All Papers' },
            { id: 'pyq', label: 'Official PYQs' },
            { id: 'full_mock', label: 'Full Mocks' },
            { id: 'sectional', label: 'Sectional' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedType === t.id
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Loading available tests...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Tests Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No papers match the selected exam filter. Switch filter to view available tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const isPyq = test.type === 'pyq';

            return (
              <div
                key={test.id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {test.examCode.toUpperCase()}
                    </span>

                    {isPyq && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                        Official PYQ Shift
                      </span>
                    )}

                    {test.hasSectionalTiming && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>15m Sectional Timer</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {test.title}
                  </h3>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs">
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

                  {/* Sections list */}
                  <div className="flex flex-wrap gap-1">
                    {test.sections.map((s, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/tests/${test.id}`}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Start Test</span>
                  </Link>

                  <Link
                    href={`/tests/${test.id}?mode=solution`}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-95"
                  >
                    <span>Solutions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
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
