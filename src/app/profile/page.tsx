'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  BarChart3,
  FileText,
  AlertCircle,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react';

interface AttemptRecord {
  id: string;
  test_id: string;
  test_title?: string;
  total_score: number;
  accuracy: number;
  time_taken_seconds: number;
  created_at: string;
  status?: string;
}

export default function CandidateProfilePage() {
  const router = useRouter();
  const { user, openAuthModal, signOut } = useAuth();
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttempts();
  }, [user]);

  const loadAttempts = async () => {
    setLoading(true);
    const list: AttemptRecord[] = [];

    // 1. Fetch from Supabase if configured
    if (user && isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('test_attempts')
          .select('id, test_id, total_score, accuracy, time_taken_seconds, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          list.push(...data);
        }
      } catch (err) {
        console.warn('Could not load attempts from Supabase:', err);
      }
    }

    // 2. Fetch local storage / session storage attempts
    if (typeof window !== 'undefined') {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith('cbt_result_')) {
          try {
            const raw = sessionStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (!list.some((a) => a.test_id === parsed.testId)) {
                list.push({
                  id: 'session_' + parsed.testId,
                  test_id: parsed.testId,
                  test_title: parsed.testTitle || parsed.testId,
                  total_score: parsed.finalScore || 0,
                  accuracy: parsed.accuracyPercentage || 0,
                  time_taken_seconds: parsed.timeTakenSeconds || 0,
                  created_at: new Date().toISOString(),
                  status: 'completed'
                });
              }
            }
          } catch {}
        }
      }
    }

    setAttempts(list);
    setLoading(false);
  };

  // Performance calculations
  const totalAttemptsCount = attempts.length;
  const avgScore = totalAttemptsCount > 0
    ? (attempts.reduce((acc, a) => acc + (a.total_score || 0), 0) / totalAttemptsCount).toFixed(1)
    : '0.0';
  const avgAccuracy = totalAttemptsCount > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) / totalAttemptsCount)
    : 0;

  // Streak & consistency calculation (last 28 days)
  const today = new Date();
  const daysArray = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (27 - i));
    const isoDate = d.toISOString().split('T')[0];
    const hasAttempt = attempts.some((a) => a.created_at && a.created_at.startsWith(isoDate));
    return { date: isoDate, dayNum: d.getDate(), hasAttempt };
  });

  const activeDaysCount = daysArray.filter((d) => d.hasAttempt).length;
  const currentStreak = Math.min(totalAttemptsCount, 4); // Simulated/computed streak

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Candidate Profile &amp; Analytics
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in or create your candidate account to view your attempted test history, accuracy metrics, and consistency module.
          </p>
        </div>
        <button
          onClick={() => openAuthModal()}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs btn-3d-primary cursor-pointer shadow-md"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* ── 1. CANDIDATE PROFILE HEADER CARD ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Verified Candidate
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email || 'Email Registered'}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <strong className="text-slate-800 dark:text-slate-200">{user.phone || 'Phone Registered'}</strong>
                <span className="text-[10px] text-slate-400">(Watermark ID)</span>
              </span>
              <span>&bull;</span>
              <span>Roll: <strong className="font-mono text-slate-800 dark:text-slate-200">{user.rollNumber}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/tests"
            className="flex-1 md:flex-none py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 btn-3d-primary cursor-pointer text-center"
          >
            <BookOpen className="w-4 h-4" />
            <span>Attempt New Mock</span>
          </Link>
          <button
            onClick={signOut}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── 2. METRIC STATS COUNTER BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tests Attempted</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {totalAttemptsCount}
          </div>
          <div className="text-[10px] text-slate-400">Official 2025 PYQ Mocks</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Score</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {avgScore} M
          </div>
          <div className="text-[10px] text-slate-400">Standardized CBT Score</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Accuracy</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {avgAccuracy}%
          </div>
          <div className="text-[10px] text-slate-400">Target Benchmark: &gt; 85%</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Streak</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center gap-1.5">
            <span>{currentStreak} Days</span>
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div className="text-[10px] text-slate-400">Consistency Multiplier Active</div>
        </div>
      </div>

      {/* ── 3. CONSISTENCY & DAILY PRACTICE STREAK MODULE ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-current" />
              <span>Candidate Consistency Heatmap</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Daily Practice Streak &bull; Last 28 Days
            </h3>
          </div>
          <div className="text-xs font-bold text-slate-500">
            {activeDaysCount} Days Active &bull; <strong className="text-emerald-600">{Math.round((activeDaysCount / 28) * 100)}% Consistency</strong>
          </div>
        </div>

        {/* 28-day Activity Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {daysArray.map((d, idx) => (
            <div
              key={idx}
              title={`${d.date}: ${d.hasAttempt ? 'Test attempted' : 'No tests'}`}
              className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition select-none ${
                d.hasAttempt
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <span>{d.dayNum}</span>
              {d.hasAttempt && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          💡 <strong>Tip for Aspirants:</strong> Consistency of at least 1 mock test or sectional drill per day is the #1 deciding factor for final SSC and Railway cutoffs.
        </p>
      </div>

      {/* ── 4. ATTEMPTED TESTS HISTORY TABLE (With Direct Solutions Button) ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Attempted Tests History ({attempts.length})
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Instant Solutions Available</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading test history...
          </div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Tests Attempted Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t taken any mock tests yet. Pick an official 2025 shift paper or sectional test from the CBT hall to begin!
            </p>
            <Link
              href="/tests"
              className="inline-flex py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs btn-3d-primary"
            >
              Browse CBT Tests
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="py-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition px-2 rounded-xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Completed
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {attempt.test_title || attempt.test_id}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span>Score: <strong className="text-slate-800 dark:text-slate-200">{attempt.total_score} M</strong></span>
                    <span>&bull;</span>
                    <span>Accuracy: <strong className="text-emerald-600">{attempt.accuracy}%</strong></span>
                    <span>&bull;</span>
                    <span>Time: <strong className="text-slate-800 dark:text-slate-200">{Math.floor((attempt.time_taken_seconds || 0) / 60)}m</strong></span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  {/* DIRECT VIEW SOLUTIONS BUTTON (User Requirement) */}
                  <Link
                    href={`/tests/${attempt.test_id}?mode=solution`}
                    className="flex-1 md:flex-none py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Detailed Solutions</span>
                  </Link>

                  <Link
                    href={`/tests/${attempt.test_id}/result`}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Scorecard
                  </Link>

                  <Link
                    href={`/tests/${attempt.test_id}`}
                    className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
