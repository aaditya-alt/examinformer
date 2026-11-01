'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Layers,
  BarChart3,
  Search,
  ExternalLink
} from 'lucide-react';

const EXAMS = [
  { id: 'ssc-cgl', name: 'SSC CGL (Tier 1)', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Most Popular' },
  { id: 'ssc-chsl', name: 'SSC CHSL (Tier 1)', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Active' },
  { id: 'ssc-mts', name: 'SSC MTS & Havaldar', family: 'ssc', correct: 3.0, wrong: 1.0, tag: 'Active' },
  { id: 'ssc-gd', name: 'SSC GD Constable', family: 'ssc', correct: 2.0, wrong: 0.25, tag: 'Active' },
  { id: 'rrb-ntpc-ug', name: 'RRB NTPC Under Graduate (CBT-1)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway 2026' },
  { id: 'rrb-ntpc-grad', name: 'RRB NTPC Graduate Level (CBT-1)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway 2026' },
  { id: 'rrb-group-d', name: 'RRB Group D (Level-1)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway 2026' },
  { id: 'rrb-section-controller', name: 'RRB Section Controller', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway 2026' },
  { id: 'rrb-alp', name: 'RRB ALP (Assistant Loco Pilot)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway 2026' },
  { id: 'custom', name: 'Custom Exam Pattern', family: 'other', correct: 1.0, wrong: 0.25, tag: 'Flexible' },
];

const CATEGORIES = ['UR (General)', 'OBC (Non-Creamy)', 'EWS', 'SC', 'ST', 'ESM', 'PwD'];
const GENDERS = ['Male', 'Female', 'Transgender'];
const LANGUAGES = ['English', 'Hindi'];

const STATES = [
  'Uttar Pradesh', 'Bihar', 'Rajasthan', 'Madhya Pradesh', 'Delhi (NCT)',
  'Haryana', 'West Bengal', 'Maharashtra', 'Jharkhand', 'Punjab',
  'Uttarakhand', 'Chhattisgarh', 'Odisha', 'Gujarat', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Assam', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu',
  'Karnataka', 'Kerala', 'Other / UT'
];

// All official 21 RRB Zones
const RRB_ZONES = [
  'RRB Ahmedabad',
  'RRB Ajmer',
  'RRB Prayagraj (Allahabad)',
  'RRB Bangalore',
  'RRB Bhopal',
  'RRB Bhubaneswar',
  'RRB Bilaspur',
  'RRB Chandigarh',
  'RRB Chennai',
  'RRB Gorakhpur',
  'RRB Guwahati',
  'RRB Jammu-Srinagar',
  'RRB Kolkata',
  'RRB Malda',
  'RRB Mumbai',
  'RRB Muzaffarpur',
  'RRB Patna',
  'RRB Ranchi',
  'RRB Secunderabad',
  'RRB Siliguri',
  'RRB Thiruvananthapuram'
];

export default function ScoreCalculatorPage() {
  const router = useRouter();

  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [rollInput, setRollInput] = useState('');
  const [rollLoading, setRollLoading] = useState(false);
  const [savedSession, setSavedSession] = useState<any>(null);

  const [selectedExamId, setSelectedExamId] = useState('rrb-ntpc-grad');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedGender, setSelectedGender] = useState(GENDERS[0]);
  const [selectedState, setSelectedState] = useState(STATES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [selectedZone, setSelectedZone] = useState(RRB_ZONES[0]);

  // Custom marks
  const [customCorrect, setCustomCorrect] = useState(1.0);
  const [customWrong, setCustomWrong] = useState(0.33);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check for saved candidate evaluation in localStorage
  React.useEffect(() => {
    const raw = localStorage.getItem('last_evaluated_submission');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSavedSession(parsed);
      } catch (e) {
        console.warn('Failed to parse saved session:', e);
      }
    }
  }, []);

  const handleClearSavedSession = () => {
    localStorage.removeItem('last_evaluated_submission');
    setSavedSession(null);
  };

  const handleCheckByRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!rollInput.trim()) {
      setErrorMessage('Please enter your examination Roll Number.');
      return;
    }

    setRollLoading(true);
    try {
      // 1. Check local storage first
      const localRaw = localStorage.getItem('saved_evaluation_' + rollInput.trim());
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        sessionStorage.setItem('current_evaluation', JSON.stringify(parsed));
        router.push(`/score-calculator/result?id=${parsed.submissionId}`);
        return;
      }

      // 2. Query server API
      const res = await fetch(`/api/score-calculator/submissions?rollNumber=${encodeURIComponent(rollInput.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(`No evaluated scorecard found for Roll No. ${rollInput.trim()}. Please enter your official answer key link above.`);
      }

      sessionStorage.setItem('current_evaluation', JSON.stringify(json.data));
      localStorage.setItem('saved_evaluation_' + json.data.candidate.rollNumber, JSON.stringify(json.data));
      localStorage.setItem('last_evaluated_submission', JSON.stringify({
        submissionId: json.data.submissionId,
        rollNumber: json.data.candidate.rollNumber,
        candidateName: json.data.candidate.name,
        examDate: json.data.candidate.examDate,
        shiftTime: json.data.candidate.shiftTime,
        category: json.data.candidate.category,
        finalScore: json.data.metrics.finalScore,
        timestamp: Date.now()
      }));

      router.push(`/score-calculator/result?id=${json.data.submissionId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not find scorecard for this roll number.');
      setRollLoading(false);
    }
  };

  const currentExam = EXAMS.find(e => e.id === selectedExamId) || EXAMS[0];
  const isRRB = currentExam.family === 'rrb';

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!answerKeyUrl.trim()) {
      setErrorMessage('Please enter your official Answer Key / Response Sheet URL.');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep('Connecting to official portal response sheet...');

      const payload = {
        url: answerKeyUrl.trim(),
        examFamily: currentExam.family,
        examTitle: currentExam.name,
        category: selectedCategory,
        gender: selectedGender,
        state: selectedState,
        preferredLanguage: selectedLanguage,
        zone: isRRB ? selectedZone : undefined,
        customRule: selectedExamId === 'custom' ? {
          marksPerCorrect: customCorrect,
          negativePerWrong: customWrong
        } : {
          marksPerCorrect: currentExam.correct,
          negativePerWrong: currentExam.wrong
        }
      };

      setLoadingStep('Parsing candidate responses, question keys, and options...');

      const res = await fetch('/api/score-calculator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to evaluate answer key.');
      }

      setLoadingStep('Calculating official scorecard & portal rankings...');
      sessionStorage.setItem('current_evaluation', JSON.stringify(json.data));
      localStorage.setItem('saved_evaluation_' + json.data.candidate.rollNumber, JSON.stringify(json.data));
      localStorage.setItem('last_evaluated_submission', JSON.stringify({
        submissionId: json.data.submissionId,
        rollNumber: json.data.candidate.rollNumber,
        candidateName: json.data.candidate.name,
        examDate: json.data.candidate.examDate,
        shiftTime: json.data.candidate.shiftTime,
        category: json.data.candidate.category,
        finalScore: json.data.metrics.finalScore,
        timestamp: Date.now()
      }));

      router.push(`/score-calculator/result?id=${json.data.submissionId}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred during evaluation.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900">
          <Calculator className="w-3.5 h-3.5 text-blue-600" />
          <span>Official Score &amp; Rank Calculator</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Evaluate Official Answer Key
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          Paste your official TCS iON DigiALM (Railway / SSC) or SSC cbexams answer key link to get your verified section-wise marks, negative penalty, and portal rank.
        </p>
      </div>

      {/* Active Saved Session Banner */}
      {savedSession && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/80 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
                Active Scorecard
              </span>
              <span className="text-xs text-sky-200">Roll: <strong>{savedSession.rollNumber}</strong></span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Welcome Back, {savedSession.candidateName}!
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Score: <strong className="text-emerald-300">{savedSession.finalScore}</strong> &bull; Category: <strong>{savedSession.category || 'General'}</strong> &bull; Shift: <strong>{savedSession.shiftTime} ({savedSession.examDate})</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/score-calculator/result?id=${savedSession.submissionId}`)}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Scorecard &amp; Rank</span>
            </button>
            <button
              type="button"
              onClick={handleClearSavedSession}
              className="px-3 py-2.5 rounded-xl border border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6 shadow-sm">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="font-bold">Evaluation Notice: </strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleCalculate} className="space-y-6">
          {/* Answer Key URL Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Official Answer Key URL / Response Sheet Link</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={answerKeyUrl}
                onChange={(e) => setAnswerKeyUrl(e.target.value)}
                placeholder="https://rrb.digialm.com/... or https://ssc.digialm.com/... or https://...cbexams.com/..."
                className="w-full px-4 py-3 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-10"
                required
              />
              {answerKeyUrl && (
                <button
                  type="button"
                  onClick={() => setAnswerKeyUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Supports all official Railway DigiALM, SSC DigiALM, and multi-part SSC challenge links.</span>
            </p>
          </div>

          {/* Exam & Profile Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* Exam Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Examination
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {EXAMS.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reservation Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* RRB Zone or State */}
            {isRRB ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  RRB Board / Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {RRB_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Candidate State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Custom Marking Scheme if custom selected */}
          {selectedExamId === 'custom' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Marks per Correct (+ve)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customCorrect}
                  onChange={(e) => setCustomCorrect(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Penalty per Wrong (-ve)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customWrong}
                  onChange={(e) => setCustomWrong(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{loadingStep || 'Evaluating Answer Key...'}</span>
              </>
            ) : (
              <>
                <span>Calculate Official Score &amp; Portal Rank</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Search by Roll Number */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Already calculated your marks?
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter your Roll Number to instantly retrieve your verified scorecard.
              </p>
            </div>
            <form onSubmit={handleCheckByRoll} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                placeholder="Enter Roll Number..."
                className="px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={rollLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition shrink-0"
              >
                {rollLoading ? 'Searching...' : 'Find Scorecard'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>How to get your Answer Key Link</span>
        </h3>
        <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Login to the official Railway / SSC DigiALM candidate portal using your Roll Number and Password / DOB.</li>
          <li>Click on the <strong>&quot;Candidate Response&quot;</strong> or <strong>&quot;To download your question paper for Assessment, click here&quot;</strong> tab.</li>
          <li>Once the answer sheet opens with all questions and your chosen options, simply copy the complete link from your browser address bar.</li>
          <li>Paste the link into the box above and click <strong>&quot;Calculate Official Score &amp; Portal Rank&quot;</strong>.</li>
        </ol>
      </div>
    </div>
  );
}
