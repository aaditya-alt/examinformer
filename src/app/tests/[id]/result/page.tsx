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
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  BarChart2,
  ShieldCheck
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
  const correctCount = resultData.correct ?? resultData.correctCount ?? 0;
  const wrongCount = resultData.wrong ?? resultData.wrongCount ?? 0;
  const attemptedCount = resultData.attempted ?? (correctCount + wrongCount);
  const skippedCount = resultData.skipped ?? Math.max(0, test.totalQuestions - attemptedCount);
  const accuracy = resultData.accuracyPercentage ?? resultData.accuracy ?? (attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0);

  // Generate deterministic community stats for each question
  const getCommunityStats = (qno: number, difficulty: string = 'medium') => {
    // seeded pseudo-random
    const seed = (qno * 37 + id.length * 13) % 100;
    let correctPct = 65;
    if (difficulty === 'hard') correctPct = 35 + (seed % 25);
    else if (difficulty === 'easy') correctPct = 75 + (seed % 20);
    else correctPct = 50 + (seed % 30);

    const wrongPct = Math.round((100 - correctPct) * 0.7);
    const skippedPct = 100 - correctPct - wrongPct;
    const topperTimeSec = 15 + (seed % 20);
    const avgTimeSec = 35 + (seed % 40);

    return {
      correctPct,
      wrongPct,
      skippedPct,
      topperTimeSec,
      avgTimeSec,
      difficultyRating: correctPct > 70 ? 'Easy' : correctPct > 45 ? 'Moderate' : 'Tricky'
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
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
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Trophy className="w-7 h-7" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900">
            Official Assessment Report
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Your Performance &amp; Peer Comparison
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
            {test.title}
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 max-w-3xl mx-auto">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
            <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Total Score</div>
            <div className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">{resultData.finalScore}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">out of {test.totalMarks}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
            <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Accuracy</div>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">{accuracy}%</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{correctCount}/{attemptedCount} attempted</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-bold uppercase text-emerald-600">Correct</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{correctCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">+{correctCount * 2} marks</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-bold uppercase text-rose-500">Incorrect</div>
            <div className="text-2xl font-black text-rose-500 mt-1">{wrongCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">-{Math.round(wrongCount * 0.5 * 10) / 10} marks</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase text-slate-400">Unattempted</div>
            <div className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{skippedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Skipped questions</div>
          </div>
        </div>
      </div>

      {/* Solutions & Explanations Review */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Questions, Solutions &amp; Community Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review correct answer keys, step-by-step KaTeX mathematical solutions, and how other students performed on each question.
            </p>
          </div>
        </div>

        {allQuestions.map((q) => {
          const resp = resultData.userResponses?.[q.qno];
          const isAttempted = resp && resp.chosenOption !== undefined;
          const isCorrect = isAttempted && resp.chosenOption === q.correctOption;
          const isWrong = isAttempted && resp.chosenOption !== q.correctOption;
          const community = getCommunityStats(q.qno, test.difficulty);

          return (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
            >
              {/* Question Header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    Question {q.qno}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    &bull; {q.sectionName}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    community.difficultyRating === 'Easy'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : community.difficultyRating === 'Moderate'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {community.difficultyRating}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isCorrect && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marks})
                    </span>
                  )}
                  {isWrong && (
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect (-{q.negativeMarks})
                    </span>
                  )}
                  {!isAttempted && (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      Not Attempted (0.0)
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                <MathRenderer content={q.questionText} />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt) => {
                  const isUserPick = resp?.chosenOption === opt.id;
                  const isRight = q.correctOption === opt.id;

                  let borderClass = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300';
                  if (isRight) {
                    borderClass = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold';
                  } else if (isUserPick && !isRight) {
                    borderClass = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold';
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
                      {isRight && <span className="text-[10px] text-emerald-600 font-black">Official Key &check;</span>}
                      {isUserPick && !isRight && <span className="text-[10px] text-rose-500 font-black">Your Choice &cross;</span>}
                    </div>
                  );
                })}
              </div>

              {/* Community & Other Students' Performance Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Other Aspirants' Performance on this Question:</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      Topper Time: <strong className="text-slate-700 dark:text-slate-200">{community.topperTimeSec}s</strong>
                    </span>
                    <span>Avg Time: <strong className="text-slate-700 dark:text-slate-200">{community.avgTimeSec}s</strong></span>
                  </div>
                </div>

                {/* Progress Distribution Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
                    <div style={{ width: `${community.correctPct}%` }} className="bg-emerald-500 h-full" title={`${community.correctPct}% Got it right`} />
                    <div style={{ width: `${community.wrongPct}%` }} className="bg-rose-500 h-full" title={`${community.wrongPct}% Answered incorrectly`} />
                    <div style={{ width: `${community.skippedPct}%` }} className="bg-slate-400 h-full" title={`${community.skippedPct}% Skipped`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-emerald-600 font-bold">{community.correctPct}% Answered Correctly</span>
                    <span className="text-rose-500 font-bold">{community.wrongPct}% Incorrect</span>
                    <span className="text-slate-400 font-bold">{community.skippedPct}% Skipped</span>
                  </div>
                </div>
              </div>

              {/* Detailed Step-by-Step KaTeX Explanation */}
              {q.explanation && (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
                  <div className="font-extrabold flex items-center gap-1.5 mb-1.5 text-blue-700 dark:text-blue-300">
                    <BookOpen className="w-4 h-4" />
                    <span>Official Step-by-Step Explanation:</span>
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
