'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CBTTest } from '@/lib/testService';
import { ExamLogo } from '@/components/ExamLogo';
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
  Sparkles
} from 'lucide-react';

const EXAM_FILTERS = [
  { id: 'all', label: 'All Exams' },
  { id: 'ssc-cgl', label: 'SSC CGL' },
  { id: 'ssc-chsl', label: 'SSC CHSL' },
  { id: 'ssc-gd', label: 'SSC GD' },
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
      {/* Hero Header with 3D Tag */}
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900 shadow-xs">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Real Eduquity Examination Simulation</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          CBT Mock Tests &amp; Official Question Papers
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Practice official SSC and Railway papers in authentic Eduquity examination hall format. Includes right question palette, sectional timers, KaTeX mathematical formulas, and instant peer performance analytics.
        </p>
      </div>

      {/* 3D Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d">
        {/* Exam Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {EXAM_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedExam(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedExam === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto card-3d">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Tests Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No papers match the selected exam filter. Switch filter to view available tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const isPyq = test.type === 'pyq';

            return (
              <div
                key={test.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Badges & Official Round Emblem */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ExamLogo type={test.family} size="xs" />
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {test.examCode.toUpperCase()}
                      </span>
                    </div>

                    {isPyq && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                        Official PYQ Shift
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {test.title}
                  </h3>

                  {/* Metrics */}
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

                  {/* Sections list */}
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
