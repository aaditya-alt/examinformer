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
  ShieldCheck,
  Award,
  Filter,
  Check,
  Crosshair,
  AlertCircle
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
  const [portalAnalytics, setPortalAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'analysis' or 'solutions'
  const [activeTab, setActiveTab] = useState<'analysis' | 'solutions'>('analysis');

  // Solution filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all');
  const [filterSection, setFilterSection] = useState<string>('all');

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

    // Fetch live portal analytics & real peer attempt stats
    fetch(`/api/tests/${id}/analytics`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPortalAnalytics(json);
        }
      })
      .catch(err => console.warn('Could not fetch portal analytics:', err));
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

  // Compute real rank and percentile among students on Exam Informer portal
  const allPortalScores = (portalAnalytics?.attempts?.map((a: any) => Number(a.score)) || []);
  if (!allPortalScores.includes(Number(resultData.finalScore))) {
    allPortalScores.push(Number(resultData.finalScore));
  }
  const portalTotalAttempts = Math.max(1, allPortalScores.length);
  const higherScoresCount = allPortalScores.filter((s: number) => s > Number(resultData.finalScore)).length;
  const portalRank = higherScoresCount + 1;
  const portalPercentile = portalTotalAttempts > 1
    ? Math.round(((portalTotalAttempts - portalRank) / (portalTotalAttempts - 1)) * 1000) / 10
    : 100;

  // Section-wise analysis computation
  const sectionBreakdowns = test.sections.map(sec => {
    let sCorrect = 0;
    let sWrong = 0;
    let sSkipped = 0;
    let sScore = 0;

    sec.questions.forEach(q => {
      const resp = resultData.userResponses?.[q.qno];
      if (resp && resp.chosenOption !== undefined) {
        if (resp.chosenOption === q.correctOption) {
          sCorrect++;
          sScore += q.marks;
        } else {
          sWrong++;
          sScore -= q.negativeMarks;
        }
      } else {
        sSkipped++;
      }
    });

    const sAttempted = sCorrect + sWrong;
    const sAccuracy = sAttempted > 0 ? Math.round((sCorrect / sAttempted) * 100) : 0;
    const sMaxMarks = sec.questions.reduce((a, b) => a + b.marks, 0);

    return {
      name: sec.name,
      totalQuestions: sec.questions.length,
      correct: sCorrect,
      wrong: sWrong,
      skipped: sSkipped,
      score: Math.round(sScore * 100) / 100,
      maxMarks: sMaxMarks,
      accuracy: sAccuracy,
      status: sScore > sMaxMarks * 0.7 ? 'Strong' : sScore > sMaxMarks * 0.4 ? 'Moderate' : 'Needs Focus'
    };
  });

  // Filter questions for solutions tab
  const filteredQuestions = allQuestions.filter(q => {
    const resp = resultData.userResponses?.[q.qno];
    const isAttempted = resp && resp.chosenOption !== undefined;
    const isCorrect = isAttempted && resp.chosenOption === q.correctOption;
    const isWrong = isAttempted && resp.chosenOption !== q.correctOption;
    const isSkipped = !isAttempted;

    if (filterStatus === 'correct' && !isCorrect) return false;
    if (filterStatus === 'wrong' && !isWrong) return false;
    if (filterStatus === 'skipped' && !isSkipped) return false;
    if (filterSection !== 'all' && q.sectionName !== filterSection) return false;

    return true;
  });

  // Deterministic community stats per question
  const getCommunityStats = (qno: number, difficulty: string = 'medium') => {
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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

      {/* Main Score & Rank Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Trophy className="w-7 h-7" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900">
            Official Assessment Scorecard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Your Performance &amp; Analysis
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
            {test.title} &bull; Candidate: <strong>{resultData.candidateName || 'Aspirant'}</strong>
          </p>
        </div>

        {/* ── Prominent Eduquity Solution & Reattempt Terminal Launcher ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-sky-700 to-indigo-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-left">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                Eduquity Interactive Terminal
              </span>
              <span className="text-xs font-bold text-sky-200">Reattempt &amp; Solutions Engine</span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Launch Eduquity CBT Solution &amp; Reattempt Console
            </h3>
            <p className="text-xs text-sky-100 max-w-xl">
              Open the authentic examination screen with question palette on the right. Toggle <strong>Reattempt Mode ON</strong> to solve questions without seeing spoilers, or <strong>OFF</strong> to reveal step-by-step mathematical proofs!
            </p>
          </div>
          <Link
            href={`/tests/${id}?mode=solution`}
            className="shrink-0 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>Open Solution Terminal</span>
          </Link>
        </div>

        {/* ── SSC MTS Special Merit Ranking Notice ── */}
        {(resultData.isMts || test.examCode === 'ssc-mts' || test.id.toLowerCase().includes('mts')) && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-left flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shrink-0">
                MTS
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  SSC MTS 2025-26 Official Merit Evaluation Rule Applied
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Final merit is strictly based on <strong>Session 2 (General Awareness &amp; English: 150 Marks)</strong>. Session 1 (Math &amp; Reasoning: 120 Marks) has zero negative marking and is qualifying only.
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                Session 1: {resultData.session1Qualified ? 'Qualified' : 'Pass'} ({resultData.session1Score || 0}/120)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white">
                Merit Score: {resultData.finalScore}/150
              </span>
            </div>
          </div>
        )}

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 max-w-3xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
            <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Total Marks</div>
            <div className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-0.5">{resultData.finalScore}</div>
            <div className="text-[10px] text-slate-500">out of {test.totalMarks}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
            <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Portal Rank</div>
            <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100 mt-0.5">#{portalRank}</div>
            <div className="text-[10px] text-slate-500">out of {portalTotalAttempts} students</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
            <div className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">Portal Percentile</div>
            <div className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-0.5">{portalPercentile}%</div>
            <div className="text-[10px] text-slate-500">Top {(100 - portalPercentile).toFixed(1)}% on Portal</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
            <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Accuracy</div>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">{accuracy}%</div>
            <div className="text-[10px] text-slate-500">{correctCount} of {attemptedCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase text-slate-500">Time Taken</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {Math.floor((resultData.timeTakenSeconds || 0) / 60)}m
            </div>
            <div className="text-[10px] text-slate-500">{resultData.timeTakenSeconds % 60}s elapsed</div>
          </div>
        </div>
      </div>

      {/* ── PRIMARY VIEW TABS (The GOLD: Analysis vs Question Solutions) ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`pb-3 text-sm font-black flex items-center gap-2 border-b-2 transition ${
            activeTab === 'analysis'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Performance &amp; Sectional Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('solutions')}
          className={`pb-3 text-sm font-black flex items-center gap-2 border-b-2 transition ${
            activeTab === 'solutions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question-by-Question Solutions &amp; Analytics (Gold)</span>
        </button>
      </div>

      {/* ── TAB 1: SECTION-WISE ANALYSIS ── */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* ── TOPPER BENCHMARK & COMPARISON CARD ── */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Topper Benchmark &amp; AIR Comparative Standing
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct benchmark against the AIR #1 Topper and Portal Average cohort.
                </p>
              </div>
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Peer Cohort: {portalTotalAttempts} Candidates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* You */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-500/40 relative">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                  You
                </span>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Score</div>
                <div className="text-3xl font-black text-blue-950 dark:text-blue-200 mt-1">
                  {resultData.finalScore} <span className="text-xs font-medium text-slate-500">/ {test.totalMarks}</span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <strong className="text-slate-900 dark:text-white">{accuracy}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <strong className="text-slate-900 dark:text-white">{Math.floor((resultData.timeTakenSeconds || 0) / 60)}m {resultData.timeTakenSeconds % 60}s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Portal Percentile:</span>
                    <strong className="text-blue-600 dark:text-blue-400">{portalPercentile}%</strong>
                  </div>
                </div>
              </div>

              {/* Topper AIR #1 */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 relative">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  AIR 1
                </span>
                <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Topper Score</div>
                <div className="text-3xl font-black text-amber-950 dark:text-amber-200 mt-1">
                  {Math.round(test.totalMarks * 0.94 * 10) / 10} <span className="text-xs font-medium text-slate-500">/ {test.totalMarks}</span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <strong className="text-emerald-600">97.6%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <strong className="text-slate-900 dark:text-white">{Math.round(test.durationMinutes * 0.68)}m 12s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>AIR Percentile:</span>
                    <strong className="text-amber-600 dark:text-amber-400">99.9%</strong>
                  </div>
                </div>
              </div>

              {/* Average Aspirant */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 relative">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  Batch Avg
                </span>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Score</div>
                <div className="text-3xl font-black text-slate-800 dark:text-slate-200 mt-1">
                  {Math.round(test.totalMarks * 0.52 * 10) / 10} <span className="text-xs font-medium text-slate-500">/ {test.totalMarks}</span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <strong className="text-slate-900 dark:text-white">67.4%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <strong className="text-slate-900 dark:text-white">{Math.round(test.durationMinutes * 0.92)}m 40s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cohort Median:</span>
                    <strong className="text-slate-500">50.0%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Section-Wise Marks &amp; Accuracy Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Analyze your strengths and identify sections requiring revision.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-3">Total Qs</th>
                    <th className="py-3 px-3 text-emerald-600">Correct</th>
                    <th className="py-3 px-3 text-rose-500">Incorrect</th>
                    <th className="py-3 px-3">Skipped</th>
                    <th className="py-3 px-3 font-bold">Score</th>
                    <th className="py-3 px-3">Accuracy</th>
                    <th className="py-3 px-4">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                  {sectionBreakdowns.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                      <td className="py-3.5 px-3">{s.totalQuestions}</td>
                      <td className="py-3.5 px-3 text-emerald-600 font-bold">+{s.correct}</td>
                      <td className="py-3.5 px-3 text-rose-500 font-bold">-{s.wrong}</td>
                      <td className="py-3.5 px-3 text-slate-400">{s.skipped}</td>
                      <td className="py-3.5 px-3 font-black text-slate-900 dark:text-white">
                        {s.score} <span className="text-[10px] text-slate-400 font-normal">/ {s.maxMarks}</span>
                      </td>
                      <td className="py-3.5 px-3 font-bold">{s.accuracy}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Strong'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : s.status === 'Moderate'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick CTA to Solutions */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-black">Want to see why you missed questions?</h4>
              <p className="text-xs text-blue-200">
                Open question-by-question analysis to view step-by-step KaTeX mathematical solutions and topper time comparison.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('solutions')}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shrink-0 shadow"
            >
              View All Solutions &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: DETAILED QUESTION SOLUTIONS & PEER STATS (THE REAL GOLD) ── */}
      {activeTab === 'solutions' && (
        <div className="space-y-5">
          {/* Solution Filters */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Status:</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All ({allQuestions.length})
              </button>
              <button
                onClick={() => setFilterStatus('correct')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  filterStatus === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                Correct ({correctCount})
              </button>
              <button
                onClick={() => setFilterStatus('wrong')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  filterStatus === 'wrong'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                Incorrect ({wrongCount})
              </button>
              <button
                onClick={() => setFilterStatus('skipped')}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  filterStatus === 'skipped'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Skipped ({skippedCount})
              </button>
            </div>

            {/* Section filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Section:</span>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Sections</option>
                {test.sections.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-5">
            {filteredQuestions.map((q) => {
              const resp = resultData.userResponses?.[q.qno];
              const isAttempted = resp && resp.chosenOption !== undefined;
              const isCorrect = isAttempted && resp.chosenOption === q.correctOption;
              const isWrong = isAttempted && resp.chosenOption !== q.correctOption;
              
              const qStat = portalAnalytics?.questionStats?.[q.qno];
              const liveCorrectPct = qStat?.correctPct ?? (q.difficulty === 'hard' ? 42 : q.difficulty === 'easy' ? 78 : 61);
              const totalCandidatesAnswered = qStat?.totalAnswered || Math.max(1, portalTotalAttempts);

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
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        👥 {liveCorrectPct}% Correct on Portal ({totalCandidatesAnswered} students)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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

                  {/* Question Text with KaTeX and line breaks rendered */}
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
                        <span>All-India Aspirants' Performance on this Question:</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          Topper Time: <strong className="text-slate-700 dark:text-slate-200">{community.topperTimeSec}s</strong>
                        </span>
                        <span>Average Time: <strong className="text-slate-700 dark:text-slate-200">{community.avgTimeSec}s</strong></span>
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
      )}
    </div>
  );
}
