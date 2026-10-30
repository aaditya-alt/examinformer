'use client';

import React, { useState, useEffect, use, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CBTTest, CBTQuestion } from '@/lib/testService';
import { MathRenderer } from '@/components/MathRenderer';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  Maximize2,
  Minimize2,
  FileText,
  User,
  ShieldCheck,
  Check,
  LogIn,
  Award,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  BarChart2
} from 'lucide-react';

function EduquityCBTContent({ testId }: { testId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSolutionMode = searchParams.get('mode') === 'solution';

  const { user, openAuthModal } = useAuth();

  const [test, setTest] = useState<CBTTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active navigation state
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Solution Mode Specific States
  // Reattempt mode defaults to ON when viewing solutions so user can re-try without spoilers,
  // or can be switched OFF to immediately see correct answers & full explanations.
  const [reattemptMode, setReattemptMode] = useState<boolean>(false);
  const [testResultCache, setTestResultCache] = useState<any>(null);
  const [reattemptChoices, setReattemptChoices] = useState<Record<number, number>>({});
  const [revealedPerQuestion, setRevealedPerQuestion] = useState<Record<number, boolean>>({});

  // Question response state for Exam Mode
  const [userResponses, setUserResponses] = useState<Record<number, {
    chosenOption?: number;
    status: 'answered' | 'not_answered' | 'marked' | 'marked_answered' | 'not_visited';
    timeSpentSec?: number;
  }>>({});

  // Timers (Overall and Sectional)
  const [overallSecondsRemaining, setOverallSecondsRemaining] = useState<number>(3600);
  const [sectionSecondsRemaining, setSectionSecondsRemaining] = useState<number>(900);
  const [lockedSections, setLockedSections] = useState<Record<number, boolean>>({});

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [questionPaperModalOpen, setQuestionPaperModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sectionAlertMsg, setSectionAlertMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch test data and result cache if in solution mode
  useEffect(() => {
    if (isSolutionMode) {
      const cached = sessionStorage.getItem(`cbt_result_${testId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setTestResultCache(parsed);
          if (parsed.userResponses) {
            setUserResponses(parsed.userResponses);
          }
        } catch (e) {
          console.error('Failed to parse cached test result:', e);
        }
      }
    }

    fetch(`/api/tests/${testId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const t: CBTTest = json.data;
          setTest(t);
          setOverallSecondsRemaining(t.durationMinutes * 60);

          const secMins = t.sectionalTimingMinutes || (t.hasSectionalTiming ? Math.floor(t.durationMinutes / Math.max(1, t.sections.length)) : 15);
          setSectionSecondsRemaining(secMins * 60);

          if (!isSolutionMode) {
            const initialMap: Record<number, any> = {};
            let qCounter = 1;
            t.sections.forEach((sec) => {
              sec.questions.forEach((q) => {
                initialMap[q.qno || qCounter] = {
                  chosenOption: undefined,
                  status: qCounter === 1 ? 'not_answered' : 'not_visited',
                  timeSpentSec: 0
                };
                qCounter++;
              });
            });
            setUserResponses(initialMap);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [testId, isSolutionMode]);

  // 2. Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 3. Overall Timer countdown (Only in Exam Mode)
  useEffect(() => {
    if (isSolutionMode || !user || !test || overallSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setOverallSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSolutionMode, user, test, overallSecondsRemaining]);

  // 4. Sectional Timer countdown (Only in Exam Mode)
  useEffect(() => {
    if (isSolutionMode || !user || !test || !test.hasSectionalTiming || sectionSecondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSectionSecondsRemaining(prev => {
        if (prev <= 1) {
          handleSectionTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSolutionMode, user, test, sectionSecondsRemaining, activeSectionIdx]);

  const handleSectionTimeExpired = () => {
    if (!test) return;
    setLockedSections(prev => ({ ...prev, [activeSectionIdx]: true }));

    if (activeSectionIdx < test.sections.length - 1) {
      const nextIdx = activeSectionIdx + 1;
      setActiveSectionIdx(nextIdx);
      setActiveQuestionIdx(0);

      const secMins = test.sectionalTimingMinutes || 15;
      setSectionSecondsRemaining(secMins * 60);

      setSectionAlertMsg(`Time expired for ${test.sections[activeSectionIdx].name}! Auto-advanced to next section under official SSC CBT guidelines.`);
      setTimeout(() => setSectionAlertMsg(null), 5000);
    } else {
      handleSubmitTest();
    }
  };

  const formatTimeEduquity = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-white z-50">
        <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <h2 className="text-base font-bold">Initializing Eduquity Assessment Hall...</h2>
        <p className="text-xs text-slate-400 mt-1">Validating candidate station &amp; loading encrypted question paper</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-white z-50 p-4 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold">Test Paper Not Available</h2>
        <p className="text-xs text-slate-400 mt-1">The requested CBT mock test was not found.</p>
        <button
          onClick={() => router.push('/tests')}
          className="mt-5 px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  // Auth Gate only for taking test (not required for previewing solutions if cached)
  if (!user && !isSolutionMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a1120] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#111e38] border border-slate-700/80 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800">
              Official Assessment Authentication
            </span>
            <h2 className="text-2xl font-black text-white pt-2">
              Candidate Login Required
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              To attempt <strong>{test.title}</strong>, calculate your All-India Rank, and save your comprehensive question-by-question analysis, please sign in to your candidate account.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1527] border border-slate-800 text-left space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Test Pattern:</span>
              <strong className="text-white">{test.examFamily.toUpperCase()} CBT (Eduquity Format)</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Total Questions:</span>
              <strong className="text-white">{test.totalQuestions} Questions</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Duration:</span>
              <strong className="text-white">{test.durationMinutes} Minutes</strong>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => openAuthModal('Sign in or register to begin this official examination.')}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register to Start Test</span>
            </button>

            <button
              onClick={() => router.push('/tests')}
              className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel and Back to Mocks
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active section & question pointers
  const currentSection = test.sections[activeSectionIdx] || test.sections[0];
  const currentQuestion = currentSection.questions[activeQuestionIdx] || currentSection.questions[0];
  const qno = currentQuestion.qno;
  const currentResponse = userResponses[qno] || { status: 'not_visited' };

  // Option selection handlers
  const handleSelectOption = (optId: number) => {
    if (isSolutionMode) {
      if (reattemptMode) {
        setReattemptChoices(prev => ({ ...prev, [qno]: optId }));
      }
      return;
    }
    setUserResponses(prev => ({
      ...prev,
      [qno]: {
        ...prev[qno],
        chosenOption: optId,
        status: 'answered'
      }
    }));
  };

  const handleClearResponse = () => {
    if (isSolutionMode) {
      if (reattemptMode) {
        setReattemptChoices(prev => {
          const next = { ...prev };
          delete next[qno];
          return next;
        });
      }
      return;
    }
    setUserResponses(prev => ({
      ...prev,
      [qno]: {
        ...prev[qno],
        chosenOption: undefined,
        status: 'not_answered'
      }
    }));
  };

  const handleSaveAndNext = () => {
    const hasChosen = userResponses[qno]?.chosenOption !== undefined;
    setUserResponses(prev => ({
      ...prev,
      [qno]: {
        ...prev[qno],
        status: hasChosen ? 'answered' : 'not_answered'
      }
    }));
    goToNextQuestion();
  };

  const handleMarkForReviewAndNext = () => {
    const hasChosen = userResponses[qno]?.chosenOption !== undefined;
    setUserResponses(prev => ({
      ...prev,
      [qno]: {
        ...prev[qno],
        status: hasChosen ? 'marked_answered' : 'marked'
      }
    }));
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (activeQuestionIdx < currentSection.questions.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else if (activeSectionIdx < test.sections.length - 1) {
      if (!test.hasSectionalTiming || !lockedSections[activeSectionIdx + 1] || isSolutionMode) {
        setActiveSectionIdx(activeSectionIdx + 1);
        setActiveQuestionIdx(0);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (activeSectionIdx > 0 && (!test.hasSectionalTiming || !lockedSections[activeSectionIdx - 1] || isSolutionMode)) {
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQuestionIdx(test.sections[activeSectionIdx - 1].questions.length - 1);
    }
  };

  const handlePaletteClick = (secIdx: number, qIdx: number, targetQno: number) => {
    if (!isSolutionMode && test.hasSectionalTiming && lockedSections[secIdx]) {
      alert('This section has expired and is locked under Eduquity SSC examination rules.');
      return;
    }
    setActiveSectionIdx(secIdx);
    setActiveQuestionIdx(qIdx);
    if (!isSolutionMode && (!userResponses[targetQno] || userResponses[targetQno].status === 'not_visited')) {
      setUserResponses(prev => ({
        ...prev,
        [targetQno]: { ...prev[targetQno], status: 'not_answered' }
      }));
    }
  };

  // Section cycle navigation
  const handlePrevSection = () => {
    if (activeSectionIdx > 0) {
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQuestionIdx(0);
    }
  };

  const handleNextSection = () => {
    if (activeSectionIdx < test.sections.length - 1) {
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQuestionIdx(0);
    }
  };

  // Counts for Palette and Analysis
  const allResponses = Object.values(userResponses);
  const countAnswered = allResponses.filter(r => r.status === 'answered').length;
  const countNotAnswered = allResponses.filter(r => r.status === 'not_answered').length;
  const countMarked = allResponses.filter(r => r.status === 'marked').length;
  const countMarkedAnswered = allResponses.filter(r => r.status === 'marked_answered').length;

  // Active section counts for Eduquity "PART Analysis" box
  const sectionQuestions = currentSection.questions;
  const secAnswered = sectionQuestions.filter(q => {
    const r = userResponses[q.qno];
    return r && (r.status === 'answered' || r.status === 'marked_answered');
  }).length;
  const secNotAnswered = sectionQuestions.length - secAnswered;

  // Solution evaluation counts for active section
  const secCorrect = sectionQuestions.filter(q => userResponses[q.qno]?.chosenOption === q.correctOption).length;
  const secWrong = sectionQuestions.filter(q => {
    const r = userResponses[q.qno];
    return r && r.chosenOption !== undefined && r.chosenOption !== q.correctOption;
  }).length;
  const secSkipped = sectionQuestions.length - secCorrect - secWrong;

  // Submit test and persist to Supabase & session
  const handleSubmitTest = async () => {
    setSubmitting(true);

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let attemptedCount = 0;

    test.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const resp = userResponses[q.qno];
        if (resp && resp.chosenOption !== undefined) {
          attemptedCount++;
          if (resp.chosenOption === q.correctOption) {
            correctCount++;
            score += q.marks;
          } else {
            wrongCount++;
            score -= q.negativeMarks;
          }
        }
      });
    });

    const timeTaken = test.durationMinutes * 60 - overallSecondsRemaining;
    const finalScore = Math.round(score * 100) / 100;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 1000) / 10 : 0;

    const resultPayload = {
      testId: test.id,
      testTitle: test.title,
      totalQuestions: test.totalQuestions,
      totalMarks: test.totalMarks,
      attempted: attemptedCount,
      correct: correctCount,
      wrong: wrongCount,
      skipped: test.totalQuestions - attemptedCount,
      finalScore,
      accuracyPercentage: accuracy,
      timeTakenSeconds: timeTaken,
      userResponses,
      candidateName: user?.name || 'Aspirant',
      rollNumber: user?.rollNumber || '2402094182'
    };

    if (supabase && user) {
      try {
        await supabase.from('test_attempts').insert({
          test_id: test.id,
          user_id: user.id,
          candidate_name: user.name,
          total_score: finalScore,
          accuracy: accuracy,
          time_taken_seconds: timeTaken,
          responses: userResponses
        });
      } catch (err) {
        console.warn('Could not persist attempt to Supabase:', err);
      }
    }

    sessionStorage.setItem(`cbt_result_${test.id}`, JSON.stringify(resultPayload));
    router.push(`/tests/${test.id}/result`);
  };

  // Determine if this question's solution is currently revealed
  // When reattemptMode is OFF, all solutions are shown.
  // When reattemptMode is ON, individual questions can be revealed on demand.
  const isQuestionSolutionVisible = !reattemptMode || revealedPerQuestion[qno];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen flex flex-col select-none overflow-hidden bg-white text-slate-900 font-sans"
    >
      {/* ── 1. TOP HEADER (Matching the uploaded Eduquity CBT Screenshot) ── */}
      <header className="h-14 px-3 sm:px-6 bg-[#f8fafc] border-b border-slate-300 flex items-center justify-between shrink-0 shadow-sm">
        {/* Brand & Test Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Authentic SSC / RRB official SVG Emblem */}
            <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
              <img
                src={test.examFamily === 'rrb' ? '/rrb-logo.svg' : '/ssc-logo.svg'}
                alt={test.examFamily.toUpperCase()}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#0284c7] text-sm tracking-tight">
                  Exam Informer
                </span>
                <span className="text-[10px] uppercase font-bold text-white px-1.5 py-0.5 rounded bg-[#0284c7]">
                  {test.examFamily.toUpperCase()} Eduquity
                </span>
                {isSolutionMode && (
                  <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 border border-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Solution Terminal
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-700 truncate max-w-xs sm:max-w-md md:max-w-xl">
                {test.title}
              </div>
            </div>
          </div>
        </div>

        {/* Center Timer / Terminal Status */}
        {!isSolutionMode ? (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Time Left</span>
            <div className="px-3 py-1 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-sm text-slate-800 tracking-wider shadow-inner">
              {formatTimeEduquity(overallSecondsRemaining)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Reattempt Mode Toggle (As requested by user!) */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1 rounded-full shadow-inner">
              <span className="text-xs font-bold text-slate-700">Reattempt Mode:</span>
              <button
                type="button"
                onClick={() => setReattemptMode(!reattemptMode)}
                className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reattemptMode ? 'bg-[#0284c7]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    reattemptMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-black ${reattemptMode ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                {reattemptMode ? 'ON (Hidden)' : 'OFF (Answers Shown)'}
              </span>
            </div>
          </div>
        )}

        {/* Top Right Action & Info Widgets */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isSolutionMode && (
            <div className="hidden lg:flex flex-col items-end leading-tight text-right mr-1">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <span>Total Questions Answered:</span>
                <span className="bg-amber-300 text-slate-950 font-black px-1.5 py-0.2 rounded text-[11px]">
                  {countAnswered + countMarkedAnswered}
                </span>
              </div>
              <div className="text-xs font-black text-rose-600">
                Last {Math.floor(overallSecondsRemaining / 60)} Minutes
              </div>
            </div>
          )}

          {isSolutionMode ? (
            <Link
              href={`/tests/${testId}/result`}
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Scorecard</span>
            </Link>
          ) : (
            <button
              onClick={() => alert('Assessment paused temporarily under standard examination rules.')}
              className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
            >
              Pause
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Switch Full Screen</span>
          </button>
        </div>
      </header>

      {sectionAlertMsg && (
        <div className="bg-amber-400 text-slate-950 font-bold text-xs py-1.5 px-4 text-center shadow-md animate-pulse">
          {sectionAlertMsg}
        </div>
      )}

      {/* ── 2. MAIN WORKSPACE: Question Area (LEFT) vs Eduquity Palette (RIGHT) ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ── LEFT PANE: Question Area & Controls ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-300">
          {/* Question Subheader & Blue Action Buttons (Exactly like screenshot) */}
          <div className="px-4 sm:px-6 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Question No. and Action Buttons */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-base text-slate-900">
                Question No. {qno}
              </span>

              {/* Eduquity Blue Action Buttons in Header Line */}
              {!isSolutionMode ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkForReviewAndNext}
                    className="px-3.5 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    Mark for Review &amp; Next
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="px-3.5 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    Save &amp; Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitModalOpen(true)}
                    className="px-3.5 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    Submit Test
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPrevQuestion}
                    className="px-3 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    className="px-3 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {reattemptMode && (
                    <button
                      type="button"
                      onClick={() => setRevealedPerQuestion(prev => ({ ...prev, [qno]: !prev[qno] }))}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                    >
                      {revealedPerQuestion[qno] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{revealedPerQuestion[qno] ? 'Hide Solution' : 'Check Solution'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Language Selection & Report */}
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <span>Select Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
                  className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white text-slate-800 font-medium focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => alert('Question feedback noted for the examination review committee.')}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Question Directions, Text & Options (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            {/* Question Text */}
            <div className="text-sm sm:text-base font-normal text-slate-900 leading-relaxed max-w-4xl">
              <MathRenderer
                content={
                  language === 'hi' && currentQuestion.questionTextHi
                    ? currentQuestion.questionTextHi
                    : currentQuestion.questionText
                }
              />
            </div>

            {/* Question Images if any */}
            {currentQuestion.questionImages && currentQuestion.questionImages.length > 0 && (
              <div className="space-y-2">
                {currentQuestion.questionImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Diagram"
                    className="max-h-72 rounded border border-slate-300 bg-white p-2"
                  />
                ))}
              </div>
            )}

            {/* Options List with Clean Round Radio Buttons */}
            <div className="space-y-3 pt-2 max-w-3xl">
              {currentQuestion.options.map((opt) => {
                const optText = language === 'hi' && opt.textHi ? opt.textHi : opt.text;
                
                // Normal exam mode selection
                const isSelectedInExam = currentResponse.chosenOption === opt.id;
                
                // Reattempt mode selection
                const isSelectedInReattempt = reattemptChoices[qno] === opt.id;
                
                // In solution mode (when solution is visible)
                const isOfficialCorrect = isQuestionSolutionVisible && opt.id === currentQuestion.correctOption;
                const isUserAttempted = isQuestionSolutionVisible && currentResponse.chosenOption === opt.id;
                const isUserWrongChoice = isUserAttempted && !isOfficialCorrect;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      isOfficialCorrect
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30'
                        : isUserWrongChoice
                        ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-400/20'
                        : (isSelectedInExam || (reattemptMode && isSelectedInReattempt))
                        ? 'bg-sky-50 border-sky-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {/* Small Round Radio Button */}
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        isOfficialCorrect
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isUserWrongChoice
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : (isSelectedInExam || (reattemptMode && isSelectedInReattempt))
                          ? 'border-sky-600 bg-white'
                          : 'border-slate-400 bg-white'
                      }`}
                    >
                      {isOfficialCorrect ? (
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : isUserWrongChoice ? (
                        <X className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : (isSelectedInExam || (reattemptMode && isSelectedInReattempt)) ? (
                        <div className="w-2 h-2 rounded-full bg-sky-600" />
                      ) : null}
                    </div>

                    <div className="flex-1 flex items-start gap-2 text-sm text-slate-800 leading-normal">
                      <div className="flex-1">
                        <MathRenderer content={optText} />
                        {opt.imageUrl && (
                          <img src={opt.imageUrl} alt={`Option ${opt.id}`} className="mt-2 max-h-36 border rounded" />
                        )}
                      </div>

                      {/* Solution Badges */}
                      {isOfficialCorrect && (
                        <span className="ml-2 text-[11px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Correct Answer</span>
                        </span>
                      )}
                      {isUserWrongChoice && (
                        <span className="ml-2 text-[11px] font-black uppercase text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Your Attempt</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DETAILED SOLUTION BOX (Shown in Solution Mode when Reattempt is OFF or revealed) ── */}
            {isSolutionMode && isQuestionSolutionVisible && (
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 border-2 border-sky-200 shadow-sm space-y-4 max-w-4xl">
                <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Official Eduquity Detailed Solution &amp; Derivation
                      </h4>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Concept breakdown &bull; Exam Informer Shortcut &bull; Tier-1 CBT Speed Trick
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Marks:</span>
                    <span className="text-xs font-black text-emerald-600">+{currentQuestion.marks}</span>
                    <span className="text-xs font-black text-rose-500">-{currentQuestion.negativeMarks}</span>
                  </div>
                </div>

                {/* Mathematical Derivation & Concept Explanation */}
                <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed">
                  <MathRenderer
                    content={
                      currentQuestion.explanation ||
                      `**Official Solution:** Option (${currentQuestion.correctOption}) is the correct answer according to official answer key standards.`
                    }
                  />
                </div>

                {/* Community Benchmark Footer */}
                <div className="pt-3 border-t border-sky-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      Candidate Choice: {currentResponse.chosenOption ? `Option (${currentResponse.chosenOption})` : 'Unattempted'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold text-emerald-600">
                      Official Key: Option ({currentQuestion.correctOption})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Section: <strong>{currentSection.name}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer (Clear response & Prev/Next) */}
          {!isSolutionMode && (
            <div className="h-14 px-4 sm:px-6 bg-[#f8fafc] border-t border-slate-300 flex items-center justify-between shrink-0 gap-2">
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                Clear Response
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevQuestion}
                  className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-5 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs transition"
                >
                  Save &amp; Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANE: EDUQUITY QUESTION PALETTE (Exactly on the Right as requested by user!) ── */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 flex flex-col shrink-0 overflow-y-auto">
          {/* Top Links: SYMBOLS | INSTRUCTIONS */}
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-start gap-4 text-xs font-bold text-amber-700 uppercase tracking-wider shrink-0">
            <button
              onClick={() => alert('Eduquity Palette Symbols:\nGreen: Answered\nRed: Not Answered\nBlue: Not Visited\nPurple: Marked for Review')}
              className="hover:underline"
            >
              SYMBOLS
            </button>
            <button
              onClick={() => setInstructionsModalOpen(true)}
              className="hover:underline"
            >
              INSTRUCTIONS
            </button>
          </div>

          {/* Section Part Tabs: [PART-A] [PART-B] [PART-C] [PART-D] */}
          <div className="p-2 bg-[#f8fafc] border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0">
            {test.sections.map((sec, idx) => {
              const isActive = activeSectionIdx === idx;
              const partLabel = `PART-${String.fromCharCode(65 + idx)}`;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSectionIdx(idx);
                    setActiveQuestionIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-black transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[#15803d] text-white shadow-sm'
                      : 'bg-[#1d4ed8] text-white hover:bg-[#1e40af]'
                  }`}
                >
                  {partLabel}
                </button>
              );
            })}
          </div>

          {/* Active Section Name Header with Navigation Arrows */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handlePrevSection}
              disabled={activeSectionIdx === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs text-slate-800 truncate px-2 text-center">
              {currentSection.name}
            </span>
            <button
              type="button"
              onClick={handleNextSection}
              disabled={activeSectionIdx === test.sections.length - 1}
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Question Number Palette Grid (1..25) */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {currentSection.questions.map((q, idx) => {
                const targetQno = q.qno;
                const resp = userResponses[targetQno];
                const status = resp?.status || 'not_visited';
                const isCurrent = activeQuestionIdx === idx;

                let bgClass = 'bg-[#1d4ed8] text-white'; // Default Eduquity blue for unvisited

                if (isSolutionMode) {
                  // Solution Mode Palette coloring based on correctness
                  if (resp && resp.chosenOption !== undefined) {
                    if (resp.chosenOption === q.correctOption) {
                      bgClass = 'bg-[#15803d] text-white'; // Green for correct
                    } else {
                      bgClass = 'bg-[#dc2626] text-white'; // Red for wrong
                    }
                  } else {
                    bgClass = 'bg-slate-300 text-slate-700'; // Gray for unattempted
                  }
                } else {
                  // Exam Mode Palette coloring
                  if (status === 'answered') bgClass = 'bg-[#15803d] text-white';
                  else if (status === 'not_answered') bgClass = 'bg-[#dc2626] text-white';
                  else if (status === 'marked' || status === 'marked_answered') bgClass = 'bg-[#8b5cf6] text-white';
                  else bgClass = 'bg-[#1d4ed8] text-white';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handlePaletteClick(activeSectionIdx, idx, targetQno)}
                    className={`relative h-9 rounded font-bold text-xs flex items-center justify-center transition ${bgClass} ${
                      isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 scale-105 z-10 shadow' : ''
                    }`}
                  >
                    <span>{targetQno}</span>
                    {status === 'marked_answered' && !isSolutionMode && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Eduquity PART Analysis Mini-Box (Matching Screenshot Bottom) ── */}
          <div className="border-t border-slate-300 bg-[#f8fafc] shrink-0">
            <div className="bg-[#cbd5e1] text-slate-800 text-[11px] font-black uppercase text-center py-1 tracking-wider">
              {`PART-${String.fromCharCode(65 + activeSectionIdx)} Analysis`}
            </div>
            {!isSolutionMode ? (
              <div className="p-3 text-xs space-y-1.5 font-bold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Answered</span>
                  <span className="bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-[11px]">
                    {secAnswered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Not Answered</span>
                  <span className="bg-amber-300 text-slate-900 px-2 py-0.5 rounded text-[11px]">
                    {secNotAnswered}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-xs space-y-1.5 font-bold text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700">Correct</span>
                  <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                    {secCorrect}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-700">Incorrect</span>
                  <span className="bg-rose-100 border border-rose-300 text-rose-800 px-2 py-0.5 rounded text-[11px]">
                    {secWrong}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Unattempted</span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {secSkipped}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM BANNER (Matching the screenshot prompt bar) ── */}
      <footer className="h-9 bg-[#5c5b16] text-[#fef08a] px-4 flex items-center justify-center text-xs font-semibold shrink-0 tracking-wide">
        Give your suggestions and Comment if you have any faster approach in any question &bull; Exam Informer CBT Engine
      </footer>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                Final Exam Submission Summary
              </h3>
              <button onClick={() => setSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border">
                <div className="text-slate-500">Total Questions</div>
                <div className="text-lg font-black mt-0.5">{test.totalQuestions}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <div>Answered Questions</div>
                <div className="text-lg font-black mt-0.5">{countAnswered + countMarkedAnswered}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <div>Not Answered</div>
                <div className="text-lg font-black mt-0.5">{countNotAnswered}</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800">
                <div>Marked for Review</div>
                <div className="text-lg font-black mt-0.5">{countMarked + countMarkedAnswered}</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to end this examination? Once submitted, your answers will be evaluated and your detailed scorecard with community rank and answers will be rendered.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Resume Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitTest}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
              >
                {submitting ? 'Submitting & Evaluating...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INSTRUCTIONS MODAL ── */}
      {instructionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white border border-slate-200 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">
                Eduquity CBT Standard Examination Guidelines
              </h3>
              <button onClick={() => setInstructionsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <p><strong>1. Eduquity Assessment System:</strong> The server clock controls timing. The timer at the top indicates remaining total time.</p>
              <p><strong>2. Sectional Tabs:</strong> Click on PART-A, PART-B, PART-C, or PART-D to navigate between sections.</p>
              <p><strong>3. Choosing Options:</strong> Click on the small circular radio button to select an option. Click &quot;Clear Response&quot; to deselect.</p>
              <p><strong>4. Palette Legend:</strong> Green (Answered), Red (Not Answered), Blue (Not Visited), Purple (Marked for Review).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CBTTestInterfacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-white z-50">
          <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
          <h2 className="text-base font-bold">Initializing Eduquity Assessment Hall...</h2>
        </div>
      }
    >
      <EduquityCBTContent testId={id} />
    </Suspense>
  );
}
