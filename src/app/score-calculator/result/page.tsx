'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EvaluationResult } from '@/lib/scoreService';
import { MathRenderer } from '@/components/MathRenderer';
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Printer,
  Share2,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

function ScorecardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [data, setData] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped' | 'bonus'>('all');
  const [pushingToTest, setPushingToTest] = useState(false);
  const [pushedTestInfo, setPushedTestInfo] = useState<{ testId: string; message: string } | null>(null);

  useEffect(() => {
    // 1. Try to load from session storage first (instant)
    const cached = sessionStorage.getItem('current_evaluation');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!id || parsed.id === id) {
          setData(parsed);
          setLoading(false);
          // Trigger celebratory confetti for high scores!
          if (parsed.parsed.summary.finalScore > 50) {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          }
          return;
        }
      } catch (e) {
        console.error('Session cache parse error:', e);
      }
    }

    // 2. Fetch from backend if ID provided
    if (id) {
      fetch(`/api/score-calculator/submissions?id=${id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setData(json.data);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const handlePushToTest = async () => {
    if (!data?.id) return;
    try {
      setPushingToTest(true);
      const res = await fetch('/api/admin/push-to-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: data.id })
      });
      const json = await res.json();
      if (json.success) {
        setPushedTestInfo({ testId: json.testId, message: json.message });
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } else {
        alert(json.error || 'Failed to push to test series.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while pushing to mock tests.');
    } finally {
      setPushingToTest(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Generating verified scorecard &amp; rankings...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scorecard Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          We could not locate this evaluation. Please submit your answer key again.
        </p>
        <Link
          href="/score-calculator"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Calculator</span>
        </Link>
      </div>
    );
  }

  const { meta, summary, sections } = data.parsed;
  const { analytics } = data;

  // Flatten all questions for review tab
  const allQuestions = sections.flatMap(sec => sec.questions);
  const filteredQuestions = allQuestions.filter(q => {
    if (activeFilter === 'all') return true;
    return q.status === activeFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Print Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href="/score-calculator"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Evaluate Another Response Sheet</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Admin Push to Mock Test Button */}
          <button
            onClick={handlePushToTest}
            disabled={pushingToTest || !!pushedTestInfo}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              pushedTestInfo
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {pushedTestInfo ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pushed to Mocks!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{pushingToTest ? 'Publishing...' : '⚡ Push to Mock Test Series'}</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Scorecard</span>
          </button>
        </div>
      </div>

      {/* Push Notification Banner if pushed */}
      {pushedTestInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Official Paper Added to CBT Test Series!
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                {pushedTestInfo.message}
              </div>
            </div>
          </div>
          <Link
            href={`/tests/${pushedTestInfo.testId}`}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
          >
            Attempt Test Now &rarr;
          </Link>
        </div>
      )}

      {/* Candidate Profile Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {meta.candidateName || 'Candidate Response Sheet'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 uppercase">
                {meta.category || 'UR'}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              {meta.examTitle || 'Official Government Examination'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Roll No: </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{meta.rollNo || 'N/A'}</span>
            </div>
            {meta.stateZone && (
              <div className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {meta.stateZone}
              </div>
            )}
          </div>
        </div>

        {/* Exam Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400">Exam Date</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{meta.examDate || 'Verified Date'}</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Exam Shift / Time</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{meta.shiftTime || 'Standard Shift'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-slate-500 dark:text-slate-400">Test Centre Venue</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{meta.venueName || 'Official Digital Zone Centre'}</div>
          </div>
        </div>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Net Final Marks */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-blue-100 text-xs font-bold uppercase tracking-wider">
            <span>Final Score</span>
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight mt-3">
            {summary.finalScore}
          </div>
          <div className="text-xs text-blue-100/90 mt-2 font-medium">
            +{summary.rawScore} Raw &bull; -{summary.negativeMarks} Penalty
          </div>
        </div>

        {/* All India Rank */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>All India Rank</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            #{analytics.allIndiaRank}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {analytics.totalSubmissions}</span>
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top {(100 - analytics.percentile).toFixed(1)}% Aspirants</span>
          </div>
        </div>

        {/* Shift Rank */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Shift Rank</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            #{analytics.shiftRank}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {analytics.shiftTotal}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Shift Avg: <span className="font-bold text-slate-700 dark:text-slate-300">{analytics.shiftAverageScore}</span> &bull; High: <span className="font-bold text-slate-700 dark:text-slate-300">{analytics.shiftTopperScore}</span>
          </div>
        </div>

        {/* Category Percentile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Accuracy &amp; Percentile</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            {summary.accuracy}%
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
            {summary.correct} Right &bull; {summary.wrong} Wrong &bull; {summary.skipped} Skipped
          </div>
        </div>
      </div>

      {/* Section-wise Detailed Breakdown Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
          Sectional Performance Analysis
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Subject / Section</th>
                <th className="py-3 px-3 text-center">Total Q</th>
                <th className="py-3 px-3 text-center">Attempted</th>
                <th className="py-3 px-3 text-center text-emerald-600">Correct</th>
                <th className="py-3 px-3 text-center text-rose-600">Wrong</th>
                <th className="py-3 px-3 text-center">Skipped</th>
                <th className="py-3 px-3 text-center">Penalty</th>
                <th className="py-3 px-4 text-right rounded-r-xl font-black">Net Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {sections.map((sec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{sec.name}</td>
                  <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-400">{sec.totalQuestions}</td>
                  <td className="py-3.5 px-3 text-center">{sec.attempted}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-emerald-600">{sec.correct}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-rose-600">{sec.wrong}</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">{sec.skipped}</td>
                  <td className="py-3.5 px-3 text-center text-rose-500">-{sec.negativeMarks}</td>
                  <td className="py-3.5 px-4 text-right font-black text-blue-600 dark:text-blue-400">{sec.finalScore}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/80 dark:bg-slate-800/40 text-slate-900 dark:text-white">
                <td className="py-3 px-4 rounded-l-xl">Total Aggregate</td>
                <td className="py-3 px-3 text-center">{summary.totalQuestions}</td>
                <td className="py-3 px-3 text-center">{summary.attempted}</td>
                <td className="py-3 px-3 text-center text-emerald-600">{summary.correct}</td>
                <td className="py-3 px-3 text-center text-rose-600">{summary.wrong}</td>
                <td className="py-3 px-3 text-center">{summary.skipped}</td>
                <td className="py-3 px-3 text-center text-rose-600">-{summary.negativeMarks}</td>
                <td className="py-3 px-4 text-right rounded-r-xl font-black text-base text-blue-600 dark:text-blue-400">{summary.finalScore}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Full Question Paper Review Module */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Detailed Question Paper Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review every question with your recorded response vs the official commission answer key.
            </p>
          </div>

          {/* Question Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold no-print">
            {[
              { key: 'all', label: `All (${allQuestions.length})` },
              { key: 'correct', label: `Correct (${summary.correct})` },
              { key: 'wrong', label: `Wrong (${summary.wrong})` },
              { key: 'skipped', label: `Skipped (${summary.skipped})` },
              { key: 'bonus', label: `Bonus (${summary.bonus})` }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeFilter === f.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isCorrect = q.status === 'correct';
            const isWrong = q.status === 'wrong';
            const isSkipped = q.status === 'skipped';
            const isBonus = q.status === 'bonus';

            return (
              <div
                key={q.qno}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
              >
                {/* Header status bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
                      {q.qno}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {q.sectionName} &bull; ID: {q.questionId}
                    </span>
                  </div>

                  <div>
                    {isCorrect && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </span>
                    )}
                    {isWrong && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Wrong (-Penalty)</span>
                      </span>
                    )}
                    {isSkipped && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Not Answered</span>
                      </span>
                    )}
                    {isBonus && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 text-xs font-bold">
                        <span>Bonus / Dropped</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  <MathRenderer content={q.questionText} />
                </div>

                {/* Question Images */}
                {q.questionImages && q.questionImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 my-2">
                    {q.questionImages.map((src, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={src}
                        alt={`Question ${q.qno} diagram`}
                        className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-800"
                      />
                    ))}
                  </div>
                )}

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt) => {
                    const isCandidateChoice = q.chosenOption === opt.num;
                    const isOfficialCorrect = opt.isCorrect;

                    let optionBorder = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300';

                    if (isOfficialCorrect) {
                      optionBorder = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold';
                    } else if (isCandidateChoice && !isOfficialCorrect) {
                      optionBorder = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold';
                    }

                    return (
                      <div
                        key={opt.num}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition ${optionBorder}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {opt.num}
                          </span>
                          <span><MathRenderer content={opt.text} /></span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isCandidateChoice && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              Your Choice
                            </span>
                          )}
                          {isOfficialCorrect && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                              Official Key &check;
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ScorecardResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading scorecard...</p>
      </div>
    }>
      <ScorecardContent />
    </Suspense>
  );
}
