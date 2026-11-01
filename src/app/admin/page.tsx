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
  Edit3,
  Download,
  Trash2,
  Plus,
  MessageSquare,
  Star
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

interface ShiftDifficultyAnalytic {
  shiftKey: string;
  examTitle: string;
  examFamily: string;
  examDate: string;
  shiftTime: string;
  candidateCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageAccuracy: number;
  difficultyLevel: 'Hard' | 'Moderate' | 'Easy';
  difficultyTag: string;
  normalizationDelta: number;
  hardestSection: string;
  easiestSection: string;
  scoreDistribution: {
    below40: number;
    range40to60: number;
    range60to80: number;
    above80: number;
  };
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
    shiftDifficultyAnalytics?: ShiftDifficultyAnalytic[];
    questionReports: QuestionReport[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'shifts' | 'difficulty' | 'users' | 'activity' | 'reports' | 'attempts' | 'reviews'>('shifts');
  const [studentReviews, setStudentReviews] = useState<any[]>([]);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    student_name: '',
    exam_title: '',
    review_category: 'Mock Test Interface',
    rating: 5,
    review_text: '',
    avatar_url: '',
    is_published: true,
    order_index: 0
  });
  const [savingReview, setSavingReview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyExamFilter, setDifficultyExamFilter] = useState('all');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [difficultyMsg, setDifficultyMsg] = useState<string | null>(null);

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

  const handleOpenAddReview = () => {
    setEditingReview(null);
    setReviewForm({
      student_name: '',
      exam_title: '',
      review_category: 'Mock Test Interface',
      rating: 5,
      review_text: '',
      avatar_url: '',
      is_published: true,
      order_index: studentReviews.length + 1
    });
    setReviewModalOpen(true);
  };

  const handleOpenEditReview = (r: any) => {
    setEditingReview(r);
    setReviewForm({
      student_name: r.student_name || '',
      exam_title: r.exam_title || '',
      review_category: r.review_category || 'Mock Test Interface',
      rating: r.rating || 5,
      review_text: r.review_text || '',
      avatar_url: r.avatar_url || '',
      is_published: r.is_published !== false,
      order_index: r.order_index || 0
    });
    setReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      if (editingReview) {
        const res = await fetch('/api/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingReview.id, ...reviewForm })
        });
        const json = await res.json();
        if (json.success) {
          setReviewModalOpen(false);
          fetchDashboardData();
        } else {
          alert(json.error || 'Failed to update review');
        }
      } else {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewForm)
        });
        const json = await res.json();
        if (json.success) {
          setReviewModalOpen(false);
          fetchDashboardData();
        } else {
          alert(json.error || 'Failed to add review');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving review');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student review?')) return;
    try {
      const res = await fetch('/api/reviews?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchDashboardData();
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting review');
    }
  };

  const handleToggleReviewPublish = async (r: any) => {
    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, is_published: !r.is_published })
      });
      fetchDashboardData();
    } catch (e) {}
  };

  const handleGenerateBenchmarks = async () => {
    setGeneratingReport(true);
    setDifficultyMsg(null);
    try {
      const res = await fetch('/api/admin/shift-difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_benchmarks' })
      });
      const json = await res.json();
      if (json.success) {
        setDifficultyMsg(json.message);
        fetchDashboardData();
      } else {
        alert(json.error || 'Failed to generate benchmarks.');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating benchmarks.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportShiftCSV = () => {
    if (!data?.shiftDifficultyAnalytics || data.shiftDifficultyAnalytics.length === 0) {
      alert('No shift difficulty data available to export.');
      return;
    }
    const headers = ['Shift Key', 'Exam', 'Date', 'Shift Time', 'Candidates', 'Avg Score', 'Min Score', 'Max Score', 'Avg Accuracy (%)', 'Difficulty', 'Normalization Delta', 'Hardest Section'];
    const rows = data.shiftDifficultyAnalytics.map(s => [
      `"${s.shiftKey}"`,
      `"${s.examTitle}"`,
      `"${s.examDate}"`,
      `"${s.shiftTime}"`,
      s.candidateCount,
      s.averageScore,
      s.lowestScore,
      s.highestScore,
      s.averageAccuracy,
      `"${s.difficultyLevel}"`,
      s.normalizationDelta,
      `"${s.hardestSection}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mockyoddha_shift_difficulty_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={() => setActiveTab('difficulty')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'difficulty'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Shift Difficulty &amp; Normalization ({data?.shiftDifficultyAnalytics?.length || 0})</span>
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

        {/* ── TAB: SHIFT DIFFICULTY & NORMALIZATION MATRIX ── */}
        {activeTab === 'difficulty' && (
          <div className="space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Shift-wise Difficulty &amp; Normalization Matrix
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dynamic difficulty benchmarks calculated across all candidate response sheets. Hard shifts receive positive normalization scaling.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBenchmarks}
                  disabled={generatingReport}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 fill-current ${generatingReport ? 'animate-spin' : ''}`} />
                  <span>{generatingReport ? 'Computing Matrix...' : 'Generate & Publish Benchmarks'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportShiftCSV}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Export complete shift comparison table to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {difficultyMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{difficultyMsg}</span>
              </div>
            )}

            {/* Shift Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Analyzed Shifts</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {data?.shiftDifficultyAnalytics?.length || 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Across all official dates</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Tough Shifts</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {data?.shiftDifficultyAnalytics?.filter(s => s.difficultyLevel === 'Hard').length || 0}
                </div>
                <div className="text-[10px] text-rose-500 mt-0.5">Bonus Normalization</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Moderate Shifts</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-500 mt-1">
                  {data?.shiftDifficultyAnalytics?.filter(s => s.difficultyLevel === 'Moderate').length || 0}
                </div>
                <div className="text-[10px] text-amber-500 mt-0.5">Standard Cutoff Range</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Easy Shifts</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {data?.shiftDifficultyAnalytics?.filter(s => s.difficultyLevel === 'Easy').length || 0}
                </div>
                <div className="text-[10px] text-emerald-500 mt-0.5">High Raw Scores</div>
              </div>
            </div>

            {/* Exam Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Filter Exam:
              </span>
              {[
                { id: 'all', name: 'All Exams' },
                { id: 'rrb-ntpc-ug', name: 'RRB NTPC UG' },
                { id: 'rrb-ntpc-grad', name: 'RRB NTPC Graduate' },
                { id: 'rrb-group-d', name: 'RRB Group D' },
                { id: 'ssc-cgl', name: 'SSC CGL' },
                { id: 'ssc-chsl', name: 'SSC CHSL' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setDifficultyExamFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    difficultyExamFilter === f.id
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Shift Comparison Table */}
            {(!data?.shiftDifficultyAnalytics || data.shiftDifficultyAnalytics.length === 0) ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <BarChart3 className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  No Shift Submissions Recorded Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When candidates evaluate their official DigiALM or SSC response sheets, shift analytics and difficulty matrices will be computed here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-black border-b border-slate-200 dark:border-slate-800 text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Shift &amp; Exam</th>
                      <th className="px-3 py-3.5 text-center">Candidates</th>
                      <th className="px-3 py-3.5 text-center">Average Score</th>
                      <th className="px-3 py-3.5 text-center">Score Range (Min–Max)</th>
                      <th className="px-3 py-3.5 text-center">Accuracy</th>
                      <th className="px-4 py-3.5 text-center">Difficulty Rating</th>
                      <th className="px-3 py-3.5 text-center">Normalization Delta</th>
                      <th className="px-4 py-3.5">Hardest Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.shiftDifficultyAnalytics
                      .filter(s => {
                        if (difficultyExamFilter === 'all') return true;
                        return (s.examFamily || '').toLowerCase().includes(difficultyExamFilter) ||
                               (s.shiftKey || '').toLowerCase().includes(difficultyExamFilter);
                      })
                      .map((shift, idx) => {
                        const isHard = shift.difficultyLevel === 'Hard';
                        const isEasy = shift.difficultyLevel === 'Easy';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3.5">
                              <div className="font-extrabold text-slate-900 dark:text-white">
                                {shift.examTitle}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>📅 {shift.examDate}</span>
                                <span>⏰ {shift.shiftTime}</span>
                              </div>
                            </td>

                            <td className="px-3 py-3.5 text-center">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {shift.candidateCount}
                              </span>
                              <span className="block text-[10px] text-slate-400">students</span>
                            </td>

                            <td className="px-3 py-3.5 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                                isHard
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : isEasy
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {shift.averageScore}
                              </span>
                            </td>

                            <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {shift.lowestScore} &rarr; {shift.highestScore}
                            </td>

                            <td className="px-3 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {shift.averageAccuracy}%
                            </td>

                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                                isHard
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                                  : isEasy
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isHard ? 'bg-rose-600' : isEasy ? 'bg-emerald-600' : 'bg-amber-500'
                                }`} />
                                <span>{shift.difficultyLevel}</span>
                              </span>
                            </td>

                            <td className="px-3 py-3.5 text-center">
                              <span className={`font-black text-xs ${
                                shift.normalizationDelta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : shift.normalizationDelta < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-500'
                              }`}>
                                {shift.normalizationDelta > 0 ? `+${shift.normalizationDelta}` : shift.normalizationDelta}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                              {shift.hardestSection !== 'N/A' ? (
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                                  {shift.hardestSection}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
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
        {/* ── TAB 6: STUDENT REVIEWS MANAGEMENT ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-500" />
                  <span>Student Reviews &amp; Feedback ({studentReviews.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage genuine aspirant reviews displayed on homepage. Add, edit, reorder or publish/unpublish directly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddReview}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student Review</span>
              </button>
            </div>

            {studentReviews.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Reviews Added Yet</h4>
                <p className="text-xs text-slate-500 mt-1">Click &quot;Add Student Review&quot; to publish your first genuine review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentReviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {r.review_category}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleReviewPublish(r)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                              r.is_published !== false
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {r.is_published !== false ? 'Published' : 'Draft'}
                          </button>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(r.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        &ldquo;{r.review_text}&rdquo;
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={r.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={r.student_name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {r.student_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {r.exam_title}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Review Create/Edit Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {editingReview ? 'Edit Student Review' : 'Add New Student Review'}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Student Name</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.student_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, student_name: e.target.value })}
                    placeholder="e.g. Vikram Singh"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Exam Title / Credential</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.exam_title}
                    onChange={(e) => setReviewForm({ ...reviewForm, exam_title: e.target.value })}
                    placeholder="e.g. Selected RRB NTPC Grad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Feedback Category</label>
                  <select
                    value={reviewForm.review_category}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Mock Test Interface">Mock Test Interface</option>
                    <option value="Website Experience">Website Experience</option>
                    <option value="Question Quality">Question Quality</option>
                    <option value="Performance Analysis">Performance Analysis</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rating (1 to 5 Stars)</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Review Quotation</label>
                <textarea
                  required
                  rows={3}
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                  placeholder="Student feedback on website, test interface, or questions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={reviewForm.avatar_url}
                  onChange={(e) => setReviewForm({ ...reviewForm, avatar_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={reviewForm.is_published}
                    onChange={(e) => setReviewForm({ ...reviewForm, is_published: e.target.checked })}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>Published on Homepage</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReview}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {savingReview ? 'Saving...' : editingReview ? 'Save Changes' : 'Add Review'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
