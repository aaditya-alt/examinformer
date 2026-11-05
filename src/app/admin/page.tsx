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
  Star,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

export interface QuestionDetails {
  questionTextEn?: string;
  questionTextHi?: string;
  options?: Array<{
    id: number | string;
    text_en?: string;
    text_hi?: string;
    text?: string;
    textHi?: string;
    imageUrl?: string;
  }>;
  correctOptionIndex?: number;
  explanationEn?: string;
  explanationHi?: string;
  questionImages?: string[];
}

interface QuestionReport {
  id: string;
  testId: string;
  testTitle?: string;
  qno: number;
  questionText?: string;
  questionTextHi?: string;
  issueType: string;
  description: string;
  userEmail?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  questionDetails?: QuestionDetails;
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
  { id: 'ssc-cpo', name: 'SSC CPO (SI in Delhi Police & CAPFs)' },
  { id: 'delhi-police', name: 'Delhi Police Constable' },
  { id: 'ssc-gd', name: 'SSC GD Constable' },
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

  const [activeTab, setActiveTab] = useState<'shifts' | 'difficulty' | 'diagrams' | 'users' | 'activity' | 'reports' | 'attempts' | 'reviews'>('shifts');
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

  // Diagram questions state
  const [diagramQuestions, setDiagramQuestions] = useState<any[]>([]);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [diagramFilter, setDiagramFilter] = useState<'all' | 'missing' | 'has_image'>('all');
  const [diagramSubject, setDiagramSubject] = useState<'all' | 'reasoning' | 'math'>('all');
  const [diagramSearch, setDiagramSearch] = useState('');
  const [diagramTestId, setDiagramTestId] = useState('');
  const [diagramUploadLoading, setDiagramUploadLoading] = useState<string | null>(null);

  // Shift assignment state
  const [targetSeriesMap, setTargetSeriesMap] = useState<Record<string, string>>({});
  const [targetTierMap, setTargetTierMap] = useState<Record<string, 'pyq_tier1' | 'pyq_tier2'>>({});
  const [targetYearMap, setTargetYearMap] = useState<Record<string, number>>({});
  const [customTitleMap, setCustomTitleMap] = useState<Record<string, string>>({});
  const [convertingShiftKey, setConvertingShiftKey] = useState<string | null>(null);
  const [convertSuccessMsg, setConvertSuccessMsg] = useState<string | null>(null);

  // Question editing modal state
  const [editingReport, setEditingReport] = useState<QuestionReport | null>(null);
  const [editQuesText, setEditQuesText] = useState('');
  const [editQuesTextHi, setEditQuesTextHi] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editExplanationHi, setEditExplanationHi] = useState('');
  const [editCorrectOption, setEditCorrectOption] = useState<number>(1);
  const [editOptionsList, setEditOptionsList] = useState<Array<{ id: number; text_en: string; text_hi: string; imageUrl?: string }>>([
    { id: 1, text_en: '', text_hi: '' },
    { id: 2, text_en: '', text_hi: '' },
    { id: 3, text_en: '', text_hi: '' },
    { id: 4, text_en: '', text_hi: '' }
  ]);
  const [editQuestionImageUrl, setEditQuestionImageUrl] = useState('');
  const [editOptionImages, setEditOptionImages] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reportsLanguageMode, setReportsLanguageMode] = useState<Record<string, 'both' | 'en' | 'hi'>>({});

  const handleUploadImage = async (file: File, target: 'question' | 'opt1' | 'opt2' | 'opt3' | 'opt4') => {
    try {
      if (!supabase) {
        alert('Supabase client not initialized.');
        return;
      }
      setUploadingImage(true);
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage.from('question-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) {
        alert('Storage upload failed: ' + error.message);
        return;
      }
      const { data: publicData } = supabase.storage.from('question-images').getPublicUrl(fileName);
      const url = publicData.publicUrl;
      if (target === 'question') {
        setEditQuestionImageUrl(url);
      } else {
        const optNum = target.replace('opt', '');
        setEditOptionImages(prev => ({ ...prev, [optNum]: url }));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Check admin session
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mockyoddha_admin_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/admin/auth/verify', { headers })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('mockyoddha_admin_token');
          router.push('/admin/login');
        } else {
          setAuthChecking(false);
          fetchDashboardData();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('mockyoddha_admin_token');
    localStorage.removeItem('mockyoddha_admin_user');
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mockyoddha_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/dashboard', { headers });
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

  const fetchDiagramQuestions = async () => {
    setLoadingDiagrams(true);
    try {
      const params = new URLSearchParams();
      if (diagramFilter !== 'all') params.set('filter', diagramFilter);
      if (diagramSubject !== 'all') params.set('subject', diagramSubject);
      if (diagramTestId) params.set('testId', diagramTestId);
      const res = await fetch(`/api/admin/diagram-questions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDiagramQuestions(json.questions || []);
      }
    } catch (err) {
      console.error('Failed to load diagram questions:', err);
    } finally {
      setLoadingDiagrams(false);
    }
  };

  const handleUploadQuestionDiagram = async (q: any, file: File) => {
    try {
      if (!supabase) {
        alert('Supabase client not initialized.');
        return;
      }
      setDiagramUploadLoading(`${q.testId}_${q.qno}`);
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `diag_${q.testId}_q${q.qno}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('question-images').upload(fileName, file, {
        upsert: true,
        cacheControl: '3600'
      });
      if (error) {
        alert('Upload failed: ' + error.message);
        return;
      }
      const { data: publicData } = supabase.storage.from('question-images').getPublicUrl(fileName);
      const url = publicData.publicUrl;

      const res = await fetch('/api/admin/diagram-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: q.testId,
          qno: q.qno,
          questionImages: [url]
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchDiagramQuestions();
        alert(`Figure uploaded successfully for Q.${q.qno}!`);
      } else {
        alert('Update error: ' + json.error);
      }
    } catch (e: any) {
      alert('Upload error: ' + e.message);
    } finally {
      setDiagramUploadLoading(null);
    }
  };

  const handleRefreshReports = async () => {
    try {
      const res = await fetch('/api/question-reports');
      const json = await res.json();
      if (json.success && data) {
        setData({
          ...data,
          questionReports: json.reports || []
        });
      }
    } catch (e) {
      console.warn('Refresh reports note:', e);
    }
  };

  const handleConvertToMock = async (shift: UniqueShift) => {
    const submissionId = shift.representativeSubmission?.id;
    if (!submissionId) return;

    const isSSC = shift.examTitle?.toLowerCase().includes('cgl') ||
                  shift.examTitle?.toLowerCase().includes('combined graduate') ||
                  shift.examTitle?.toLowerCase().includes('ssc');
    const defaultSeries = isSSC
      ? 'ssc-cgl'
      : (shift.examTitle?.toLowerCase().includes('graduate') ? 'rrb-ntpc-grad' : 'rrb-ntpc-ug');

    const yearMatch = (shift.examDate + ' ' + shift.examTitle).match(/202[3-9]/);
    const defaultYear = yearMatch ? parseInt(yearMatch[0], 10) : 2026;

    const targetCode = targetSeriesMap[shift.shiftKey] || defaultSeries;
    const targetTier = targetTierMap[shift.shiftKey] || 'pyq_tier1';
    const targetYear = targetYearMap[shift.shiftKey] || defaultYear;
    const customTitle = customTitleMap[shift.shiftKey] || shift.examTitle;

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
          examYear: targetYear,
          customTitle,
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

  const openFixQuestionModal = (r: QuestionReport) => {
    setEditingReport(r);
    const d = r.questionDetails;
    setEditQuesText(d?.questionTextEn || r.questionText || '');
    setEditQuesTextHi(d?.questionTextHi || r.questionTextHi || '');
    setEditExplanation(d?.explanationEn || '');
    setEditExplanationHi(d?.explanationHi || '');
    setEditCorrectOption(d?.correctOptionIndex !== undefined ? d.correctOptionIndex + 1 : 1);
    
    if (d?.options && d.options.length > 0) {
      setEditOptionsList(d.options.map((o: any, idx: number) => ({
        id: typeof o.id === 'number' ? o.id : idx + 1,
        text_en: o.text_en || o.text || '',
        text_hi: o.text_hi || o.textHi || o.text_en || o.text || '',
        imageUrl: o.imageUrl
      })));
    } else {
      setEditOptionsList([
        { id: 1, text_en: '', text_hi: '' },
        { id: 2, text_en: '', text_hi: '' },
        { id: 3, text_en: '', text_hi: '' },
        { id: 4, text_en: '', text_hi: '' }
      ]);
    }
    setEditQuestionImageUrl(d?.questionImages?.[0] || '');
    const optImgs: Record<string, string> = {};
    (d?.options || []).forEach((o: any, idx: number) => {
      const id = String(o.id || idx + 1);
      if (o.imageUrl) optImgs[id] = o.imageUrl;
    });
    setEditOptionImages(optImgs);
  };

  const handleEditDiagramQuestion = (q: any) => {
    const syntheticReport: QuestionReport = {
      id: `diag_${q.testId}_${q.qno}`,
      testId: q.testId,
      testTitle: q.testTitle || q.testId,
      qno: q.qno,
      issueType: 'missing_options',
      description: 'Admin visual / diagram update',
      createdAt: new Date().toISOString(),
      status: 'pending',
      questionDetails: {
        questionTextEn: q.questionTextEn,
        questionTextHi: q.questionTextHi,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanationEn: q.explanationEn,
        explanationHi: q.explanationHi,
        questionImages: q.questionImages
      }
    };
    openFixQuestionModal(syntheticReport);
  };

  const handleSaveQuestionFix = async () => {
    if (!editingReport) return;
    setSavingEdit(true);
    try {
      const updatedQuestionPayload: any = {
        questionTextEn: editQuesText,
        questionTextHi: editQuesTextHi,
        explanationEn: editExplanation,
        explanationHi: editExplanationHi,
        correctOptionIndex: editCorrectOption - 1,
        options: editOptionsList.map((opt) => ({
          id: opt.id,
          text_en: opt.text_en,
          text_hi: opt.text_hi,
          imageUrl: editOptionImages[String(opt.id)] || opt.imageUrl || undefined
        })),
        questionImages: editQuestionImageUrl ? [editQuestionImageUrl] : []
      };

      const res = await fetch('/api/question-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: editingReport.id,
          status: 'resolved',
          testId: editingReport.testId,
          qno: editingReport.qno,
          updatedQuestion: updatedQuestionPayload
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingReport(null);
        setEditQuestionImageUrl('');
        setEditOptionImages({});
        fetchDashboardData();
        fetchDiagramQuestions();
        alert('Question updated and marked resolved successfully!');
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

  const filteredDiagramQuestions = diagramQuestions.filter((q) => {
    if (!diagramSearch.trim()) return true;
    const s = diagramSearch.toLowerCase();
    return (
      (q.testId && q.testId.toLowerCase().includes(s)) ||
      (q.testTitle && q.testTitle.toLowerCase().includes(s)) ||
      String(q.qno).includes(s) ||
      (q.questionTextEn && q.questionTextEn.toLowerCase().includes(s)) ||
      (q.questionTextHi && q.questionTextHi.toLowerCase().includes(s)) ||
      (q.sectionName && q.sectionName.toLowerCase().includes(s))
    );
  });

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
            onClick={() => {
              setActiveTab('diagrams');
              fetchDiagramQuestions();
            }}
            className={`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'diagrams'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-violet-500" />
            <span>Visual / Diagram Questions ({diagramQuestions.length > 0 ? diagramQuestions.length : '42+'})</span>
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
                  const isSSC = shift.examTitle?.toLowerCase().includes('cgl') ||
                                shift.examTitle?.toLowerCase().includes('combined graduate') ||
                                shift.examTitle?.toLowerCase().includes('ssc');
                  const defaultSeries = isSSC
                    ? 'ssc-cgl'
                    : (shift.examTitle?.toLowerCase().includes('graduate') ? 'rrb-ntpc-grad' : 'rrb-ntpc-ug');

                  const yearMatch = (shift.examDate + ' ' + shift.examTitle).match(/202[3-9]/);
                  const defaultYear = yearMatch ? parseInt(yearMatch[0], 10) : 2026;

                  const currentCode = targetSeriesMap[shift.shiftKey] || defaultSeries;
                  const currentYear = targetYearMap[shift.shiftKey] || defaultYear;
                  const currentTier = targetTierMap[shift.shiftKey] || 'pyq_tier1';
                  const activePushedId = shift.pushedTestId || (shift.representativeSubmission as any)?.pushedToTestId;

                  return (
                    <div
                      key={shift.shiftKey}
                      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {shift.examTitle || 'Official Response Paper'}
                          </span>
                          {shift.isPushed ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> Live on Portal
                              </span>
                              {activePushedId && (
                                <Link
                                  href={`/tests/${activePushedId}`}
                                  target="_blank"
                                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 border border-blue-200 transition"
                                >
                                  <span>Open CBT Mock</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Ready to Push
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 space-x-3">
                          <span>📅 <strong>{shift.examDate || '2026'}</strong></span>
                          <span>⏰ <strong>{shift.shiftTime || 'Shift-1'}</strong></span>
                          <span>👥 <strong>{shift.submissionCount} submissions</strong></span>
                          <span>👤 Candidate: <em>{shift.candidateNames.slice(0, 3).join(', ')}</em></span>
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
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Exam Year</label>
                          <select
                            value={currentYear}
                            onChange={(e) => setTargetYearMap({ ...targetYearMap, [shift.shiftKey]: Number(e.target.value) })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                            <option value={2023}>2023</option>
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

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Custom Title</label>
                          <input
                            type="text"
                            placeholder={shift.examTitle || 'Shift Title'}
                            value={customTitleMap[shift.shiftKey] !== undefined ? customTitleMap[shift.shiftKey] : (shift.examTitle || '')}
                            onChange={(e) => setCustomTitleMap({ ...customTitleMap, [shift.shiftKey]: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold w-56"
                          />
                        </div>

                        <button
                          onClick={() => handleConvertToMock(shift)}
                          disabled={isProcessing}
                          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>{isProcessing ? 'Pushing to Database...' : (shift.isPushed ? 'Re-Sync Mock Test' : 'Push to Database (Mock Test)')}</span>
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

        {/* ── TAB: VISUAL / DIAGRAM QUESTIONS MANAGER ── */}
        {activeTab === 'diagrams' && (
          <div className="space-y-4">
            {/* Header & Controls */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-violet-500" />
                    <span>Visual &amp; Diagram Questions Pipeline</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Meticulously inspect and upload missing reasoning &amp; math figures, diagrams, and paper cuttings directly to Supabase storage.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchDiagramQuestions}
                    disabled={loadingDiagrams}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDiagrams ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <input
                    type="text"
                    value={diagramSearch}
                    onChange={(e) => setDiagramSearch(e.target.value)}
                    placeholder="Search question text or Q#..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div>
                  <select
                    value={diagramFilter}
                    onChange={(e) => {
                      setDiagramFilter(e.target.value as any);
                      setTimeout(fetchDiagramQuestions, 10);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="all">All Visual Questions</option>
                    <option value="missing">Needs Diagram (Missing)</option>
                    <option value="has_image">Has Diagram Attached</option>
                  </select>
                </div>

                <div>
                  <select
                    value={diagramSubject}
                    onChange={(e) => {
                      setDiagramSubject(e.target.value as any);
                      setTimeout(fetchDiagramQuestions, 10);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="all">All Subjects</option>
                    <option value="reasoning">Reasoning &amp; Intelligence</option>
                    <option value="math">Quantitative Aptitude</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500 font-semibold flex items-center justify-end">
                  Showing {filteredDiagramQuestions.length} visual questions
                </div>
              </div>
            </div>

            {/* List */}
            {loadingDiagrams ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Loading Visual Questions...</h4>
              </div>
            ) : filteredDiagramQuestions.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Questions Match Filter</h4>
                <p className="text-xs text-slate-500 mt-1">Try switching filters or resetting search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredDiagramQuestions.map((q) => {
                  const hasImage = (q.questionImages && q.questionImages.length > 0) || (q.options && q.options.some((o: any) => o.imageUrl));
                  const isUploading = diagramUploadLoading === `${q.testId}_${q.qno}`;

                  return (
                    <div
                      key={`${q.testId}_${q.qno}`}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                            Q.{q.qno}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {q.testTitle || q.testId}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {q.sectionName || 'Reasoning'}
                          </span>
                          {hasImage ? (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Diagram Attached
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Diagram Missing
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* File input for one-click upload */}
                          <label className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isUploading
                              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                              : 'bg-violet-600 hover:bg-violet-700 text-white'
                          }`}>
                            <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
                            <span>{isUploading ? 'Uploading...' : hasImage ? 'Replace Diagram' : 'Upload Diagram'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadQuestionDiagram(q, f);
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleEditDiagramQuestion(q)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Text &amp; Solutions</span>
                          </button>
                        </div>
                      </div>

                      {/* Attached Diagram Preview */}
                      {q.questionImages && q.questionImages.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
                          <img
                            src={q.questionImages[0]}
                            alt={`Question ${q.qno} diagram`}
                            className="h-28 max-w-xs object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                          />
                          <div className="text-xs space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">Current Diagram:</span>
                            <a
                              href={q.questionImages[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-violet-600 hover:underline text-[11px] block truncate max-w-md"
                            >
                              {q.questionImages[0]}
                            </a>
                            <p className="text-[11px] text-slate-400">
                              Directly rendered in test series CBT screens.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Question texts bilingual */}
                      <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
                        <div className="text-slate-900 dark:text-white leading-relaxed">
                          <strong className="text-blue-600 mr-1.5">[English]:</strong>
                          <span>{q.questionTextEn || '—'}</span>
                        </div>
                        {q.questionTextHi && (
                          <div className="text-slate-900 dark:text-white leading-relaxed pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <strong className="text-emerald-600 mr-1.5">[हिंदी]:</strong>
                            <span>{q.questionTextHi}</span>
                          </div>
                        )}
                      </div>

                      {/* Options preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(q.options || []).map((opt: any, optIdx: number) => {
                          const isCorrect = q.correctOptionIndex === optIdx || q.correctOptionIndex === (optIdx + 1) || q.correctOptionIndex === opt.id;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="truncate">
                                  {opt.text_en || opt.text || `Option ${optIdx + 1}`}
                                  {opt.text_hi && opt.text_hi !== opt.text_en && (
                                    <span className="text-slate-400 ml-1.5 text-[11px]">({opt.text_hi})</span>
                                  )}
                                </span>
                              </div>
                              {isCorrect && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                                  Key ✓
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation preview if exists */}
                      {(q.explanationEn || q.explanationHi) && (
                        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          <strong className="text-blue-700 dark:text-blue-400 block text-[11px] uppercase tracking-wide">
                            Official Explanation:
                          </strong>
                          {q.explanationEn && <div>{q.explanationEn}</div>}
                          {q.explanationHi && <div className="text-slate-600 dark:text-slate-400">{q.explanationHi}</div>}
                        </div>
                      )}
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
              <button
                type="button"
                onClick={handleRefreshReports}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Reports</span>
              </button>
            </div>

            {(!data?.questionReports || data.questionReports.length === 0) ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">All Questions Verified</h4>
                <p className="text-xs text-slate-500">No unresolved error reports currently flagged by students.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.questionReports.map((r) => {
                  const viewMode = reportsLanguageMode[r.id] || 'both';
                  const d = r.questionDetails;
                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            Question #{r.qno}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {r.testTitle} ({r.testId})
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {r.issueType.replace('_', ' ')}
                          </span>
                          {r.userEmail && (
                            <span className="text-[11px] text-slate-400">
                              by {r.userEmail}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openFixQuestionModal(r)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Fix / Edit Question</span>
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'resolved')}
                            className="px-3.5 py-1.5 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-xs font-bold transition cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>

                      {/* Candidate Report Note */}
                      <div className="text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40">
                        <strong>Candidate Report: </strong>
                        <span>{r.description || 'Reported discrepancy in option/key.'}</span>
                      </div>

                      {/* Full Question, Options & Solution Display in Both Languages */}
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                        {/* Language Toggle for this report card */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Question Preview</span>
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                            {(['both', 'en', 'hi'] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setReportsLanguageMode(prev => ({ ...prev, [r.id]: mode }))}
                                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                                  viewMode === mode
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                }`}
                              >
                                {mode === 'both' ? 'Both (Side-by-Side)' : mode === 'en' ? 'English' : 'हिंदी'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="space-y-2">
                          {(viewMode === 'both' || viewMode === 'en') && (
                            <div className="text-xs text-slate-900 dark:text-white leading-relaxed">
                              <span className="font-bold text-blue-600 mr-1.5">[EN]:</span>
                              {d?.questionTextEn || r.questionText || 'No English text available.'}
                            </div>
                          )}
                          {(viewMode === 'both' || viewMode === 'hi') && (
                            <div className="text-xs text-slate-900 dark:text-white leading-relaxed">
                              <span className="font-bold text-emerald-600 mr-1.5">[HI]:</span>
                              {d?.questionTextHi || r.questionTextHi || 'हिंदी पाठ उपलब्ध नहीं है।'}
                            </div>
                          )}
                        </div>

                        {/* Question Diagram / Image */}
                        {d?.questionImages && d.questionImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 py-1">
                            {d.questionImages.map((img, i) => (
                              <img key={i} src={img} alt="Diagram" className="max-h-40 border rounded-lg bg-white p-1 object-contain" />
                            ))}
                          </div>
                        )}

                        {/* All 4 Options with English and Hindi & Correct Key highlight */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Options:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(d?.options || []).map((opt: any, optIdx: number) => {
                              const optNum = typeof opt.id === 'number' ? opt.id : optIdx + 1;
                              const isCorrect = (d?.correctOptionIndex !== undefined && (d.correctOptionIndex === optIdx || d.correctOptionIndex === optNum || d.correctOptionIndex === optIdx + 1));
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    {isCorrect && (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                                        Official Key ✓
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 text-xs">
                                    {(viewMode === 'both' || viewMode === 'en') && (
                                      <div><strong className="text-slate-400 text-[10px]">EN:</strong> {opt.text_en || opt.text || `Option ${optNum}`}</div>
                                    )}
                                    {(viewMode === 'both' || viewMode === 'hi') && (
                                      <div><strong className="text-slate-400 text-[10px]">HI:</strong> {opt.text_hi || opt.textHi || opt.text_en || opt.text || `विकल्प ${optNum}`}</div>
                                    )}
                                  </div>
                                  {opt.imageUrl && (
                                    <img src={opt.imageUrl} alt={`Opt ${optNum}`} className="h-14 border rounded object-contain bg-white mt-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step-by-Step Solution in English and Hindi */}
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solution / Explanation:</span>
                          {(viewMode === 'both' || viewMode === 'en') && (
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200">
                              <span className="font-bold text-blue-700 block mb-0.5">[English Solution]:</span>
                              <div className="whitespace-pre-wrap">{d?.explanationEn || 'No English solution set.'}</div>
                            </div>
                          )}
                          {(viewMode === 'both' || viewMode === 'hi') && (
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-950 dark:text-emerald-200">
                              <span className="font-bold text-emerald-700 block mb-0.5">[हिंदी समाधान]:</span>
                              <div className="whitespace-pre-wrap">{d?.explanationHi || 'हिंदी समाधान उपलब्ध नहीं है।'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <Link href={`/tests/${a.testId}`} target="_blank" className="hover:text-blue-600 dark:hover:text-blue-400 font-mono text-[11px] hover:underline">
                          {a.testId}
                        </Link>
                      </td>
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
          <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                    Bilingual Editor
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Edit &amp; Fix Question #{editingReport.qno}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  Test: {editingReport.testId} • Reported Issue: {editingReport.issueType}
                </p>
              </div>
              <button 
                onClick={() => setEditingReport(null)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {/* Question Text in English & Hindi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Question Text (English)
                    </label>
                  </div>
                  <textarea
                    value={editQuesText}
                    onChange={(e) => setEditQuesText(e.target.value)}
                    rows={4}
                    placeholder="Enter English question text..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Question Text (हिंदी)
                    </label>
                  </div>
                  <textarea
                    value={editQuesTextHi}
                    onChange={(e) => setEditQuesTextHi(e.target.value)}
                    rows={4}
                    placeholder="हिंदी प्रश्न दर्ज करें..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Question Image Upload (for Non-verbal/Diagrams) */}
              <div className="space-y-2 p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-violet-500" />
                    <span>Question Diagram / Figure (Mirror / Non-verbal Figure)</span>
                  </span>
                  {uploadingImage && <span className="text-[10px] text-violet-600 animate-pulse font-bold">Uploading to Supabase...</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editQuestionImageUrl}
                    onChange={(e) => setEditQuestionImageUrl(e.target.value)}
                    placeholder="Image URL or choose file from device..."
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 font-bold text-violet-700 dark:text-violet-300 text-xs flex items-center gap-1.5 cursor-pointer shrink-0 border border-violet-200 dark:border-violet-800 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'question');
                      }}
                    />
                  </label>
                </div>
                {editQuestionImageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <img src={editQuestionImageUrl} alt="Preview" className="h-16 border rounded-lg bg-white object-contain p-1" />
                    <button type="button" onClick={() => setEditQuestionImageUrl('')} className="text-red-500 hover:text-red-700 font-bold text-xs">Remove Image</button>
                  </div>
                )}
              </div>

              {/* All 4 Options (Bilingual Text + Correct Option Radio + Figures) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                    <span>Options &amp; Correct Answer Key</span>
                    <span className="text-[11px] font-normal text-slate-500">(Click radio button to set correct answer)</span>
                  </label>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4].map((optNum) => {
                    const optIndex = optNum - 1;
                    const optData = editOptionsList[optIndex] || { id: optNum, text_en: '', text_hi: '' };
                    const isCorrect = editCorrectOption === optNum;
                    const optKey = String(optNum);
                    const optImg = editOptionImages[optKey] || optData.imageUrl || '';

                    return (
                      <div
                        key={optNum}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-400'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2.5 cursor-pointer font-extrabold">
                            <input
                              type="radio"
                              name="correctOptionRadio"
                              checked={isCorrect}
                              onChange={() => setEditCorrectOption(optNum)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className={`px-2 py-0.5 rounded-md text-xs font-black ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                              Option {optNum} ({['A', 'B', 'C', 'D'][optIndex]})
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                ✓ Correct Answer Key
                              </span>
                            )}
                          </label>

                          {/* Figure upload button */}
                          <label className="text-violet-600 hover:text-violet-700 dark:text-violet-400 cursor-pointer flex items-center gap-1 text-[11px] font-bold">
                            <Upload className="w-3 h-3" />
                            <span>{optImg ? 'Change Figure' : 'Upload Figure'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadImage(file, `opt${optNum}` as any);
                              }}
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={optData.text_en}
                            onChange={(e) => {
                              const updated = [...editOptionsList];
                              if (!updated[optIndex]) updated[optIndex] = { id: optNum, text_en: '', text_hi: '' };
                              updated[optIndex].text_en = e.target.value;
                              setEditOptionsList(updated);
                            }}
                            placeholder={`Option ${optNum} (English)`}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                          />
                          <input
                            type="text"
                            value={optData.text_hi}
                            onChange={(e) => {
                              const updated = [...editOptionsList];
                              if (!updated[optIndex]) updated[optIndex] = { id: optNum, text_en: '', text_hi: '' };
                              updated[optIndex].text_hi = e.target.value;
                              setEditOptionsList(updated);
                            }}
                            placeholder={`विकल्प ${optNum} (हिंदी)`}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                          />
                        </div>

                        {optImg && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={optImg} alt={`Option ${optNum}`} className="h-10 border rounded bg-white object-contain p-1" />
                            <button
                              type="button"
                              onClick={() => {
                                const copy = { ...editOptionImages };
                                delete copy[optKey];
                                setEditOptionImages(copy);
                              }}
                              className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                            >
                              Remove Figure
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step-by-Step Explanation in English & Hindi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Step-by-Step Explanation (English)
                  </label>
                  <textarea
                    value={editExplanation}
                    onChange={(e) => setEditExplanation(e.target.value)}
                    placeholder="Enter mathematical proof, grammar rule, or fact explanation in English..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Step-by-Step Explanation (हिंदी)
                  </label>
                  <textarea
                    value={editExplanationHi}
                    onChange={(e) => setEditExplanationHi(e.target.value)}
                    placeholder="हिंदी में विस्तृत हल एवं स्पष्टीकरण दर्ज करें..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
              <span className="text-[11px] text-slate-500">
                Fixes update Supabase database and local test caches immediately.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionFix}
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEdit ? 'Saving Fix...' : 'Save & Resolve Error'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
