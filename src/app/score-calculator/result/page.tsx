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
  Sparkles,
  ArrowLeft,
  Clock,
  Layers,
  Check,
  TrendingUp,
  Percent,
  Share2,
  RotateCcw,
  Flag,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReportQuestionModal } from '@/components/ReportQuestionModal';

function ScorecardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [data, setData] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped' | 'bonus'>('all');
  const [reattemptMode, setReattemptMode] = useState(false);
  const [reattemptAnswers, setReattemptAnswers] = useState<Record<number, number>>({});
  const [paletteExpanded, setPaletteExpanded] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ qno: number; text: string } | null>(null);
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
          if (parsed.parsed.summary.finalScore > 50) {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
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
          We could not locate this evaluation. Please submit your answer key link again.
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
  const isSSC = meta.examFamily === 'ssc';

  // Flatten all questions for review tab
  const allQuestions = sections.flatMap(sec => sec.questions);
  const filteredQuestions = allQuestions.filter(q => {
    if (activeFilter === 'all') return true;
    return q.status === activeFilter;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Print Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href="/score-calculator"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Evaluate Another Response Sheet</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePushToTest}
            disabled={pushingToTest || !!pushedTestInfo}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              pushedTestInfo
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {pushedTestInfo ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Pushed to Mocks!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pushingToTest ? 'Publishing...' : '⚡ Push to Mock Tests'}</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Scorecard</span>
          </button>
        </div>
      </div>

      {/* Push Notification Banner */}
      {pushedTestInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Official Paper Added to CBT Test Series!
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                {pushedTestInfo.message}
              </div>
            </div>
          </div>
          <Link
            href={`/tests/${pushedTestInfo.testId}`}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shrink-0"
          >
            Attempt Test Now &rarr;
          </Link>
        </div>
      )}

      {/* Official Scorecard Container - Matching Official Format */}
      <div className="space-y-3">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white text-center tracking-tight">
          {meta.examTitle || (isSSC ? 'Graduate Level' : 'RRB NTPC')}: Answer Key and Analysis by MockYoddha
        </h1>

        {/* Card with Red Border */}
        <div className="max-w-2xl mx-auto border-[2.5px] border-red-700 bg-white dark:bg-slate-900 rounded-sm overflow-hidden shadow-lg">
          {/* Header Banner */}
          <div className="py-2.5 px-4 text-center font-bold text-slate-900 dark:text-white border-b-[2px] border-red-700 text-sm sm:text-base tracking-wide bg-slate-50 dark:bg-slate-800/80">
            {isSSC ? 'SSC Exam Response Sheet' : 'Railway Exam Response Sheet'}
          </div>

          {/* Candidate Particulars Table */}
          <table className="w-full text-xs sm:text-sm border-collapse border-b-[2px] border-red-700">
            <tbody>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white w-1/3 border-r border-slate-300 dark:border-slate-700">
                  Roll Number
                </td>
                <td className="py-2 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                  {meta.rollNo || 'N/A'}
                </td>
              </tr>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                  Candidate Name
                </td>
                <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white uppercase">
                  {meta.candidateName || 'N/A'}
                </td>
              </tr>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                  Subject
                </td>
                <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200">
                  {meta.examTitle || 'Graduate Level'}
                </td>
              </tr>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                  Exam Date
                </td>
                <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200">
                  {meta.examDate || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                  Exam Time
                </td>
                <td className="py-2 px-3.5 text-slate-800 dark:text-slate-200">
                  {meta.shiftTime || 'Shift-1'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section Score Breakdown Table */}
          <table className="w-full text-xs sm:text-sm border-collapse text-slate-900 dark:text-slate-100">
            <thead>
              <tr className="bg-[#b91c1c] text-white font-bold text-center">
                <th className="py-2.5 px-3 text-left border-r border-red-800">Section</th>
                <th className="py-2.5 px-2 w-14 border-r border-red-800">Total</th>
                <th className="py-2.5 px-2 w-12 border-r border-red-800">NA</th>
                <th className="py-2.5 px-2 w-14 border-r border-red-800">Right</th>
                <th className="py-2.5 px-2 w-14 border-r border-red-800">Wrong</th>
                <th className="py-2.5 px-2 w-16">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-slate-900">
              {sections.map((sec, idx) => (
                <tr key={idx} className="border-b border-slate-300 dark:border-slate-700">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700">
                    {sec.name}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                    {sec.totalQuestions}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                    {sec.skipped}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-semibold">
                    {sec.correct}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-semibold text-rose-600 dark:text-rose-400">
                    {sec.wrong}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-white">
                    {sec.finalScore}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Highlighted Yellow Total Row */}
              <tr className="bg-[#ffff00] text-black font-black text-xs sm:text-sm border-t-[2px] border-slate-900">
                <td className="py-3 px-3 text-center border-r border-slate-900 uppercase">
                  Total
                </td>
                <td className="py-3 px-2 text-center border-r border-slate-900">
                  {summary.totalQuestions}
                </td>
                <td className="py-3 px-2 text-center border-r border-slate-900">
                  {summary.skipped}
                </td>
                <td className="py-3 px-2 text-center border-r border-slate-900">
                  {summary.correct}
                </td>
                <td className="py-3 px-2 text-center border-r border-slate-900">
                  {summary.wrong}
                </td>
                <td className="py-3 px-2 text-center text-sm sm:text-base font-black">
                  {summary.finalScore.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footnote */}
        <div className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
          ⓘ Marking Scheme: +{data.ruleUsed.marksPerCorrect} for Correct, -{Number(data.ruleUsed.negativePerWrong.toFixed(2))} for Incorrect.
        </div>
      </div>

      {/* Portal Rankings & Candidate Analytics Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Portal Rank &amp; Shift Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live ranking based on all candidates who have evaluated on MockYoddha by ExamInformerNitesh.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 self-start sm:self-auto">
            {meta.category || 'UR'} &bull; {meta.stateZone || 'All India'}
          </span>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Portal Rank */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Portal Rank</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              #{analytics.allIndiaRank}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {analytics.totalSubmissions}</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Top {(100 - analytics.percentile).toFixed(1)}%</span>
            </div>
          </div>

          {/* Shift Rank */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Shift Rank</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              #{analytics.shiftRank}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {analytics.shiftTotal}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Shift Avg: <strong className="text-slate-700 dark:text-slate-300">{analytics.shiftAverageScore}</strong>
            </div>
          </div>

          {/* Category Rank */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Category Rank</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              #{analytics.categoryRank}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              In Category: <strong className="text-slate-700 dark:text-slate-300">{meta.category || 'UR'}</strong>
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Accuracy</span>
              <Percent className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              {summary.accuracy}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {summary.correct} Right &bull; {summary.wrong} Wrong
            </div>
          </div>
        </div>
      </div>

      {/* Full Question Paper Review Module */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Detailed Question-by-Question Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review every response with chosen option vs official commission answer key, or test yourself with reattempt mode.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Reattempt Mode Toggle */}
            <button
              type="button"
              onClick={() => setReattemptMode(!reattemptMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                reattemptMode
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
              title="Practice this paper without seeing answers beforehand"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reattempt Mode: {reattemptMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Question Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold">
              {[
                { key: 'all', label: `All (${allQuestions.length})` },
                { key: 'correct', label: `Right (${summary.correct})` },
                { key: 'wrong', label: `Wrong (${summary.wrong})` },
                { key: 'skipped', label: `Blank (${summary.skipped})` }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as any)}
                  className={`px-2.5 py-1 rounded-xl transition ${
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
        </div>

        {/* Question Palette Quick Navigator */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Question Palette Navigator
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({allQuestions.length} Questions)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPaletteExpanded(!paletteExpanded)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{paletteExpanded ? 'Hide Palette' : 'Show Palette'}</span>
              {paletteExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {paletteExpanded && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {allQuestions.map(q => {
                  let btnColor = 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300';
                  if (reattemptMode) {
                    if (reattemptAnswers[q.qno] !== undefined) {
                      const userPick = reattemptAnswers[q.qno];
                      const isCorrectPick = q.options.find(o => o.num === userPick)?.isCorrect;
                      btnColor = isCorrectPick ? 'bg-emerald-600 text-white font-bold' : 'bg-rose-600 text-white font-bold';
                    }
                  } else {
                    if (q.status === 'correct') btnColor = 'bg-emerald-600 text-white font-bold';
                    else if (q.status === 'wrong') btnColor = 'bg-rose-600 text-white font-bold';
                    else if (q.status === 'skipped') btnColor = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                  }

                  return (
                    <button
                      key={q.qno}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`qcard-${q.qno}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition cursor-pointer ${btnColor}`}
                    >
                      {q.qno}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                  <span>Correct</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
                  <span>Incorrect</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block" />
                  <span>Not Answered</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isCorrect = q.status === 'correct';
            const isWrong = q.status === 'wrong';
            const isSkipped = q.status === 'skipped';
            const isBonus = q.status === 'bonus';

            const userReattemptPick = reattemptAnswers[q.qno];
            const hasReattempted = userReattemptPick !== undefined;

            return (
              <div
                key={q.qno}
                id={`qcard-${q.qno}`}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition scroll-mt-24"
              >
                {/* Header status bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
                      {q.qno}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {q.sectionName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Pill */}
                    {reattemptMode ? (
                      hasReattempted ? (
                        q.options.find(o => o.num === userReattemptPick)?.isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct Choice!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect Choice</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 text-xs font-bold">
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          <span>Click an option to practice</span>
                        </span>
                      )
                    ) : (
                      <>
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct (+{data.ruleUsed.marksPerCorrect})</span>
                          </span>
                        )}
                        {isWrong && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Wrong (-{Number(data.ruleUsed.negativePerWrong.toFixed(2))})</span>
                          </span>
                        )}
                        {isSkipped && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Not Answered (0)</span>
                          </span>
                        )}
                        {isBonus && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 text-xs font-bold">
                            <span>Bonus / Dropped</span>
                          </span>
                        )}
                      </>
                    )}

                    {/* Report Button */}
                    <button
                      type="button"
                      onClick={() => setReportTarget({ qno: q.qno, text: q.questionText })}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      title="Report an error in this question or options"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Report</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
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
                    let isReattemptPickedThis = hasReattempted && userReattemptPick === opt.num;

                    if (reattemptMode) {
                      if (hasReattempted) {
                        if (opt.isCorrect) {
                          optionBorder = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold';
                        } else if (isReattemptPickedThis) {
                          optionBorder = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold';
                        }
                      } else {
                        optionBorder = 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-blue-50/30';
                      }
                    } else {
                      if (isOfficialCorrect) {
                        optionBorder = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold';
                      } else if (isCandidateChoice && !isOfficialCorrect) {
                        optionBorder = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold';
                      }
                    }

                    return (
                      <div
                        key={opt.num}
                        onClick={() => {
                          if (reattemptMode && !hasReattempted) {
                            setReattemptAnswers(prev => ({ ...prev, [q.qno]: opt.num }));
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${optionBorder}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {opt.num}
                          </span>
                          <span><MathRenderer content={opt.text} /></span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {reattemptMode ? (
                            hasReattempted && (
                              <>
                                {isReattemptPickedThis && (
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                  }`}>
                                    {opt.isCorrect ? 'Your Pick &check;' : 'Your Pick ✕'}
                                  </span>
                                )}
                                {opt.isCorrect && !isReattemptPickedThis && (
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                    Correct Key &check;
                                  </span>
                                )}
                              </>
                            )
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {(!reattemptMode || hasReattempted) && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Official Commission Key &amp; Step-by-Step Explanation</span>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <MathRenderer
                        content={
                          (q as any).explanation ||
                          `The official correct option designated by the examination board is Option (${q.correctOption}). Candidates are evaluated strictly based on this key.`
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Question Modal */}
      {reportTarget && (
        <ReportQuestionModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          testId={data.parsed.meta.examTitle || 'answer-key-evaluation'}
          testTitle={data.parsed.meta.examTitle}
          qno={reportTarget.qno}
          questionText={reportTarget.text}
        />
      )}
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
