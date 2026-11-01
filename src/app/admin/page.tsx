'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  Search,
  Database,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  BarChart3,
  BookmarkCheck,
  LogOut,
  Sparkles,
  Flag,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  Check,
  Zap,
  Edit3
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  category: string;
  attemptsCount: number;
  savedQuestionsCount: number;
  totalTimeSpentSeconds: number;
  createdAt: string;
  lastSignInAt?: string;
}

interface Attempt {
  id: string;
  testId: string;
  candidateName: string;
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  createdAt: string;
}

interface UniqueShift {
  shiftKey: string;
  examTitle: string;
  examDate: string;
  shiftTime: string;
  submissionCount: number;
  candidateNames: string[];
  isPushed: boolean;
  pushedTestId?: string;
  representativeSubmission: {
    id: string;
    metrics: any;
    parsed: any;
  };
}

interface QuestionReport {
  id: string;
  testId: string;
  testTitle?: string;
  qno: number;
  questionText?: string;
  issueType: string;
  description: string;
  userEmail?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

const TEST_SERIES_OPTIONS = [
  { id: 'rrb-ntpc-grad', name: 'RRB NTPC Graduate Level' },
  { id: 'rrb-ntpc-ug', name: 'RRB NTPC Under Graduate' },
  { id: 'rrb-group-d', name: 'RRB Group D (Level-1)' },
  { id: 'rrb-section-controller', name: 'RRB Section Controller' },
  { id: 'rrb-alp', name: 'RRB ALP (Assistant Loco Pilot)' },
  { id: 'ssc-cgl', name: 'SSC CGL' },
  { id: 'ssc-chsl', name: 'SSC CHSL' },
  { id: 'ssc-mts', name: 'SSC MTS & Havaldar' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<{
    overview: {
      totalCandidates: number;
      totalAttempts: number;
      totalStudyHours: number;
      avgScore: number;
      avgAccuracy: number;
      pendingReportsCount: number;
      uniqueShiftsCount: number;
      databaseConnected: boolean;
    };
    candidates: Candidate[];
    attempts: Attempt[];
    hourlyActivity: { hour: number; label: string; count: number; totalSeconds: number }[];
    dayWiseActivity: { date: string; attempts: number; activeUsers: number; totalHours: number }[];
    uniqueShifts: UniqueShift[];
    questionReports: QuestionReport[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'shifts' | 'users' | 'activity' | 'reports' | 'attempts'>('shifts');
  const [searchQuery, setSearchQuery] = useState('');

  // Shift assignment state
  const [targetSeriesMap, setTargetSeriesMap] = useState<Record<string, string>>({});
  const [targetTierMap, setTargetTierMap] = useState<Record<string, 'pyq_tier1' | 'pyq_tier2'>>({});
  const [convertingShiftKey, setConvertingShiftKey] = useState<string | null>(null);
  const [convertSuccessMsg, setConvertSuccessMsg] = useState<string | null>(null);

  // Question editing modal state
  const [editingReport, setEditingReport] = useState<QuestionReport | null>(null);
  const [editQuesText, setEditQuesText] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Check admin session
  useEffect(() => {
    fetch('/api/admin/auth/verify')
      .then(res => {
        if (!res.ok) {
          router.push('/admin/login');
        } else {
          setAuthChecking(false);
          fetchDashboardData();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToMock = async (shift: UniqueShift) => {
    const submissionId = shift.representativeSubmission?.id;
    if (!submissionId) return;

    const targetCode = targetSeriesMap[shift.shiftKey] || (shift.examTitle?.toLowerCase().includes('graduate') ? 'rrb-ntpc-grad' : 'rrb-ntpc-ug');
    const targetTier = targetTierMap[shift.shiftKey] || 'pyq_tier1';

    setConvertingShiftKey(shift.shiftKey);
    setConvertSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/push-to-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          targetExamCode: targetCode,
          targetCategory: targetTier,
          generateAISolutions: true
        })
      });

      const json = await res.json();
      if (json.success) {
        setConvertSuccessMsg(`Published Mock Test: ${json.testId}`);
        fetchDashboardData();
      } else {
        alert(json.error || 'Failed to convert shift to test.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred during test generation.');
    } finally {
      setConvertingShiftKey(null);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const res = await fetch('/api/question-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status })
      });
      const json = await res.json();
      if (json.success) {
        fetchDashboardData();
      }
    } catch (e: any) {
      alert('Error updating report: ' + e.message);
    }
  };

  const handleSaveQuestionFix = async () => {
    if (!editingReport) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/question-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: editingReport.id,
          status: 'resolved',
          updatedQuestion: {
            questionText: editQuesText,
            explanation: editExplanation
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingReport(null);
        fetchDashboardData();
      } else {
        alert(json.error || 'Could not save question fix.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving fix.');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${sec % 60}s`;
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredCandidates = (data?.candidates || []).filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src="/images/mockyoddha-logo.jpg"
              alt="MockYoddha Logo"
              className="w-12 h-12 rounded-2xl object-cover shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  MockYoddha Control Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Answer Key Shift Ingestion Pipeline &bull; Day/Hour User Intelligence &bull; Question Error Auditing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Candidates</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {data?.overview.totalCandidates || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Test Attempts</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {data?.overview.totalAttempts || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Study Hours</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {data?.overview.totalStudyHours || 0}h
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Ingested Shifts</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {data?.overview.uniqueShiftsCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Pending Reports</div>
            <div className="text-2xl font-black text-amber-500 mt-1">
              {data?.overview.pendingReportsCount || 0}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Avg Accuracy</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {data?.overview.avgAccuracy || 0}%
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'shifts'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Answer Key Pipeline &amp; Mock Generator ({data?.overview.uniqueShiftsCount || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Details &amp; Study Time ({data?.overview.totalCandidates || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'activity'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Day-wise &amp; Hour-wise Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Question Error Reports ({data?.overview.pendingReportsCount || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('attempts')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'attempts'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Live Attempt Feed</span>
          </button>
        </div>

        {/* ── TAB 1: SHIFT PIPELINE & MOCK GENERATOR ── */}
        {activeTab === 'shifts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Candidate Answer Key Ingestion Pipeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When candidates evaluate their response sheets, unique shifts appear here. Assign them to a test series and generate official mock tests with AI solutions in 1 click!
                </p>
              </div>
              {convertSuccessMsg && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{convertSuccessMsg}</span>
                </div>
              )}
            </div>

            {(!data?.uniqueShifts || data.uniqueShifts.length === 0) ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Database className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Ingested Shifts Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a candidate enters their official response sheet URL in the Score Calculator, the shift will register here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {data.uniqueShifts.map((shift) => {
                  const isProcessing = convertingShiftKey === shift.shiftKey;
                  const currentCode = targetSeriesMap[shift.shiftKey] || (shift.examTitle?.toLowerCase().includes('graduate') ? 'rrb-ntpc-grad' : 'rrb-ntpc-ug');
                  const currentTier = targetTierMap[shift.shiftKey] || 'pyq_tier1';

                  return (
                    <div
                      key={shift.shiftKey}
                      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {shift.examTitle || 'Official Response Paper'}
                          </span>
                          {shift.isPushed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Live on Portal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Ready to Publish
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 space-x-3">
                          <span>📅 <strong>{shift.examDate || '2026'}</strong></span>
                          <span>⏰ <strong>{shift.shiftTime || 'Shift-1'}</strong></span>
                          <span>👥 <strong>{shift.submissionCount} submissions</strong></span>
                          <span>👤 Candidates: <em>{shift.candidateNames.slice(0, 3).join(', ')}</em></span>
                        </div>
                      </div>

                      {/* Assignment Controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Assign to Series</label>
                          <select
                            value={currentCode}
                            onChange={(e) => setTargetSeriesMap({ ...targetSeriesMap, [shift.shiftKey]: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            {TEST_SERIES_OPTIONS.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Tier</label>
                          <select
                            value={currentTier}
                            onChange={(e) => setTargetTierMap({ ...targetTierMap, [shift.shiftKey]: e.target.value as any })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value="pyq_tier1">CBT-1 (Tier 1)</option>
                            <option value="pyq_tier2">CBT-2 (Tier 2)</option>
                          </select>
                        </div>

                        <button
                          onClick={() => handleConvertToMock(shift)}
                          disabled={isProcessing}
                          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>{isProcessing ? 'Generating AI Solutions...' : 'Convert to Mock Test'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: USER DETAILS & STUDY TIME ── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Roll No, Email, Mobile..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                Showing {filteredCandidates.length} registered candidates
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Candidate Details</th>
                      <th className="py-3 px-3">Roll Number</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-center">Total Time Spent</th>
                      <th className="py-3 px-3 text-center">Tests Taken</th>
                      <th className="py-3 px-3 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.email} &bull; {c.phone}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {c.rollNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                            {c.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {formatSeconds(c.totalTimeSpentSeconds || 0)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {c.attemptsCount}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: DAY-WISE & HOUR-WISE ACTIVITY ── */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Hour-wise Peak Activity Breakdown (00:00 to 23:00) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Hour-wise Aspirant Activity Heatmap (00:00 – 23:00)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribution of mock test starts and active exam sessions by hour of day.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                {(data?.hourlyActivity || []).map((h) => {
                  const maxCount = Math.max(...(data?.hourlyActivity || []).map(x => x.count), 1);
                  const pct = Math.round((h.count / maxCount) * 100);

                  return (
                    <div key={h.hour} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                      <div className="text-[10px] font-bold text-slate-400">{h.label}</div>
                      <div className="text-base font-black text-slate-900 dark:text-white">{h.count}</div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-red-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day-wise Activity Breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Day-wise Platform Usage (Last 14 Days)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-3 text-center">Active Candidates</th>
                      <th className="py-2.5 px-3 text-center">Tests Attempted</th>
                      <th className="py-2.5 px-3 text-right">Study Time Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data?.dayWiseActivity || []).map((d) => (
                      <tr key={d.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{d.date}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-blue-600">{d.activeUsers}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{d.attempts}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{d.totalHours} hours</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: QUESTION ERROR REPORTS ── */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Candidate Error Reports ({data?.questionReports?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">
                  Questions flagged by aspirants. Click &quot;Fix Question&quot; to edit text or explanation directly!
                </p>
              </div>
            </div>

            {(!data?.questionReports || data.questionReports.length === 0) ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">All Questions Verified</h4>
                <p className="text-xs text-slate-500">No unresolved error reports currently flagged by students.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.questionReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                          Question #{r.qno}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {r.testTitle} ({r.testId})
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {r.issueType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingReport(r);
                            setEditQuesText(r.questionText || '');
                            setEditExplanation('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Fix Question</span>
                        </button>
                        <button
                          onClick={() => handleResolveReport(r.id, 'resolved')}
                          className="px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs font-bold transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                      <strong>Candidate Report: </strong>
                      <span>{r.description || 'Reported discrepancy in option/key.'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: LIVE ATTEMPTS ── */}
        {activeTab === 'attempts' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-black text-sm text-slate-900 dark:text-white">
              Recent CBT Mock Test Attempts Stream
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-3">Test Paper</th>
                    <th className="py-3 px-3 text-center">Score</th>
                    <th className="py-3 px-3 text-center">Accuracy</th>
                    <th className="py-3 px-3 text-center">Duration</th>
                    <th className="py-3 px-3 text-right">Attempted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.attempts || []).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.candidateName || 'Anonymous'}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{a.testId}</td>
                      <td className="py-3 px-3 text-center font-black text-blue-600">{a.score}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{a.accuracy}%</td>
                      <td className="py-3 px-3 text-center font-medium text-slate-500">{formatSeconds(a.timeTakenSeconds)}</td>
                      <td className="py-3 px-3 text-right text-slate-400">{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Question Fix Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Live Question Fix — Q.{editingReport.qno} ({editingReport.testId})
              </h3>
              <button onClick={() => setEditingReport(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Question Text</label>
                <textarea
                  value={editQuesText}
                  onChange={(e) => setEditQuesText(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Step-by-Step AI Solution &amp; Explanation</label>
                <textarea
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="Enter corrected step-by-step mathematical proof or reasoning solution..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestionFix}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {savingEdit ? 'Saving Fix...' : 'Save & Resolve Error'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
