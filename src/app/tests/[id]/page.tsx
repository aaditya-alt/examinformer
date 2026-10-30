'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CBTTest, CBTQuestion } from '@/lib/testService';
import { MathRenderer } from '@/components/MathRenderer';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  CheckCircle2,
  Bookmark,
  Languages,
  AlertTriangle,
  RotateCcw,
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
  Award
} from 'lucide-react';

export default function CBTTestInterfacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [test, setTest] = useState<CBTTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active navigation state
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Question response state
  const [userResponses, setUserResponses] = useState<Record<number, {
    chosenOption?: number;
    status: 'answered' | 'not_answered' | 'marked' | 'marked_answered' | 'not_visited';
    timeSpentSec?: number;
  }>>({});

  // Timers (Overall and Sectional)
  const [overallSecondsRemaining, setOverallSecondsRemaining] = useState<number>(3600);
  const [sectionSecondsRemaining, setSectionSecondsRemaining] = useState<number>(900); // 15 mins default
  const [lockedSections, setLockedSections] = useState<Record<number, boolean>>({});

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [questionPaperModalOpen, setQuestionPaperModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sectionAlertMsg, setSectionAlertMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch test
  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const t: CBTTest = json.data;
          setTest(t);
          setOverallSecondsRemaining(t.durationMinutes * 60);

          const secMins = t.sectionalTimingMinutes || (t.hasSectionalTiming ? Math.floor(t.durationMinutes / Math.max(1, t.sections.length)) : 15);
          setSectionSecondsRemaining(secMins * 60);

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
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  // 3. Overall Timer countdown
  useEffect(() => {
    if (!user || !test || overallSecondsRemaining <= 0) return;
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
  }, [user, test, overallSecondsRemaining]);

  // 4. Sectional Timer countdown (Eduquity SSC pattern)
  useEffect(() => {
    if (!user || !test || !test.hasSectionalTiming || sectionSecondsRemaining <= 0) return;

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
  }, [user, test, sectionSecondsRemaining, activeSectionIdx]);

  const handleSectionTimeExpired = () => {
    if (!test) return;
    setLockedSections(prev => ({ ...prev, [activeSectionIdx]: true }));

    if (activeSectionIdx < test.sections.length - 1) {
      const nextIdx = activeSectionIdx + 1;
      setActiveSectionIdx(nextIdx);
      setActiveQuestionIdx(0);

      const secMins = test.sectionalTimingMinutes || 15;
      setSectionSecondsRemaining(secMins * 60);

      setSectionAlertMsg(`Time expired for ${test.sections[activeSectionIdx].name}! Auto-advanced to next section.`);
      setTimeout(() => setSectionAlertMsg(null), 5000);
    } else {
      handleSubmitTest();
    }
  };

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // ── AUTH GATE: Candidate must be logged in to take the test ──
  if (!user) {
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
              className="text-xs text-slate-400 hover:text-white transition"
            >
              &larr; Return to Test Series
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEduquitySSC = test.examFamily === 'ssc';
  const currentSection = test.sections[activeSectionIdx] || test.sections[0];
  const currentQuestion: CBTQuestion = currentSection.questions[activeQuestionIdx] || currentSection.questions[0];
  const qno = currentQuestion?.qno || 1;
  const currentResponse = userResponses[qno] || { status: 'not_answered' };

  // Option select handler - ONLY called when clicking the small radio circle
  const handleSelectOption = (optId: number) => {
    setUserResponses(prev => ({
      ...prev,
      [qno]: {
        ...prev[qno],
        chosenOption: optId,
        status: prev[qno]?.status === 'marked' ? 'marked_answered' : 'answered'
      }
    }));
  };

  // Clear Response
  const handleClearResponse = () => {
    setUserResponses(prev => ({
      ...prev,
      [qno]: {
        ...prev[qno],
        chosenOption: undefined,
        status: 'not_answered'
      }
    }));
  };

  // Save & Next
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

  // Mark for Review & Next
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
      if (!test.hasSectionalTiming || !lockedSections[activeSectionIdx + 1]) {
        setActiveSectionIdx(activeSectionIdx + 1);
        setActiveQuestionIdx(0);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (activeSectionIdx > 0 && (!test.hasSectionalTiming || !lockedSections[activeSectionIdx - 1])) {
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQuestionIdx(test.sections[activeSectionIdx - 1].questions.length - 1);
    }
  };

  const handlePaletteClick = (secIdx: number, qIdx: number, targetQno: number) => {
    if (test.hasSectionalTiming && lockedSections[secIdx]) {
      alert('This section has expired and is locked under Eduquity SSC examination rules.');
      return;
    }
    setActiveSectionIdx(secIdx);
    setActiveQuestionIdx(qIdx);
    if (!userResponses[targetQno] || userResponses[targetQno].status === 'not_visited') {
      setUserResponses(prev => ({
        ...prev,
        [targetQno]: { ...prev[targetQno], status: 'not_answered' }
      }));
    }
  };

  // Palette Status counts
  const allResponses = Object.values(userResponses);
  const countAnswered = allResponses.filter(r => r.status === 'answered').length;
  const countNotAnswered = allResponses.filter(r => r.status === 'not_answered').length;
  const countMarked = allResponses.filter(r => r.status === 'marked').length;
  const countMarkedAnswered = allResponses.filter(r => r.status === 'marked_answered').length;
  const countNotVisited = Math.max(0, test.totalQuestions - countAnswered - countNotAnswered - countMarked - countMarkedAnswered);

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
      candidateName: user.name,
      rollNumber: user.rollNumber
    };

    // Store in Supabase test_attempts table if client available
    if (supabase) {
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

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] w-screen h-screen flex flex-col select-none overflow-hidden ${
        isEduquitySSC
          ? 'bg-[#f4f7f6] dark:bg-[#07131e] text-slate-900 dark:text-slate-100 font-sans'
          : 'bg-[#f3f4f6] dark:bg-[#070b14] text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* ── TOP HEADER (Eduquity Official Banner for SSC / TCS for others) ── */}
      <header
        className={`h-14 px-3 sm:px-5 flex items-center justify-between shrink-0 text-white ${
          isEduquitySSC
            ? 'bg-[#0f2c4a] border-b border-[#1b436c]'
            : 'bg-[#1e293b] border-b border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow ${
                isEduquitySSC ? 'bg-sky-500 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {isEduquitySSC ? 'EQ' : 'EI'}
            </div>
            <div className="hidden sm:block">
              <div className="text-[11px] font-black tracking-wider uppercase text-sky-300">
                {isEduquitySSC ? 'Eduquity Assessment Engine • SSC Official Terminal' : 'Exam Informer • CBT Console'}
              </div>
              <div className="text-[11px] text-slate-200 font-medium truncate max-w-sm md:max-w-md">
                {test.title}
              </div>
            </div>
          </div>
        </div>

        {/* Timers & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {test.hasSectionalTiming && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Section: {formatTime(sectionSecondsRemaining)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-black font-mono tracking-wider">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Total: {formatTime(overallSecondsRemaining)}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                language === 'en' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                language === 'hi' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded-lg bg-black/20 text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {sectionAlertMsg && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-4 text-center shadow-md animate-bounce">
          {sectionAlertMsg}
        </div>
      )}

      {/* ── EDUQUITY SECTION TABS BAR ── */}
      <div className="h-10 bg-white dark:bg-[#0c1a29] border-b border-slate-200 dark:border-[#172c44] px-3 flex items-center justify-between overflow-x-auto shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Sections:
          </span>
          {test.sections.map((sec, idx) => {
            const isLocked = test.hasSectionalTiming && lockedSections[idx];
            const isActive = activeSectionIdx === idx;
            return (
              <button
                key={sec.id}
                disabled={isLocked}
                onClick={() => {
                  if (!isLocked) {
                    setActiveSectionIdx(idx);
                    setActiveQuestionIdx(0);
                  }
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isLocked
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed line-through'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{sec.name}</span>
                <span className="text-[10px] opacity-80">({sec.questions.length})</span>
                {isLocked && <span className="text-[9px] uppercase px-1 rounded bg-rose-500 text-white">Locked</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setInstructionsModalOpen(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instructions</span>
          </button>
          <button
            onClick={() => setQuestionPaperModalOpen(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Question Paper</span>
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: QUESTION AREA vs EDUQUITY PALETTE ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT / CENTER: Question Pane */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0c1825] overflow-hidden border-r border-slate-200 dark:border-[#172c44]">
          {/* Question Subheader */}
          <div className="h-10 px-4 sm:px-6 bg-slate-50 dark:bg-[#0e2133] border-b border-slate-200 dark:border-[#172c44] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                Question No. {qno}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                — {currentSection.name}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Marks: <span className="text-emerald-600 font-bold">+{currentQuestion.marks}</span> / <span className="text-rose-500 font-bold">-{currentQuestion.negativeMarks}</span>
            </div>
          </div>

          {/* Question Content & Options (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed max-w-4xl">
              <MathRenderer
                content={
                  language === 'hi' && currentQuestion.questionTextHi
                    ? currentQuestion.questionTextHi
                    : currentQuestion.questionText
                }
              />
            </div>

            {currentQuestion.questionImages && currentQuestion.questionImages.length > 0 && (
              <div className="space-y-2">
                {currentQuestion.questionImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Diagram"
                    className="max-h-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2"
                  />
                ))}
              </div>
            )}

            {/* Options List */}
            <div className="space-y-3 pt-3 max-w-3xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Click on the small radio circle to select your answer:
              </div>
              {currentQuestion.options.map((opt) => {
                const isSelected = currentResponse.chosenOption === opt.id;
                const optText = language === 'hi' && opt.textHi ? opt.textHi : opt.text;

                return (
                  <div
                    key={opt.id}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/30'
                        : 'bg-white dark:bg-[#0f1f2e] border-slate-200 dark:border-[#172c44] hover:bg-slate-50 dark:hover:bg-[#132638]'
                    }`}
                  >
                    {/* Small Round Radio Button — ONLY clicking this selects the option! */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      aria-label={`Select option ${opt.id}`}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-600 bg-white ring-2 ring-sky-500/20'
                          : 'border-slate-400 dark:border-slate-500 hover:border-sky-500 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      )}
                    </button>

                    <div className="flex-1 flex items-start gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 leading-normal">
                      <span className="font-bold text-xs text-slate-400 mt-0.5">({opt.id})</span>
                      <div className="flex-1">
                        <MathRenderer content={optText} />
                        {opt.imageUrl && (
                          <img src={opt.imageUrl} alt={`Option ${opt.id}`} className="mt-2 max-h-36 border rounded" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eduquity Bottom Action Toolbar */}
          <div className="h-16 px-4 sm:px-6 bg-slate-50 dark:bg-[#0e2133] border-t border-slate-200 dark:border-[#172c44] flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-3.5 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs transition"
              >
                Mark for Review &amp; Next
              </button>
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevQuestion}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-sm transition"
              >
                Save &amp; Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Eduquity Candidate Profile & Question Palette */}
        <div className="w-full lg:w-80 xl:w-96 bg-[#f8fafc] dark:bg-[#07131e] border-t lg:border-t-0 flex flex-col shrink-0 overflow-y-auto">
          {/* Candidate Profile Widget */}
          <div className="p-4 bg-white dark:bg-[#0b1b2b] border-b border-slate-200 dark:border-[#172c44] flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-base shadow-inner">
              <User className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                Candidate: {user.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Roll: {user.rollNumber || '2402094182'} | System: C042
              </div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Eduquity CBT Active
              </div>
            </div>
          </div>

          {/* Palette Legend */}
          <div className="p-4 border-b border-slate-200 dark:border-[#172c44] bg-slate-50 dark:bg-[#091827] shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Eduquity Question Palette Legend
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#22c55e] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {countAnswered}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#ef4444] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {countNotAnswered}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#94a3b8] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {countNotVisited}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {countMarked}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">Marked Review</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="relative w-6 h-6 rounded bg-[#8b5cf6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  <span>{countMarkedAnswered}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22c55e] border border-white" />
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">Ans &amp; Marked for Review</span>
              </div>
            </div>
          </div>

          {/* Section Question Grid */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-3 flex items-center justify-between">
              <span>Section: {currentSection.name}</span>
              <span className="text-[11px] text-slate-500">{currentSection.questions.length} Questions</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
              {currentSection.questions.map((q, idx) => {
                const targetQno = q.qno;
                const resp = userResponses[targetQno];
                const status = resp?.status || 'not_visited';
                const isCurrent = activeQuestionIdx === idx;

                let bgClass = 'bg-[#94a3b8] text-white hover:opacity-90';
                if (status === 'answered') bgClass = 'bg-[#22c55e] text-white shadow-sm';
                else if (status === 'not_answered') bgClass = 'bg-[#ef4444] text-white shadow-sm';
                else if (status === 'marked') bgClass = 'bg-[#8b5cf6] text-white shadow-sm';
                else if (status === 'marked_answered') bgClass = 'bg-[#8b5cf6] text-white shadow-sm';

                return (
                  <button
                    key={q.id}
                    onClick={() => handlePaletteClick(activeSectionIdx, idx, targetQno)}
                    className={`relative h-9 rounded-md font-bold text-xs flex items-center justify-center transition ${bgClass} ${
                      isCurrent ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 z-10' : ''
                    }`}
                  >
                    <span>{targetQno}</span>
                    {status === 'marked_answered' && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#22c55e] border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Test Button */}
          <div className="p-4 bg-white dark:bg-[#0b1b2b] border-t border-slate-200 dark:border-[#172c44] shrink-0">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 transition active:scale-95"
            >
              Submit Examination
            </button>
          </div>
        </div>
      </div>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Final Exam Submission Summary
              </h3>
              <button onClick={() => setSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
                <div className="text-slate-400">Total Questions</div>
                <div className="text-lg font-black mt-0.5">{test.totalQuestions}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <div>Answered Questions</div>
                <div className="text-lg font-black mt-0.5">{countAnswered + countMarkedAnswered}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                <div>Not Answered</div>
                <div className="text-lg font-black mt-0.5">{countNotAnswered}</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                <div>Marked for Review</div>
                <div className="text-lg font-black mt-0.5">{countMarked + countMarkedAnswered}</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to end this examination? Once submitted, your answers will be evaluated and your detailed scorecard with community rank and answers will be rendered.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Resume Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitTest}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
              >
                {submitting ? 'Submitting & Analyzing...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTION PAPER VIEW MODAL ── */}
      {questionPaperModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Complete Question Paper Overview — {test.title}
              </h3>
              <button onClick={() => setQuestionPaperModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {test.sections.flatMap(s => s.questions).map(q => (
                <div key={q.id} className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-xs text-sky-600">Q{q.qno}. [{q.sectionName}]</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    <MathRenderer content={language === 'hi' && q.questionTextHi ? q.questionTextHi : q.questionText} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {q.options.map(opt => (
                      <div key={opt.id}>({opt.id}) <MathRenderer content={language === 'hi' && opt.textHi ? opt.textHi : opt.text} /></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INSTRUCTIONS MODAL ── */}
      {instructionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Eduquity CBT Standard Examination Guidelines
              </h3>
              <button onClick={() => setInstructionsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p><strong>1. Eduquity Assessment System:</strong> The server clock controls timing. The timer at top indicates remaining section and total time.</p>
              <p><strong>2. Sectional Timers:</strong> Under official SSC guidelines, sections have individual timers. Once time expires, the section locks automatically.</p>
              <p><strong>3. Choosing Options:</strong> Click on the small circular radio button to select an option. Click "Clear Response" to deselect.</p>
              <p><strong>4. Palette Legend:</strong> Green (Answered), Red (Not Answered), Purple (Marked for Review), Purple with Green Dot (Answered &amp; Marked for Review), Gray (Not Visited).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
