'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CBTTest, CBTQuestion } from '@/lib/testService';
import { MathRenderer } from '@/components/MathRenderer';
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
  Maximize2
} from 'lucide-react';

export default function CBTTestInterfacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [test, setTest] = useState<CBTTest | null>(null);
  const [loading, setLoading] = useState(true);

  // Active state
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Question response state: { [qno]: { chosenOption?: number, status: 'answered' | 'not_answered' | 'marked' | 'marked_answered' | 'not_visited', timeSpent: number } }
  const [userResponses, setUserResponses] = useState<Record<number, {
    chosenOption?: number;
    status: 'answered' | 'not_answered' | 'marked' | 'marked_answered' | 'not_visited';
  }>>({});

  // Timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setTest(json.data);
          setSecondsRemaining(json.data.durationMinutes * 60);

          // Initialize responses with 'not_visited' for all questions
          const initialMap: Record<number, any> = {};
          let qCounter = 1;
          json.data.sections.forEach((sec: any) => {
            sec.questions.forEach((q: any) => {
              initialMap[q.qno || qCounter] = {
                chosenOption: undefined,
                status: qCounter === 1 ? 'not_answered' : 'not_visited'
              };
              qCounter++;
            });
          });
          setUserResponses(initialMap);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!test || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test, secondsRemaining]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Loading Examination Interface...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold">Examination Not Found</h2>
          <button
            onClick={() => router.push('/tests')}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Return to Tests
          </button>
        </div>
      </div>
    );
  }

  const currentSection = test.sections[activeSectionIdx] || test.sections[0];
  const currentQuestion = currentSection.questions[activeQuestionIdx] || currentSection.questions[0];
  const qno = currentQuestion.qno;
  const currentResponse = userResponses[qno] || { status: 'not_visited' };

  // Timer format (HH:MM:SS)
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Option select handler
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
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQuestionIdx(0);
    }
  };

  const goToPrevQuestion = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (activeSectionIdx > 0) {
      setActiveSectionIdx(activeSectionIdx - 1);
      setActiveQuestionIdx(test.sections[activeSectionIdx - 1].questions.length - 1);
    }
  };

  const handlePaletteClick = (secIdx: number, qIdx: number, targetQno: number) => {
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

  const handleSubmitTest = () => {
    setSubmitting(true);

    // Compute basic score
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let attempted = 0;

    test.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const resp = userResponses[q.qno];
        if (resp && resp.chosenOption !== undefined) {
          attempted++;
          if (resp.chosenOption === q.correctOption) {
            score += q.marks;
            correctCount++;
          } else {
            score -= q.negativeMarks;
            wrongCount++;
          }
        }
      });
    });

    const finalScore = parseFloat(Math.max(0, score).toFixed(2));
    const accuracy = attempted > 0 ? parseFloat(((correctCount / attempted) * 100).toFixed(1)) : 0;

    const resultPayload = {
      testId: test.id,
      testTitle: test.title,
      totalQuestions: test.totalQuestions,
      attempted,
      correctCount,
      wrongCount,
      finalScore,
      accuracy,
      userResponses
    };

    sessionStorage.setItem(`cbt_result_${test.id}`, JSON.stringify(resultPayload));
    router.push(`/tests/${test.id}/result`);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col select-none">
      {/* ── Fixed CBT Top Navigation Bar ── */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
            {test.title}
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 uppercase">
            CBT Mode
          </span>
        </div>

        {/* Right actions: Language + Timer + Submit */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Language Switch */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          >
            <Languages className="w-3.5 h-3.5 text-blue-500" />
            <span>{language === 'en' ? 'English' : 'हिंदी'}</span>
          </button>

          {/* Countdown Clock */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-black tracking-wider ${
            secondsRemaining < 300
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
          }`}>
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          {/* Submit Test Button */}
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* ── Section Selection Bar ── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Sections:</span>
        {test.sections.map((sec, idx) => (
          <button
            key={sec.id}
            onClick={() => {
              setActiveSectionIdx(idx);
              setActiveQuestionIdx(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeSectionIdx === idx
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            {sec.name} ({sec.questions.length})
          </button>
        ))}
      </div>

      {/* ── Main CBT Workspace ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-6 sm:p-8">
          <div className="space-y-6 max-w-4xl">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  Question No. {qno}
                </span>
                <span className="text-xs text-slate-500">
                  ({currentSection.name})
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Marks: <span className="font-bold text-emerald-600">+{currentQuestion.marks}</span> / <span className="font-bold text-rose-500">-{currentQuestion.negativeMarks}</span>
              </div>
            </div>

            {/* Question Body */}
            <div className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              <MathRenderer content={language === 'hi' && currentQuestion.questionTextHi ? currentQuestion.questionTextHi : currentQuestion.questionText} />
            </div>

            {/* Question Images */}
            {currentQuestion.questionImages && currentQuestion.questionImages.length > 0 && (
              <div className="my-3">
                {currentQuestion.questionImages.map((src, i) => (
                  <img key={i} src={src} alt="Diagram" className="max-h-64 rounded-xl border" />
                ))}
              </div>
            )}

            {/* Options List */}
            <div className="space-y-3 pt-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = currentResponse.chosenOption === opt.id;
                const optText = language === 'hi' && opt.textHi ? opt.textHi : opt.text;

                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-medium cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                      }`}>
                        {opt.id}
                      </div>
                      <span><MathRenderer content={optText} /></span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs transition"
              >
                Mark for Review &amp; Next
              </button>
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevQuestion}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition active:scale-95"
              >
                <span>Save &amp; Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette Drawer */}
        <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-900/90 p-5 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
          <div>
            {/* Status Legend */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 mb-5">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2.5">
                Question Palette Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {countAnswered}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {countNotAnswered}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {countMarked}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold relative">
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {countMarkedAnswered}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">Answered &amp; Marked</span>
                </div>
              </div>
            </div>

            {/* Questions Number Grid for Current Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentSection.name}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {currentSection.questions.map((q, idx) => {
                  const resp = userResponses[q.qno] || { status: 'not_visited' };
                  const isCurrent = activeQuestionIdx === idx;

                  let bg = 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'; // not visited
                  if (resp.status === 'answered') {
                    bg = 'bg-emerald-500 text-white';
                  } else if (resp.status === 'not_answered') {
                    bg = 'bg-rose-500 text-white';
                  } else if (resp.status === 'marked') {
                    bg = 'bg-purple-600 text-white';
                  } else if (resp.status === 'marked_answered') {
                    bg = 'bg-purple-600 text-white ring-2 ring-emerald-400';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handlePaletteClick(activeSectionIdx, idx, q.qno)}
                      className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center transition ${bg} ${
                        isCurrent ? 'scale-105 shadow-md ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                    >
                      {q.qno}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Palette Footer: Submit */}
          <div className="pt-6">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition"
            >
              Submit Entire Paper
            </button>
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Submit Examination?
              </h3>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to finish the exam? Once submitted, you cannot modify your answers.
            </p>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold">
              <div>Answered: <span className="font-bold text-emerald-600">{countAnswered + countMarkedAnswered}</span></div>
              <div>Not Answered: <span className="font-bold text-rose-500">{countNotAnswered}</span></div>
              <div>Marked for Review: <span className="font-bold text-purple-600">{countMarked}</span></div>
              <div>Not Visited: <span className="font-bold text-slate-500">{countNotVisited}</span></div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={handleSubmitTest}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
