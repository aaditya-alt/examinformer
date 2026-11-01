'use client';

import React, { useState, useEffect, use, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { CBTTest, CBTQuestion } from '@/lib/types/cbt';
import { MathRenderer } from '@/components/MathRenderer';
import { PreTestInstructions } from '@/components/PreTestInstructions';
import { ReportQuestionModal } from '@/components/ReportQuestionModal';
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
  BarChart2,
  Pause,
  Play,
  Save,
  Menu,
  Lock
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
  const [sectionTimesRemaining, setSectionTimesRemaining] = useState<Record<number, number>>({ 0: 900, 1: 900, 2: 900, 3: 900 });
  const [lockedSections, setLockedSections] = useState<Record<number, boolean>>({});

  // Pre-test instructions step state (1: Overview & Checklist, 2: Symbols & Declaration, 'started': Test Hall)
  const [preTestStep, setPreTestStep] = useState<1 | 2 | 'started'>('started');

  // Pause & Resume States
  const [isPaused, setIsPaused] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [resumePromptOpen, setResumePromptOpen] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  // Responsive Mobile Palette Drawer State
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sectionAlertMsg, setSectionAlertMsg] = useState<string | null>(null);
  const [isQuestionBookmarked, setIsQuestionBookmarked] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Storage key for pause/resume state
  const pauseStorageKey = user ? `cbt_paused_session_${testId}_${user.id}` : `cbt_paused_session_${testId}_guest`;

  const isSectionalTimingApplicable = (testObj: CBTTest | null): boolean => {
    if (!testObj) return false;
    if (testObj.hasSectionalTiming === false) return false;
    const code = (testObj.examCode || '').toLowerCase();
    const id = (testObj.id || '').toLowerCase();
    const title = (testObj.title || '').toLowerCase();
    const family = (testObj.examFamily || '').toLowerCase();

    // All Railway / RRB exams (NTPC UG, NTPC Graduate, Group D, ALP, Section Controller) strictly have NO sectional timer!
    if (
      family === 'rrb' ||
      code.includes('rrb') ||
      id.includes('rrb') ||
      title.includes('rrb') ||
      title.includes('railway')
    ) {
      return false;
    }

    // SSC CGL Tier 1 & Tier 2, SSC CHSL Tier 1 & Tier 2, MTS, CPO, GD, and any sectional mock
    if (
      code.includes('cgl') ||
      code.includes('chsl') ||
      code.includes('tier1') ||
      code.includes('tier2') ||
      code.includes('tier-1') ||
      code.includes('tier-2') ||
      title.includes('cgl') ||
      title.includes('chsl') ||
      title.includes('tier 1') ||
      title.includes('tier 2') ||
      title.includes('tier-1') ||
      title.includes('tier-2') ||
      code.includes('mts') ||
      code.includes('cpo') ||
      code.includes('gd') ||
      id.startsWith('sec-') ||
      testObj.type === 'sectional'
    ) {
      return true;
    }
    // Any test that explicitly defines sectional timing
    return Boolean(testObj.hasSectionalTiming);
  };

  const getExamSectionTimingMinutes = (testObj: CBTTest | null, sIdx: number): number => {
    if (!testObj) return 15;
    const code = (testObj.examCode || '').toLowerCase();
    const id = (testObj.id || '').toLowerCase();
    const title = (testObj.title || '').toLowerCase();
    const secName = (testObj.sections?.[sIdx]?.name || '').toLowerCase();

    // SSC CGL Tier 2 / CHSL Tier 2 (Mains): 30m Math, 30m Reasoning, 40m English, 20m GK, 15m Computer
    if (
      code.includes('tier2') ||
      code.includes('tier-2') ||
      id.includes('tier2') ||
      id.includes('tier-2') ||
      title.includes('tier 2') ||
      title.includes('tier-2') ||
      title.includes('tier ii') ||
      title.includes('mains')
    ) {
      if (secName.includes('math') || secName.includes('numerical') || secName.includes('quant')) return 30;
      if (secName.includes('reason') || secName.includes('intelligence')) return 30;
      if (secName.includes('english') || secName.includes('comprehension') || secName.includes('language')) return 40;
      if (secName.includes('awareness') || secName.includes('gk') || secName.includes('ga') || secName.includes('general')) return 20;
      if (secName.includes('computer')) return 15;
      return 30;
    }

    // SSC CGL Tier 1 / CHSL Tier 1: 15 min each for all 4 sections
    if (
      code.includes('tier1') ||
      code.includes('tier-1') ||
      id.includes('tier1') ||
      id.includes('tier-1') ||
      title.includes('tier 1') ||
      title.includes('tier-1') ||
      title.includes('tier i') ||
      code.includes('cgl') ||
      code.includes('chsl')
    ) {
      return 15;
    }

    // SSC MTS: Session 1 (45m), Session 2 (45m)
    if (code.includes('mts') || title.includes('mts')) {
      return 45;
    }

    return testObj.sectionalTimingMinutes || 15;
  };

  // 1. Fetch test data and verify solution access or restore paused session
  useEffect(() => {
    if (isSolutionMode) {
      const cached = sessionStorage.getItem(`cbt_result_${testId}`) || localStorage.getItem(`cbt_result_${testId}`);
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
      } else {
        // Fallback: Fetch candidate attempt from database so solution always opens without error
        fetch(`/api/attempts?testId=${testId}&limit=1`)
          .then(res => res.json())
          .then(json => {
            if (json.success && json.attempts && json.attempts.length > 0) {
              const att = json.attempts[0];
              const parsed = {
                testId: att.test_id,
                finalScore: att.total_score,
                userResponses: att.responses || {}
              };
              setTestResultCache(parsed);
              if (att.responses) {
                setUserResponses(att.responses);
              }
            } else {
              setTestResultCache({ testId, userResponses: {} });
            }
          })
          .catch(() => {
            setTestResultCache({ testId, userResponses: {} });
          });
      }
    }

    // Pass candidate's already mastered questions to exclude from topic drills
    let fetchUrl = `/api/tests/${testId}`;
    if (testId.startsWith('topic-') || testId.startsWith('ch-')) {
      try {
        const mastery = JSON.parse(localStorage.getItem('mm_user_question_mastery') || '{}');
        const correctIds = Object.keys(mastery).filter((id: string) => mastery[id] === 'correct');
        if (correctIds.length > 0) {
          fetchUrl += `?excludeIds=${encodeURIComponent(correctIds.slice(-80).join(','))}`;
        }
      } catch (e) {}
    }

    fetch(fetchUrl)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const t: CBTTest = json.data;
          setTest(t);

          // Check if there is an existing paused session in localStorage
          if (!isSolutionMode) {
            const chosenLang = sessionStorage.getItem(`cbt_lang_${testId}`);
            if (chosenLang) {
              setLanguage(chosenLang as 'en' | 'hi');
            }

            const rawSaved = localStorage.getItem(pauseStorageKey);
            if (rawSaved) {
              try {
                const parsed = JSON.parse(rawSaved);
                if (parsed.testId === testId && parsed.overallSecondsRemaining > 10) {
                  setSavedSessionData(parsed);
                  setResumePromptOpen(true);
                  setOverallSecondsRemaining(parsed.overallSecondsRemaining);
                  if (parsed.sectionTimesRemaining) {
                    setSectionTimesRemaining(parsed.sectionTimesRemaining);
                  }
                  setActiveSectionIdx(parsed.activeSectionIdx || 0);
                  setActiveQuestionIdx(parsed.activeQuestionIdx || 0);
                  setUserResponses(parsed.userResponses || {});
                  setPreTestStep('started');
                  return;
                }
              } catch (err) {
                console.warn('Could not read saved paused session:', err);
              }
            }

            // Fresh session initialization: Show Pre-Test Instructions
            setPreTestStep(1);
            setOverallSecondsRemaining(t.durationMinutes * 60);
            const initialSecTimes: Record<number, number> = {};
            t.sections.forEach((_, sIdx) => {
              initialSecTimes[sIdx] = getExamSectionTimingMinutes(t, sIdx) * 60;
            });
            setSectionTimesRemaining(initialSecTimes);

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
  }, [testId, isSolutionMode, user?.id]);

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

  // 3. Official Server-Controlled Exam & Sectional Timer Countdown
  useEffect(() => {
    if (isSolutionMode || !test || isPaused || preTestStep !== 'started') return;

    const interval = setInterval(() => {
      // Decrement overall exam timer
      setOverallSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });

      // Decrement active section timer if sectional timing applies
      if (isSectionalTimingApplicable(test)) {
        setSectionTimesRemaining(prevMap => {
          const currentSecTime = prevMap[activeSectionIdx] ?? (getExamSectionTimingMinutes(test, activeSectionIdx) * 60);
          if (currentSecTime <= 1) {
            handleSectionTimeExpired();
            return { ...prevMap, [activeSectionIdx]: 0 };
          }
          return { ...prevMap, [activeSectionIdx]: currentSecTime - 1 };
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSolutionMode, test, isPaused, activeSectionIdx, preTestStep]);

  // 4. Bookmark sync with localStorage & candidate profile
  useEffect(() => {
    if (!test || !test.sections) return;
    const curSec = test.sections[activeSectionIdx] || test.sections[0];
    const curQ = curSec?.questions?.[activeQuestionIdx] || curSec?.questions?.[0];
    if (!curQ) return;
    const itemKey = curQ.id || `${testId}_${curQ.qno}`;
    try {
      const raw = localStorage.getItem('examinformer_saved_questions');
      if (raw) {
        const list = JSON.parse(raw);
        setIsQuestionBookmarked(list.some((item: any) => item.id === itemKey || item.questionId === itemKey));
      }
    } catch (e) {}
  }, [testId, activeSectionIdx, activeQuestionIdx, test]);

  const handleSectionTimeExpired = () => {
    if (!test) return;
    setLockedSections(prev => ({ ...prev, [activeSectionIdx]: true }));

    // Find next available section that is not locked
    const nextIdx = test.sections.findIndex((_, idx) => idx > activeSectionIdx && !lockedSections[idx]);

    if (nextIdx !== -1) {
      setActiveSectionIdx(nextIdx);
      setActiveQuestionIdx(0);
      setSectionAlertMsg(`Time expired for section "${test.sections[activeSectionIdx]?.name || 'Current Section'}". Eduquity has transitioned you to "${test.sections[nextIdx].name}".`);
      setTimeout(() => setSectionAlertMsg(null), 5000);
    } else {
      handleSubmitTest();
    }
  };

  const handleSubmitSection = () => {
    if (!test) return;
    const secName = test.sections[activeSectionIdx]?.name || `Section #${activeSectionIdx + 1}`;
    const confirmed = window.confirm(
      `Submit ${secName}?\n\nOnce submitted, this section will be locked and cannot be re-visited under official examination rules.`
    );
    if (!confirmed) return;

    setLockedSections(prev => ({ ...prev, [activeSectionIdx]: true }));

    const nextIdx = test.sections.findIndex((_, idx) => idx > activeSectionIdx && !lockedSections[idx]);

    if (nextIdx !== -1) {
      setActiveSectionIdx(nextIdx);
      setActiveQuestionIdx(0);
      setSectionAlertMsg(`Submitted "${secName}". Now in "${test.sections[nextIdx].name}".`);
      setTimeout(() => setSectionAlertMsg(null), 4000);
    } else {
      handleSubmitTest();
    }
  };

  // 5. PAUSE TEST FUNCTIONALITY (Saves progress so candidate can resume later)
  const handlePauseTest = () => {
    setIsPaused(true);
    setPauseModalOpen(true);

    const sessionState = {
      testId,
      userId: user?.id,
      savedAt: Date.now(),
      overallSecondsRemaining,
      sectionTimesRemaining,
      activeSectionIdx,
      activeQuestionIdx,
      userResponses
    };

    localStorage.setItem(pauseStorageKey, JSON.stringify(sessionState));
  };

  const handleResumeTest = () => {
    setIsPaused(false);
    setPauseModalOpen(false);
    setResumePromptOpen(false);
  };

  const handleSaveAndExit = () => {
    router.push('/tests');
  };

  const handleStartFresh = () => {
    localStorage.removeItem(pauseStorageKey);
    setResumePromptOpen(false);
    if (test) {
      setOverallSecondsRemaining(test.durationMinutes * 60);
      const initialSecTimes: Record<number, number> = {};
      test.sections.forEach((_, idx) => {
        initialSecTimes[idx] = getExamSectionTimingMinutes(test, idx) * 60;
      });
      setSectionTimesRemaining(initialSecTimes);
      setActiveSectionIdx(0);
      setActiveQuestionIdx(0);

      const initialMap: Record<number, any> = {};
      let qCounter = 1;
      test.sections.forEach((sec) => {
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
  };

  const formatTimeEduquity = (totalSec: number) => {
    if (typeof totalSec !== 'number' || isNaN(totalSec) || totalSec < 0) totalSec = 0;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Safe section & question pointers
  const currentSection = test?.sections?.[activeSectionIdx] || test?.sections?.[0];
  const sectionQuestions = currentSection?.questions || [];
  const currentQuestion = sectionQuestions[activeQuestionIdx] || sectionQuestions[0];
  const qno = currentQuestion?.qno || 1;
  const currentResponse = userResponses[qno] || { status: 'not_visited' };

  const toggleSaveQuestion = async () => {
    if (!currentQuestion) return;
    try {
      const raw = localStorage.getItem('examinformer_saved_questions');
      let list = raw ? JSON.parse(raw) : [];
      const itemKey = currentQuestion.id || `${testId}_${qno}`;
      const exists = list.some((item: any) => (item.id === itemKey || item.questionId === itemKey));

      const questionPayload = {
        id: itemKey,
        questionId: itemKey,
        testId,
        testTitle: test?.title,
        qno,
        questionText: currentQuestion.questionText,
        questionHindi: currentQuestion.questionTextHi,
        questionTextHi: currentQuestion.questionTextHi,
        options: currentQuestion.options,
        correctOption: currentQuestion.correctOption,
        explanation: currentQuestion.explanation,
        sectionName: currentSection?.name || 'General Section',
        examOrigin: currentQuestion.examOrigin || test?.title,
        savedAt: Date.now()
      };

      if (exists) {
        list = list.filter((item: any) => (item.id !== itemKey && item.questionId !== itemKey));
        setIsQuestionBookmarked(false);
        if (user?.id) {
          fetch(`/api/saved-questions?userId=${user.id}&questionId=${itemKey}`, { method: 'DELETE' }).catch(() => {});
        }
      } else {
        list.push(questionPayload);
        setIsQuestionBookmarked(true);
        if (user?.id) {
          fetch('/api/saved-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, question: questionPayload })
          }).catch(() => {});
        }
      }
      localStorage.setItem('examinformer_saved_questions', JSON.stringify(list));
    } catch (e) {}
  };

  // Option selection handlers
  const handleSelectOption = (optId: number) => {
    if (isSolutionMode) {
      if (reattemptMode) {
        setReattemptChoices(prev => ({ ...prev, [qno]: optId }));
        setRevealedPerQuestion(prev => ({ ...prev, [qno]: true }));
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
        setRevealedPerQuestion(prev => ({ ...prev, [qno]: false }));
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
    const curSecQs = currentSection?.questions || [];
    if (activeQuestionIdx < curSecQs.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else if (!isSectionalTimingApplicable(test) || isSolutionMode) {
      if (activeSectionIdx < (test?.sections?.length || 0) - 1) {
        if (!lockedSections[activeSectionIdx + 1] || isSolutionMode) {
          const nextIdx = activeSectionIdx + 1;
          setActiveSectionIdx(nextIdx);
          setActiveQuestionIdx(0);
        }
      }
    } else {
      // In sectional timing: candidate reached the end of current section and must submit section or wait for timer
      setSectionAlertMsg(`You have reached the last question of "${currentSection?.name || 'this section'}". Click "Submit Section" when ready to proceed to the next section.`);
      setTimeout(() => setSectionAlertMsg(null), 5000);
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (!isSectionalTimingApplicable(test) || isSolutionMode) {
      if (activeSectionIdx > 0 && (!lockedSections[activeSectionIdx - 1] || isSolutionMode)) {
        const prevIdx = activeSectionIdx - 1;
        setActiveSectionIdx(prevIdx);
        setActiveQuestionIdx((test?.sections?.[prevIdx]?.questions?.length || 1) - 1);
      }
    } else {
      // In sectional timing: candidate cannot go back to previous section
      setSectionAlertMsg(`You are on the first question of "${currentSection?.name || 'this section'}". Previous sections are locked under official exam rules.`);
      setTimeout(() => setSectionAlertMsg(null), 4000);
    }
  };

  const handlePaletteClick = (secIdx: number, qIdx: number, targetQno: number) => {
    if (!isSolutionMode && isSectionalTimingApplicable(test)) {
      if (secIdx < activeSectionIdx || lockedSections[secIdx]) {
        alert('This section has already been submitted and is locked under official examination rules. You cannot return to previous sections.');
        return;
      }
      if (secIdx > activeSectionIdx) {
        alert(`Under examination rules, you cannot proceed to "${test?.sections?.[secIdx]?.name || 'the next section'}" until you complete and submit the current section.`);
        return;
      }
    }

    if (!isSolutionMode && lockedSections[secIdx]) {
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
    // Close mobile palette automatically when question selected
    setMobilePaletteOpen(false);
  };

  // Section cycle navigation
  const handlePrevSection = () => {
    if (activeSectionIdx > 0) {
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQuestionIdx(0);
    }
  };

  const handleNextSection = () => {
    if (test && activeSectionIdx < test.sections.length - 1) {
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
    if (!test) return;
    setSubmitting(true);

    const isMts = test.examCode === 'ssc-mts' || test.id.toLowerCase().includes('mts');
    const isCglTier2 = (test.examCode || '').toLowerCase().includes('cgl-tier2') || ((test.id || '').toLowerCase().includes('cgl') && ((test.id || '').toLowerCase().includes('tier2') || (test.id || '').toLowerCase().includes('tier-2') || (test.title || '').toLowerCase().includes('tier 2') || (test.title || '').toLowerCase().includes('tier-2')));
    const isChslTier2 = (test.examCode || '').toLowerCase().includes('chsl-tier2') || ((test.id || '').toLowerCase().includes('chsl') && ((test.id || '').toLowerCase().includes('tier2') || (test.id || '').toLowerCase().includes('tier-2') || (test.title || '').toLowerCase().includes('tier 2') || (test.title || '').toLowerCase().includes('tier-2')));
    const isTier2SSC = isCglTier2 || isChslTier2;

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let attemptedCount = 0;

    let s1Score = 0;
    let s2Score = 0;
    let s1Attempted = 0;
    let s2Attempted = 0;

    let computerScore = 0;
    let computerAttempted = 0;
    let computerCorrect = 0;
    let computerWrong = 0;

    test.sections.forEach((sec, sIdx) => {
      // In MTS: Section 0 & 1 are Session 1 (Math & Reasoning). Section 2 & 3 are Session 2 (GA & English).
      const isMtsSession1 = isMts && (sIdx < 2 || sec.name.toLowerCase().includes('reasoning') || sec.name.toLowerCase().includes('numerical'));
      // In CGL & CHSL Tier-2: Computer Knowledge Module is purely qualifying in nature (does NOT count in merit total score!)
      const isComputerSec = isTier2SSC && sec.name.toLowerCase().includes('computer');
      
      sec.questions.forEach(q => {
        const resp = userResponses[q.qno];
        if (resp && resp.chosenOption !== undefined) {
          attemptedCount++;
          if (isComputerSec) computerAttempted++;
          else if (isMtsSession1) s1Attempted++;
          else s2Attempted++;

          if (resp.chosenOption === q.correctOption) {
            correctCount++;
            if (isComputerSec) {
              computerCorrect++;
              computerScore += (q.marks || 3.0);
            } else if (isMtsSession1) {
              s1Score += 3.0; // MTS Session 1 is 3 marks per Q, 0 negative
            } else {
              s2Score += (q.marks || 3.0);
              score += q.marks;
            }
          } else {
            wrongCount++;
            if (isComputerSec) {
              computerWrong++;
              computerScore -= (q.negativeMarks || 1.0);
            } else if (!isMtsSession1) {
              s2Score -= (q.negativeMarks || 1.0); // MTS Session 2 penalty
              score -= q.negativeMarks;
            }
            // In MTS Session 1, no negative marking!
          }
        }
      });
    });

    const timeTaken = test.durationMinutes * 60 - overallSecondsRemaining;
    const finalScore = isMts ? Math.round(s2Score * 100) / 100 : Math.round(score * 100) / 100;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 1000) / 10 : 0;
    const computerCutoff = isCglTier2 ? 18 : 13.5;
    const computerQualified = isTier2SSC ? computerScore >= computerCutoff : true;
    const maxMeritMarks = isMts ? 150 : (isCglTier2 ? 390 : (isChslTier2 ? 360 : test.totalMarks));

    // Save anti-repetition question mastery for adaptive topic drills
    try {
      const existingMastery = JSON.parse(localStorage.getItem('mm_user_question_mastery') || '{}');
      test.sections.forEach(sec => {
        sec.questions.forEach(q => {
          const resp = userResponses[q.qno];
          if (resp && resp.chosenOption !== undefined) {
            if (resp.chosenOption === q.correctOption) {
              existingMastery[q.id] = 'correct';
            } else {
              existingMastery[q.id] = 'wrong';
            }
          } else {
            existingMastery[q.id] = 'unattempted';
          }
        });
      });
      localStorage.setItem('mm_user_question_mastery', JSON.stringify(existingMastery));
    } catch (e) {}

    const resultPayload = {
      testId: test.id,
      testTitle: test.title,
      totalQuestions: test.totalQuestions,
      totalMarks: maxMeritMarks,
      isMts,
      isTier2SSC,
      isCglTier2,
      isChslTier2,
      computerScore: Math.round(computerScore * 100) / 100,
      computerQualified,
      computerMaxMarks: isCglTier2 ? 60 : 45,
      session1Score: Math.round(s1Score * 100) / 100,
      session2Score: Math.round(s2Score * 100) / 100,
      session1Qualified: s1Score >= 36, // MTS Session 1 qualifying threshold (30% for UR)
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

    // Persist complete examination attempt & question-level metrics directly into Supabase database
    try {
      const resp = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          userId: user?.id || `guest_${Date.now()}`,
          candidateName: user?.name || 'Aspirant',
          totalScore: finalScore,
          accuracy,
          timeTakenSeconds: timeTaken,
          responses: userResponses,
          sectionsBreakdown: {
            s1Score,
            s2Score,
            attempted: attemptedCount,
            correct: correctCount,
            wrong: wrongCount
          }
        })
      });
      const attemptRes = await resp.json();
      if (attemptRes.attemptId) {
        (resultPayload as any).attemptId = attemptRes.attemptId;
      }
    } catch (err) {
      console.warn('Could not persist attempt to Supabase via /api/attempts:', err);
    }

    // Clean up paused session from localStorage
    localStorage.removeItem(pauseStorageKey);

    sessionStorage.setItem(`cbt_result_${test.id}`, JSON.stringify(resultPayload));
    try {
      localStorage.setItem(`cbt_result_${test.id}`, JSON.stringify(resultPayload));
    } catch {}
    router.push(`/tests/${test.id}/result?attemptId=${(resultPayload as any).attemptId || ''}`);
  };

  // Only visible when in solution mode and (reattempt is OFF or revealed for this specific question)
  const isQuestionSolutionVisible = Boolean(isSolutionMode && (!reattemptMode || revealedPerQuestion[qno]));

  const totalAnsweredCount = Object.values(userResponses).filter(
    (r) => r.status === 'answered' || (r.status as string) === 'marked_answered'
  ).length;

  const currentSectionStats = {
    answered: sectionQuestions.filter(
      (q) => userResponses[q.qno]?.status === 'answered' || (userResponses[q.qno]?.status as string) === 'marked_answered'
    ).length,
    notAnswered: sectionQuestions.filter(
      (q) => userResponses[q.qno]?.status === 'not_answered'
    ).length,
    review: sectionQuestions.filter(
      (q) => userResponses[q.qno]?.status === 'marked' || (userResponses[q.qno]?.status as string) === 'marked_answered'
    ).length,
    notVisited: sectionQuestions.filter(
      (q) => !userResponses[q.qno] || userResponses[q.qno]?.status === 'not_visited'
    ).length
  };

  const candidatePhone = user?.phone || user?.rollNumber || 'CANDIDATE';

  const watermarkStyle = {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='130'><text x='30' y='70' fill='rgba(100,116,139,0.06)' font-size='16' font-family='sans-serif' font-weight='bold' transform='rotate(-22 120 65)'>${encodeURIComponent(candidatePhone)}</text></svg>")`,
    backgroundRepeat: 'repeat'
  };

  // ── CONDITIONAL DISPLAY SCREENS (ORDERED STRICTLY BELOW ALL HOOKS) ──

  // 1. Initial Assessment Hall Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-white z-50">
        <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <h2 className="text-base font-bold">Initializing Eduquity Assessment Hall...</h2>
        <p className="text-xs text-slate-400 mt-1">Validating candidate station &amp; loading encrypted question paper</p>
      </div>
    );
  }

  // 2. Test Paper Not Available
  if (!test || !test.sections || test.sections.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-white z-50 p-4 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold">Test Paper Not Available</h2>
        <p className="text-xs text-slate-400 mt-1">The requested CBT mock test was not found.</p>
        <button
          onClick={() => router.push('/tests')}
          className="mt-5 px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs cursor-pointer"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  // 3. Solutions Locked Screen (Enforce Rule 2: Unlocked only after submission)
  if (isSolutionMode && !testResultCache) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a1120] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#111e38] border border-slate-700/80 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800">
              Solutions Strictly Locked
            </span>
            <h2 className="text-2xl font-black text-white pt-2">
              Attempt Required First
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              To protect test integrity and simulate the real examination, answers and step-by-step solutions are <strong>only unlocked after you submit</strong> your test.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1527] border border-slate-800 text-left space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Test Title:</span>
              <strong className="text-white truncate max-w-[200px]">{test.title}</strong>
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
            <Link
              href={`/tests/${testId}`}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start &amp; Attempt Examination</span>
            </Link>

            <Link
              href="/tests"
              className="block w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Back to Tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Strict Candidate Enrollment Gate
  if (!user && !isSolutionMode) {
    return (
      <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Candidate Account Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Without an enrolled candidate account nobody can attempt CBT mock examinations. Please register with your Name, Email, Mobile Number and Password to proceed.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => openAuthModal('Account Required: Please register or sign in to start taking official CBT exams.')}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm btn-3d-primary cursor-pointer shadow-lg"
            >
              Enroll &amp; Access Test Hall
            </button>
            <button
              onClick={() => router.push('/tests')}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Back to Tests Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Question Assembler Guard
  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
        <HelpCircle className="w-12 h-12 text-amber-400 mb-3" />
        <h2 className="text-xl font-bold">Question Paper Being Assembled</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          The questions for this section are being compiled from official 2025 shift papers.
        </p>
        <Link
          href="/tests"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
        >
          Return to Test Series
        </Link>
      </div>
    );
  }

  // 6. Pre-Test Instructions Screen (Screenshots 1 & 2)
  if (!isSolutionMode && preTestStep !== 'started') {
    return (
      <PreTestInstructions
        test={test}
        language={language}
        onLanguageChange={(lang) => setLanguage(lang)}
        onStartTest={() => {
          setPreTestStep('started');
          setOverallSecondsRemaining(test.durationMinutes * 60);
          const initialSecTimes: Record<number, number> = {};
          test.sections.forEach((_, sIdx) => {
            initialSecTimes[sIdx] = getExamSectionTimingMinutes(test, sIdx) * 60;
          });
          setSectionTimesRemaining(initialSecTimes);
        }}
        onCancel={() => router.push('/tests')}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen flex flex-col select-none overflow-hidden bg-white text-slate-900 font-sans"
    >
      {/* ── 1. EDUQUITY OFFICIAL TOP HEADER ── */}
      <header className="h-12 px-3 sm:px-6 bg-[#f8fafc] border-b border-slate-300 flex items-center justify-between shrink-0 shadow-xs">
        {/* Left: Zoom Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.1, 1.4))}
            className="px-3 py-1 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs rounded transition active:scale-95 shadow-xs"
          >
            Zoom (+)
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.1, 0.8))}
            className="px-3 py-1 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs rounded transition active:scale-95 shadow-xs"
          >
            Zoom (-)
          </button>
        </div>

        {/* Center: Title */}
        <div className="text-center font-bold text-xs sm:text-sm text-slate-800 truncate max-w-xs sm:max-w-md md:max-w-lg px-2">
          {qno}) {currentSection?.name || test?.title} Practice
        </div>

        {/* Right: Fullscreen, Pause, Timer */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSolutionMode ? (
            <>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:inline-flex px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded shadow-xs transition"
              >
                Show Fullscreen
              </button>
              <button
                type="button"
                onClick={handlePauseTest}
                title="Pause Test"
                className="p-1 sm:px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded shadow-xs transition flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
              {/* Official Eduquity Yellow Timer Box */}
              <div className="bg-[#fffbeb] border border-[#fef08a] px-3 py-1 rounded text-center leading-none min-w-[105px] shadow-xs">
                <div className="text-[9px] sm:text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>{isSectionalTimingApplicable(test) ? 'Section Time Left' : 'Time Left'}</span>
                </div>
                <div className="text-base sm:text-lg font-black text-rose-600 font-mono tracking-wider mt-0.5">
                  {formatTimeEduquity(
                    isSectionalTimingApplicable(test)
                      ? (sectionTimesRemaining[activeSectionIdx] ?? (getExamSectionTimingMinutes(test, activeSectionIdx) * 60))
                      : overallSecondsRemaining
                  )}
                </div>
                {isSectionalTimingApplicable(test) && (
                  <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                    Exam Total: {formatTimeEduquity(overallSecondsRemaining)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReattemptMode(!reattemptMode)}
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                  reattemptMode
                    ? 'bg-amber-500 text-slate-950 border border-amber-400 font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
                title="Toggle spoiler-free reattempt mode"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reattempt Mode: {reattemptMode ? 'ON' : 'OFF'}</span>
              </button>

              <Link
                href={`/tests/${testId}/result`}
                className="px-3 py-1 rounded bg-[#1d4ed8] text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Scorecard</span>
              </Link>
            </div>
          )}

          {/* Mobile Drawer Trigger for Palette */}
          <button
            type="button"
            onClick={() => setMobilePaletteOpen(true)}
            className="lg:hidden px-2.5 py-1 rounded bg-[#1d4ed8] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Palette</span>
          </button>
        </div>
      </header>

      {/* ── 2. EDUQUITY SUB-HEADER: SYMBOLS & INSTRUCTIONS (Red Underlined) ── */}
      <div className="px-3 sm:px-6 py-1 bg-[#f1f5f9] border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => alert('Eduquity Palette Symbols:\n- Blue: Not Answered / Visited\n- Green: Answered\n- Purple: Marked for Review\n- Purple with Green dot: Answered & Marked for Review')}
            className="text-rose-600 underline font-bold text-xs hover:text-rose-700 tracking-wider"
          >
            SYMBOLS
          </button>
          <button
            type="button"
            onClick={() => setInstructionsModalOpen(true)}
            className="text-rose-600 underline font-bold text-xs hover:text-rose-700 tracking-wider"
          >
            INSTRUCTIONS
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <span className="hidden sm:inline">Select Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white text-slate-800 font-semibold focus:outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>

      {/* ── 3. EDUQUITY SECTION BAR & ACTION BUTTONS ROW ── */}
      <div className="px-3 sm:px-6 py-1.5 bg-white border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Section Pills (Green) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {test.sections.map((sec, sIdx) => {
            const isActive = activeSectionIdx === sIdx;
            const isPastLocked = !isSolutionMode && (lockedSections[sIdx] || (isSectionalTimingApplicable(test) && sIdx < activeSectionIdx));
            const isFutureLocked = !isSolutionMode && isSectionalTimingApplicable(test) && sIdx > activeSectionIdx;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  if (isPastLocked) {
                    alert(`Section "${sec.name}" has already been submitted and is locked under official exam rules.`);
                    return;
                  }
                  if (isFutureLocked) {
                    alert(`Under official examination rules, you cannot proceed to "${sec.name}" until you submit or finish the current section.`);
                    return;
                  }
                  setActiveSectionIdx(sIdx);
                  setActiveQuestionIdx(0);
                }}
                disabled={isPastLocked || isFutureLocked}
                className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  isPastLocked
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                    : isFutureLocked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300'
                    : isActive
                    ? 'bg-[#15803d] text-white shadow-xs'
                    : 'bg-[#166534] text-emerald-100 hover:bg-[#15803d]'
                }`}
              >
                {sec.name} {isPastLocked ? '🔒' : isFutureLocked ? '🔒' : ''}
              </button>
            );
          })}
        </div>

        {/* Horizontal Action Buttons Row (Blue) */}
        {!isSolutionMode ? (
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={goToPrevQuestion}
              className="px-2.5 sm:px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleMarkForReviewAndNext}
              className="px-2.5 sm:px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Mark For Review
            </button>
            <button
              type="button"
              onClick={handleSaveAndNext}
              className="px-2.5 sm:px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Save &amp; Next
            </button>
            <button
              type="button"
              onClick={handleClearResponse}
              className="px-2.5 sm:px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmitSection}
              className="px-2.5 sm:px-3 py-1 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            >
              Submit Section
            </button>
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="px-2.5 sm:px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              Submit Test
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPrevQuestion}
              className="px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={goToNextQuestion}
              className="px-3 py-1 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Info: Marks & Total Answered */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-700 whitespace-nowrap">
          <span className="hidden md:inline">
            Marks for correct answer: <strong className="text-slate-900">{(Number(currentQuestion?.marks) || 2).toFixed(2)}</strong> | Negative: <strong className="text-slate-900">{(Number(currentQuestion?.negativeMarks) || 0.5).toFixed(2)}</strong>
          </span>
          <span>
            Total Questions Answered: <strong className="text-rose-600 font-black text-sm">{totalAnsweredCount}</strong>
          </span>
        </div>
      </div>

      {sectionAlertMsg && (
        <div className="bg-amber-400 text-slate-950 font-bold text-xs py-1 px-4 text-center shadow-xs animate-pulse">
          {sectionAlertMsg}
        </div>
      )}

      {/* ── 4. MAIN WORKSPACE: Question Area (LEFT) vs Eduquity Palette (RIGHT) ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ── LEFT PANE: Question Area & Options ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-300">
          {/* Question Subheader Line (Question: 1 | Last 4 Minutes | Save | Report) */}
          <div className="px-3 sm:px-6 py-1.5 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="font-bold text-xs sm:text-sm text-slate-900">
              Question: {qno}
            </span>

            <div className="flex items-center gap-3">
              {!isSolutionMode && (
                <span className="text-xs font-bold text-rose-600 tracking-wide">
                  {isSectionalTimingApplicable(test)
                    ? `Section: Last ${Math.max(1, Math.ceil((sectionTimesRemaining[activeSectionIdx] ?? (getExamSectionTimingMinutes(test, activeSectionIdx) * 60)) / 60))} Minutes`
                    : `Last ${Math.max(1, Math.ceil(overallSecondsRemaining / 60))} Minutes`}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleSaveQuestion}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer ${
                    isQuestionBookmarked
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title="Bookmark question to Saved Questions Library"
                >
                  <Bookmark className={`w-3 h-3 ${isQuestionBookmarked ? 'fill-amber-600 text-amber-600' : 'text-slate-500'}`} />
                  <span>{isQuestionBookmarked ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-2.5 py-0.5 rounded bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="px-2.5 py-0.5 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                  title="Report an error in this question or options"
                >
                  Report
                </button>
              </div>
            </div>
          </div>

          {/* Question Text & Options (Scrollable, mobile responsive) */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 pb-24"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='130'%3E%3Ctext x='15' y='75' fill='%2394a3b8' opacity='0.16' font-family='sans-serif' font-weight='900' font-size='19' transform='rotate(-22 15 75)'%3E${encodeURIComponent(candidatePhone)}%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          >
            {/* Authentic Exam Origin Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50/90 border border-blue-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
              <span className="text-blue-700 font-bold uppercase tracking-wider text-[10px] bg-blue-100 px-1.5 py-0.5 rounded">
                📌 Official Exam Origin
              </span>
              <span className="font-mono text-slate-700">
                {currentQuestion.examOrigin || test.title}
              </span>
            </div>

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
            <div className="space-y-0 pt-2 max-w-3xl border-t border-slate-200">
              {(currentQuestion?.options || []).map((opt) => {
                const optText = language === 'hi' && opt.textHi ? opt.textHi : opt.text;
                
                const isSelectedInExam = !isSolutionMode && currentResponse.chosenOption === opt.id;
                const isSelectedInReattempt = isSolutionMode && reattemptMode && reattemptChoices[qno] === opt.id;
                
                const isOfficialCorrect = isSolutionMode && isQuestionSolutionVisible && opt.id === currentQuestion?.correctOption;
                const isUserAttempted = isSolutionMode && isQuestionSolutionVisible && (
                  reattemptMode ? (reattemptChoices[qno] === opt.id) : (currentResponse.chosenOption === opt.id)
                );
                const isUserWrongChoice = isSolutionMode && isQuestionSolutionVisible && isUserAttempted && !isOfficialCorrect;
                const isUserCorrectChoice = isSolutionMode && isQuestionSolutionVisible && isUserAttempted && isOfficialCorrect;

                return (
                  <div
                    key={opt.id}
                    className={`flex items-start gap-4 py-3.5 px-2 border-b border-slate-200/80 transition select-none ${
                      isOfficialCorrect
                        ? 'bg-emerald-50/70'
                        : isUserWrongChoice
                        ? 'bg-rose-50/70'
                        : (isSelectedInExam || (reattemptMode && isSelectedInReattempt))
                        ? 'bg-blue-50/50'
                        : 'bg-transparent'
                    }`}
                  >
                    {/* Small Round Radio Button — Strictly clickable directly to select (Eduquity standard) */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelectedInExam || (reattemptMode && isSelectedInReattempt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOption(opt.id);
                      }}
                      className={`mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                        isOfficialCorrect
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isUserWrongChoice
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : (isSelectedInExam || (reattemptMode && isSelectedInReattempt))
                          ? 'border-blue-600 bg-white ring-2 ring-blue-500/25'
                          : 'border-slate-400 hover:border-blue-600 bg-white'
                      }`}
                    >
                      {isOfficialCorrect ? (
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : isUserWrongChoice ? (
                        <X className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : (isSelectedInExam || (reattemptMode && isSelectedInReattempt)) ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      ) : null}
                    </button>

                    <div className="flex-1 flex flex-wrap items-start justify-between gap-2 text-sm text-slate-800 leading-normal">
                      <div className="flex-1 min-w-[200px] flex items-start gap-2">
                        <div className="flex-1">
                          <MathRenderer content={optText} />
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt={`Option ${opt.id}`} className="mt-2 max-h-36 border rounded" />
                          )}
                        </div>
                      </div>

                      {/* Solution Badges */}
                      {isOfficialCorrect && (
                        <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{reattemptMode && isUserCorrectChoice ? 'Correct Choice!' : 'Correct Answer'}</span>
                        </span>
                      )}
                      {isUserWrongChoice && (
                        <span className="text-[11px] font-black uppercase text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>{reattemptMode ? 'Your Reattempt (Incorrect)' : 'Your Attempt'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DETAILED SOLUTION BOX (Positioned directly under options with full dark mode support) ── */}
            {isSolutionMode && isQuestionSolutionVisible && (
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-400/40 dark:border-sky-500/30 shadow-md space-y-3.5 max-w-3xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shadow">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Official Step-by-Step Solution ({language === 'hi' ? 'हिंदी माध्यम' : 'English'})
                      </h4>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Detailed Conceptual Breakdown &bull; Exam Informer Shortcut Trick
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Marks:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+{currentQuestion?.marks || 2}</span>
                    <span className="font-bold text-rose-500 dark:text-rose-400">-{currentQuestion?.negativeMarks || 0.5}</span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  <MathRenderer
                    content={
                      (language === 'hi' && (currentQuestion as any)?.explanationHi)
                        ? (currentQuestion as any).explanationHi
                        : currentQuestion?.explanation ||
                          `**Official Solution:** Option (${currentQuestion?.correctOption || 1}) is the correct answer according to official SSC/RRB answer key standards.`
                    }
                  />
                </div>

                {/* Real Topper & Community Benchmarks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Avg Time To Solve</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">42 seconds</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Your Time</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{currentResponse.timeSpentSec || 35}s</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Avg Correct %</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">68% got it right</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Difficulty</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">Moderate PYQ</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                  <div className="flex items-center gap-3">
                    <span>
                      Candidate Choice: <strong className="text-slate-900 dark:text-white">{currentResponse.chosenOption ? `Option (${currentResponse.chosenOption})` : 'Unattempted'}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Official Key: <strong>Option ({currentQuestion?.correctOption || 1})</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Section: <strong className="text-slate-700 dark:text-slate-300">{currentSection?.name}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          {!isSolutionMode && (
            <div className="h-14 px-4 sm:px-6 bg-[#f8fafc] border-t border-slate-300 flex items-center justify-between shrink-0 gap-2">
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-3 sm:px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                Clear Response
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevQuestion}
                  className="px-3 sm:px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-4 sm:px-5 py-1.5 rounded bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs transition"
                >
                  Save &amp; Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANE: DESKTOP PALETTE (Hidden on screens < lg) ── */}
        <aside className="hidden lg:flex w-80 xl:w-96 bg-white flex-col shrink-0 overflow-y-auto border-l border-slate-300">
          {/* Top Header matching Eduquity: Blue Triangle + Section Name */}
          <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-2 shrink-0">
            <span className="text-[#1d4ed8] text-base font-black leading-none">▶</span>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight truncate">
              {currentSection?.name}
            </h3>
          </div>

          {/* Section Part Quick Switcher */}
          {test && test.sections.length > 1 && (
            <div className="p-2 bg-[#f8fafc] border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0">
              {test.sections.map((sec, idx) => {
                const isActive = activeSectionIdx === idx;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSectionIdx(idx);
                      setActiveQuestionIdx(0);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-black transition whitespace-nowrap ${
                      isActive
                        ? 'bg-[#15803d] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {`PART-${String.fromCharCode(65 + idx)}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Question Number Palette Grid (5 columns per row, Eduquity standard) */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2.5">
              {(currentSection?.questions || []).map((q, idx) => {
                const targetQno = q.qno;
                const resp = userResponses[targetQno];
                const status = resp?.status || 'not_visited';
                const isCurrent = activeQuestionIdx === idx;

                let bgClass = 'bg-[#1d4ed8] text-white';

                if (isSolutionMode) {
                  if (resp && resp.chosenOption !== undefined) {
                    if (resp.chosenOption === q.correctOption) {
                      bgClass = 'bg-[#15803d] text-white';
                    } else {
                      bgClass = 'bg-[#dc2626] text-white';
                    }
                  } else {
                    bgClass = 'bg-slate-300 text-slate-700';
                  }
                } else {
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

          {/* Eduquity Section Analysis Card (Tan header bg-[#d7cdbd], red/orange digits) */}
          <div className="border-t border-slate-300 bg-white shrink-0">
            <div className="bg-[#d7cdbd] text-slate-900 text-xs font-bold py-1.5 px-4 text-left">
              {currentSection?.name} Analysis
            </div>
            {!isSolutionMode ? (
              <div className="p-3.5 text-xs space-y-2 font-bold text-slate-800 bg-white">
                <div className="flex items-center justify-between">
                  <span>Answered</span>
                  <span className="text-rose-600 font-black text-sm">
                    {secAnswered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Not Answered</span>
                  <span className="text-orange-500 font-black text-sm">
                    {secNotAnswered}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-xs space-y-1.5 font-bold text-slate-700 bg-white">
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
        </aside>

        {/* ── RESPONSIVE MOBILE PALETTE DRAWER (Rule 3) ── */}
        {mobilePaletteOpen && (
          <div className="fixed inset-0 z-[120] lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobilePaletteOpen(false)}
            />

            {/* Slide-over Sheet from Right */}
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col z-10">
              <div className="p-3.5 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between">
                <div className="font-extrabold text-sm text-slate-900">
                  Question Palette &bull; Q{qno}
                </div>
                <button
                  type="button"
                  onClick={() => setMobilePaletteOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Part Tabs on Mobile */}
              <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0">
                {(test?.sections || []).map((sec, idx) => {
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
                          : 'bg-[#1d4ed8] text-white'
                      }`}
                    >
                      {partLabel}
                    </button>
                  );
                })}
              </div>

              {/* Section Name on Mobile */}
              <div className="px-3 py-2 border-b border-slate-200 bg-white font-bold text-xs text-slate-800 truncate">
                {currentSection?.name}
              </div>

              {/* Grid on Mobile */}
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2.5">
                  {(currentSection?.questions || []).map((q, idx) => {
                    const targetQno = q.qno;
                    const resp = userResponses[targetQno];
                    const status = resp?.status || 'not_visited';
                    const isCurrent = activeQuestionIdx === idx;

                    let bgClass = 'bg-[#1d4ed8] text-white';

                    if (isSolutionMode) {
                      if (resp && resp.chosenOption !== undefined) {
                        if (resp.chosenOption === q.correctOption) {
                          bgClass = 'bg-[#15803d] text-white';
                        } else {
                          bgClass = 'bg-[#dc2626] text-white';
                        }
                      } else {
                        bgClass = 'bg-slate-300 text-slate-700';
                      }
                    } else {
                      if (status === 'answered') bgClass = 'bg-[#15803d] text-white';
                      else if (status === 'not_answered') bgClass = 'bg-[#dc2626] text-white';
                      else if (status === 'marked' || status === 'marked_answered') bgClass = 'bg-[#8b5cf6] text-white';
                      else bgClass = 'bg-[#1d4ed8] text-white';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => handlePaletteClick(activeSectionIdx, idx, targetQno)}
                        className={`h-10 rounded font-bold text-xs flex items-center justify-center transition ${bgClass} ${
                          isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 scale-105' : ''
                        }`}
                      >
                        {targetQno}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Eduquity Section Analysis */}
              <div className="bg-white border-t border-slate-300">
                <div className="bg-[#d7cdbd] text-slate-900 text-xs font-bold py-1.5 px-3">
                  {currentSection?.name} Analysis
                </div>
                <div className="p-3 text-xs space-y-1.5 font-bold text-slate-800">
                  <div className="flex items-center justify-between">
                    <span>Answered:</span>
                    <span className="text-rose-600 font-black text-sm">
                      {secAnswered}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Not Answered:</span>
                    <span className="text-orange-500 font-black text-sm">
                      {secNotAnswered}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. PAUSE TEST MODAL (Rule 4) ── */}
      {pauseModalOpen && (
        <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Pause className="w-6 h-6 fill-current" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl text-slate-900">
                Examination Paused
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Timer has been stopped. Your responses and time remaining have been saved to your account. You can resume right now or return later!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-left">
              <div>
                <span className="text-slate-500">Time Remaining:</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {formatTimeEduquity(overallSecondsRemaining)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Answered Questions:</span>
                <div className="font-bold text-emerald-600 text-sm mt-0.5">
                  {countAnswered + countMarkedAnswered} / {test.totalQuestions}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleResumeTest}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Examination Now</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndExit}
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Exit (Come Back Later)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. RESUME PAUSED SESSION PROMPT (Rule 4) ── */}
      {resumePromptOpen && (
        <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl text-slate-900">
                Resume Unfinished Test?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                You have an active in-progress attempt for <strong>{test.title}</strong> with <strong>{formatTimeEduquity(overallSecondsRemaining)}</strong> remaining.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleResumeTest}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume From Where You Left</span>
              </button>

              <button
                type="button"
                onClick={handleStartFresh}
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start Fresh Attempt (Reset Timer)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. SUBMIT CONFIRMATION MODAL ── */}
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
              Are you sure you want to end this examination? Once submitted, your answers will be evaluated and your detailed scorecard with community rank and answers will be unlocked.
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

      {/* ── 6. INSTRUCTIONS MODAL ── */}
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

      {/* ── 8. REPORT QUESTION ERROR MODAL ── */}
      <ReportQuestionModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        testId={testId}
        testTitle={test?.title}
        qno={currentQuestion?.qno || activeQuestionIdx + 1}
        questionText={currentQuestion?.questionText}
      />
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
