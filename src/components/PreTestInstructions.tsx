'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExamLogo } from './ExamLogo';
import { ThemeToggle } from './ThemeToggle';
import type { CBTTest } from '@/lib/types/cbt';
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';

interface PreTestInstructionsProps {
  test: CBTTest;
  language: 'en' | 'hi';
  onLanguageChange: (lang: 'en' | 'hi') => void;
  onStartTest: () => void;
  onCancel: () => void;
}

export function PreTestInstructions({
  test,
  language,
  onLanguageChange,
  onStartTest,
  onCancel
}: PreTestInstructionsProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [declared, setDeclared] = useState(false);

  // Compute section timings
  const getSectionTime = (sIdx: number): number => {
    const code = (test.examCode || '').toLowerCase();
    const id = (test.id || '').toLowerCase();
    const title = (test.title || '').toLowerCase();
    const secName = (test.sections[sIdx]?.name || '').toLowerCase();

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

    // SSC CGL Tier 1 / CHSL Tier 1: 15 min each
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

    return test.sectionalTimingMinutes || Math.floor(test.durationMinutes / Math.max(1, test.sections.length));
  };

  const positiveMarks = test.positiveMarks || (test.totalMarks / Math.max(1, test.totalQuestions));
  const negativeMarks = test.negativeMarks || (positiveMarks === 2 ? 0.5 : positiveMarks === 3 ? 1.0 : 0.25);

  return (
    <div className="fixed inset-0 z-[110] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto font-sans flex flex-col justify-between">
      {/* ── TOP HEADER (Back arrow, Circular Logo, Dark Mode, Language) ── */}
      <header className="h-14 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={step === 1 ? onCancel : () => setStep(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <ExamLogo type={test.examFamily as any} size="sm" />
          <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
            {test.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as 'en' | 'hi')}
            className="border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="en">English ▾</option>
            <option value="hi">हिंदी ▾</option>
          </select>
        </div>
      </header>

      {/* ── STEP 1: TEST OVERVIEW, SECTIONS BREAKDOWN & CANDIDATE CHECKLIST ── */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
          {/* 4 Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Duration</div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {test.durationMinutes} Minutes
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Questions</div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {test.totalQuestions} Questions
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Correct Marks</div>
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{positiveMarks.toFixed(1).replace('.0', '')} Marks
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Negative Marking</div>
              <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                -{negativeMarks.toFixed(2)} Marks
              </div>
            </div>
          </div>

          {/* Sections Breakdown Table */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              Sections Breakdown
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f0f4f8] dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Section Name</th>
                    <th className="py-2.5 px-3 text-center">Questions</th>
                    <th className="py-2.5 px-3 text-center">Time</th>
                    <th className="py-2.5 px-3 text-center">Marks</th>
                    <th className="py-2.5 px-3 text-center">Negative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {test.sections.map((sec, idx) => (
                    <tr key={sec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {sec.name}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                        {sec.questions.length}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                        {getSectionTime(idx)} min
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        +{positiveMarks.toFixed(1).replace('.0', '')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                        -{negativeMarks.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                    <td className="py-2.5 px-3 uppercase">Total</td>
                    <td className="py-2.5 px-3 text-center">{test.totalQuestions}</td>
                    <td className="py-2.5 px-3 text-center">Time: {test.durationMinutes} Mins</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-emerald-600">{test.totalMarks}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-rose-600">--</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Candidate Checklist */}
          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              Candidate Checklist
            </h3>
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Server-Controlled Exam Timer:</strong> Remaining time is shown in the top header. Test auto-submits when countdown finishes.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Always Click Save &amp; Next:</strong> Answers are only saved when you click Save &amp; Next. Merely selecting an option will not save.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Section &amp; Question Switching:</strong> You can navigate between any question or section freely during the exam. Use Mark for Review to revisit questions later.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Language &amp; Display:</strong> Question language can be changed during the test (except language-specific subjects).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Single Tab Policy:</strong> Do not refresh or switch tabs during the test. Using unfair means will lead to immediate disqualification.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: SYMBOLS LEGEND & DECLARATION ── */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-5 flex-1">
          <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-300 font-bold leading-relaxed">
            The different symbols used in the next pages are shown below. Please go through them and understand their meaning before you start the test.
          </p>

          {/* Symbols Table matching user screenshot */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#e4dcce] dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-extrabold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4 w-36">Symbol</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px] sm:text-xs">
                {/* 1. Option Not Chosen */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-400 bg-white" />
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    Option Not chosen
                  </td>
                </tr>

                {/* 2. Option Chosen */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 border-blue-600 bg-white">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    Option chosen as correct (By clicking on it again you can delete your option and choose another option if desired.)
                  </td>
                </tr>

                {/* 3. Blue: Not yet attempted */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#1d4ed8] text-white font-bold text-xs">
                      12
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    Question number shown in blue color indicates that you have not yet attempted the question.
                  </td>
                </tr>

                {/* 4. Green: Answered */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#15803d] text-white font-bold text-xs">
                      13
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    Question number shown in green color indicates that you have answered the question.
                  </td>
                </tr>

                {/* 5. Red/Flag: Marked for Review without answer */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#dc2626] text-white font-bold text-xs">
                      14
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    You have not yet answered the question, but marked it for coming back for review later, if time permits.
                  </td>
                </tr>

                {/* 6. Marked for Review with answer */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#8b5cf6] text-white font-bold text-xs relative">
                      15
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    You have answered the question, but marked it for review later, if time permits.
                  </td>
                </tr>

                {/* 7. Save & Next Button */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="px-2 py-1 rounded bg-[#1d4ed8] text-white text-[10px] font-bold">
                      Save &amp; Next
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    Clicking on this will take you to the next question.
                  </td>
                </tr>

                {/* 8. Previous Button */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="px-2 py-1 rounded bg-[#1d4ed8] text-white text-[10px] font-bold">
                      Previous
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    Clicking on this will take you to the previous question.
                  </td>
                </tr>

                {/* 9. Mark for Review */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="px-2 py-1 rounded bg-[#1d4ed8] text-white text-[10px] font-bold">
                      Mark for Review
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    By clicking on this button, you can mark the question for review later. Please note that if you answer the question and mark for review, the question will be treated as answered and evaluated even if you do not review it.
                  </td>
                </tr>

                {/* 10. Unmark Review */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-center">
                    <span className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                      Unmark Review
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    By clicking on this button, you can unmark the question for review.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Select Test Language & Declaration Checkbox */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-xs space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Test Language
              </label>
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as 'en' | 'hi')}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => setDeclared(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                I have read all instructions carefully and understood them.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── BOTTOM ACTIONS ROW ── */}
      <footer className="h-16 px-4 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-lg">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
            >
              Go to Tests
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-8 py-2.5 rounded-lg bg-[#0ea5e9] hover:bg-sky-600 text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-lg bg-[#0284c7] hover:bg-sky-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
            >
              Back
            </button>

            <button
              type="button"
              disabled={!declared}
              onClick={onStartTest}
              className={`px-8 py-2.5 rounded-lg font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs ${
                declared
                  ? 'bg-[#0ea5e9] hover:bg-sky-600 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Start Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
