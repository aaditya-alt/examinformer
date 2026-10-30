'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CBTTest } from '@/lib/testService';
import { MathRenderer } from '@/components/MathRenderer';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CBTResultPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [test, setTest] = useState<CBTTest | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(`cbt_result_${id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setResultData(parsed);
        if (parsed.finalScore > 0) {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        }
      } catch (e) {
        console.error('Failed to parse result cache:', e);
      }
    }

    fetch(`/api/tests/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setTest(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading test performance report...</p>
      </div>
    );
  }

  if (!resultData || !test) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <h2 className="text-xl font-bold">No test session found</h2>
        <p className="text-xs text-slate-500 mt-2">Please attempt the test first.</p>
        <Link
          href={`/tests/${id}`}
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Start Test
        </Link>
      </div>
    );
  }

  const allQuestions = test.sections.flatMap(s => s.questions);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Mock Tests</span>
        </Link>
        <Link
          href={`/tests/${id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retake Mock Test</span>
        </Link>
      </div>

      {/* Hero Scorecard */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Trophy className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Performance Summary
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {test.title}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
            <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Total Score</div>
            <div className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">{resultData.finalScore}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
            <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Accuracy</div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{resultData.accuracy}%</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-bold uppercase text-slate-500">Correct</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{resultData.correctCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-bold uppercase text-slate-500">Incorrect</div>
            <div className="text-2xl font-black text-rose-500 mt-1">{resultData.wrongCount}</div>
          </div>
        </div>
      </div>

      {/* Solutions & Explanations Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Solutions &amp; Step-by-Step Explanations
        </h2>

        {allQuestions.map((q) => {
          const resp = resultData.userResponses[q.qno];
          const isAttempted = resp && resp.chosenOption !== undefined;
          const isCorrect = isAttempted && resp.chosenOption === q.correctOption;
          const isWrong = isAttempted && resp.chosenOption !== q.correctOption;

          return (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                  Question {q.qno} &bull; {q.sectionName}
                </span>

                {isCorrect && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marks})
                  </span>
                )}
                {isWrong && (
                  <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Incorrect (-{q.negativeMarks})
                  </span>
                )}
                {!isAttempted && (
                  <span className="text-xs font-bold text-slate-400">
                    Not Attempted (0.0)
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                <MathRenderer content={q.questionText} />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt) => {
                  const isUserPick = resp?.chosenOption === opt.id;
                  const isRight = q.correctOption === opt.id;

                  let borderClass = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300';
                  if (isRight) {
                    borderClass = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold';
                  } else if (isUserPick && !isRight) {
                    borderClass = 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${borderClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {opt.id}
                        </span>
                        <span><MathRenderer content={opt.text} /></span>
                      </div>
                      {isRight && <span className="text-[10px] text-emerald-600 font-bold">Correct Key &check;</span>}
                      {isUserPick && !isRight && <span className="text-[10px] text-rose-500 font-bold">Your Choice</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Official Solution &amp; Explanation:</span>
                  </div>
                  <MathRenderer content={q.explanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
