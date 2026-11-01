'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ArrowRight,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  User,
  LogIn,
  AlertCircle,
  Play,
  Pause
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

interface PausedTestRecord {
  testId: string;
  testTitle?: string;
  savedAt: number;
  overallSecondsRemaining: number;
  activeSectionIdx: number;
  activeQuestionIdx: number;
  answeredCount: number;
  storageKey: string;
}

export default function MyTestsDashboardPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [pausedTests, setPausedTests] = useState<PausedTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAttempts();
  }, [user]);

  const loadUserAttempts = async () => {
    setLoading(true);
    let list: AttemptRecord[] = [];
    const pausedList: PausedTestRecord[] = [];

    // 0. Check localStorage for paused sessions
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cbt_paused_session_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.testId) {
                pausedList.push({
                  testId: parsed.testId,
                  testTitle: parsed.testTitle || parsed.testId.toUpperCase().replace(/-/g, ' '),
                  savedAt: parsed.savedAt || Date.now(),
                  overallSecondsRemaining: parsed.overallSecondsRemaining || 0,
                  activeSectionIdx: parsed.activeSectionIdx || 0,
                  activeQuestionIdx: parsed.activeQuestionIdx || 0,
                  answeredCount: parsed.userResponses ? Object.keys(parsed.userResponses).length : 0,
                  storageKey: key
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error reading paused sessions:', err);
      }
    }
    setPausedTests(pausedList);

    // 1. Fetch from Supabase if user is logged in
    if (user && isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('test_attempts')
          .select('id, test_id, total_score, accuracy, time_taken_seconds, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          list = data;
        }
      } catch (err) {
        console.warn('Could not fetch test_attempts from Supabase:', err);
      }
    }

    // 2. Also check session storage / localStorage for recent attempts
    if (typeof window !== 'undefined') {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith('cbt_result_')) {
          try {
            const raw = sessionStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (!list.some(a => a.test_id === parsed.testId)) {
                list.push({
                  id: 'session_' + parsed.testId,
                  test_id: parsed.testId,
                  test_title: parsed.testTitle,
                  total_score: parsed.finalScore,
                  accuracy: parsed.accuracyPercentage,
                  time_taken_seconds: parsed.timeTakenSeconds,
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

  const handleDiscardPausedTest = (key: string) => {
    if (confirm('Discard this in-progress test? You will lose saved progress.')) {
      localStorage.removeItem(key);
      setPausedTests(prev => prev.filter(p => p.storageKey !== key));
    }
  };

  const handleDeleteAttempt = async (attempt: AttemptRecord) => {
    if (!confirm('Are you sure you want to reset this attempt? You will be able to take this mock test fresh.')) {
      return;
    }

    setDeletingId(attempt.id);

    // Remove from Supabase
    if (isSupabaseConfigured && supabase && !attempt.id.startsWith('session_')) {
      try {
        await supabase.from('test_attempts').delete().eq('id', attempt.id);
      } catch (e) {
        console.warn('Could not delete from Supabase:', e);
      }
    }

    // Remove from storage
    sessionStorage.removeItem(`cbt_result_${attempt.test_id}`);
    localStorage.removeItem(`cbt_paused_session_${attempt.test_id}_${user?.id}`);

    setAttempts(prev => prev.filter(a => a.id !== attempt.id));
    setDeletingId(null);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Dashboard Top Header (ExamGoal Aesthetic) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Candidate Portal Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Attempted Tests &amp; Performance History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your past mock test submissions, review detailed question-by-question solutions, or retake tests anytime.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
              <div className="text-[11px] text-slate-500">Roll: {user.rollNumber || '2402094182'}</div>
              <div className="text-[10px] text-emerald-600 font-bold">Verified Account</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('Sign in to link all your test attempts and save your score history.')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Sync History</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your test attempt records...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Paused & In-Progress Tests Section */}
          {pausedTests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <h2 className="text-sm font-extrabold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                    Paused &amp; In-Progress Tests ({pausedTests.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">Resume directly without losing progress</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pausedTests.map((pt) => (
                  <div
                    key={pt.storageKey}
                    className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm flex flex-col justify-between gap-4 transition hover:border-amber-400"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          Paused Test
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Paused on {new Date(pt.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {pt.testTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <Clock className="w-4 h-4" />
                          <span>Time Left: <strong>{Math.floor(pt.overallSecondsRemaining / 60)}m {pt.overallSecondsRemaining % 60}s</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Answered: <strong>{pt.answeredCount} questions</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-amber-200/80 dark:border-amber-800/60">
                      <Link
                        href={`/tests/${pt.testId}`}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 text-center"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Resume Test</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDiscardPausedTest(pt.storageKey)}
                        className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                        title="Discard paused test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tests List or Empty State */}
          {attempts.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 card-3d max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  No Completed Tests Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Take an official 2026 CBT mock test to see your score, live shift rank, and question derivations here.
                </p>
              </div>
              <Link
                href="/tests"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Mock Tests</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Attempts List */
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Completed Test Attempts ({attempts.length})</span>
                <span>Sorted by Most Recent</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Attempt Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {att.test_id.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(att.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {att.test_title || `Official Paper Attempt — ${att.test_id}`}
                  </h3>

                  {/* Metrics Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Score: <strong className="text-blue-600 dark:text-blue-400">{att.total_score}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Accuracy: <strong className="text-emerald-600">{att.accuracy}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Time: {formatSeconds(att.time_taken_seconds || 1800)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Link
                    href={`/tests/${att.test_id}/result`}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 btn-3d-primary cursor-pointer"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>View Scorecard</span>
                  </Link>

                  <Link
                    href={`/tests/${att.test_id}?mode=solution`}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Solutions &amp; Reattempt</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteAttempt(att)}
                    disabled={deletingId === att.id}
                    title="Retake test (clears this attempt)"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
