'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CBTTest } from '@/lib/testService';
import {
  BookOpen,
  Clock,
  Award,
  Sparkles,
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
  const [selectedType, setSelectedType] = useState<'all' | 'pyq' | 'full_mock' | 'live'>('all');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200 dark:border-blue-800">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Real Examination Simulation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          CBT Mock Tests &amp; Official PYQs
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
          Experience the authentic TCS iON Computer Based Test (CBT) environment. Practice official shift papers ingested from live answer keys with bilingual support, section countdowns, and instant solution analytics.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Exam Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {EXAM_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedExam(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
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
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'pyq', label: 'Official PYQs' },
            { id: 'live', label: 'Live Mocks' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedType === t.id
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
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
            Try switching exam categories or evaluate an answer key to automatically push new papers here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const isPyq = test.type === 'pyq';
            const isLive = test.type === 'live';

            return (
              <div
                key={test.id}
                className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                      {test.examCode.toUpperCase()}
                    </span>

                    {isPyq && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                        Official PYQ Shift
                      </span>
                    )}
                    {isLive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Test</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                    {test.title}
                  </h3>

                  {/* Test Details Metrics */}
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

                  {/* Section Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {test.sections.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[140px]"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <div className="pt-6">
                  <Link
                    href={`/tests/${test.id}`}
                    className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 group-hover:shadow-blue-500/40 transition active:scale-[0.98]"
                  >
                    <span>Start Computer Based Test (CBT)</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
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
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Loading available tests...</p>
      </div>
    }>
      <TestsExplorerContent />
    </Suspense>
  );
}
