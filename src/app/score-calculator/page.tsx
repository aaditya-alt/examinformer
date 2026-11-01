'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Link as LinkIcon,
  FileCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Layers,
  BarChart3
} from 'lucide-react';

const EXAMS = [
  { id: 'ssc-cgl', name: 'SSC CGL (Tier 1)', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Most Popular' },
  { id: 'ssc-chsl', name: 'SSC CHSL (Tier 1)', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Active' },
  { id: 'ssc-mts', name: 'SSC MTS & Havaldar', family: 'ssc', correct: 3.0, wrong: 1.0, tag: 'Active' },
  { id: 'ssc-gd', name: 'SSC GD Constable', family: 'ssc', correct: 2.0, wrong: 0.25, tag: 'Active' },
  { id: 'rrb-ntpc', name: 'RRB NTPC (CBT-1)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway' },
  { id: 'rrb-group-d', name: 'RRB Group D', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway' },
  { id: 'rrb-alp', name: 'RRB ALP (Assistant Loco Pilot)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway' },
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

const SAMPLE_DIGIALM_HTML = `
<!DOCTYPE html>
<html>
<head><title>Candidate Response Sheet</title></head>
<body>
<div class="main-info-pnl">
  <table>
    <tr><td>Participant ID</td><td>2201094821</td></tr>
    <tr><td>Participant Name</td><td>Rahul Sharma</td></tr>
    <tr><td>Test Center Name</td><td>iON Digital Zone iDZ Panki Kanpur</td></tr>
    <tr><td>Test Date</td><td>18/09/2024</td></tr>
    <tr><td>Test Time</td><td>9:00 AM - 10:00 AM</td></tr>
    <tr><td>Subject</td><td>Combined Graduate Level Examination 2024 Tier 1</td></tr>
  </table>
</div>
<div class="section-cntnr">
  <div class="section-lbl">Part A - General Intelligence and Reasoning</div>
  <div class="question-pnl">
    <div class="bold">Q.1 Select the related word from the given alternatives: Book : Author :: Statue : ?</div>
    <table class="tbl-quesOption">
      <tr class="rightAns"><td>1. Sculptor</td><td><img src="tick.png"></td></tr>
      <tr><td>2. Painter</td></tr>
      <tr><td>3. Mason</td></tr>
      <tr><td>4. Architect</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163101</td></tr>
      <tr><td>Status :</td><td>Answered</td></tr>
      <tr><td>Chosen Option :</td><td>1</td></tr>
    </table>
  </div>
  <div class="question-pnl">
    <div class="bold">Q.2 In a certain code language, CLOUD is written as DMRVE. How will RAIN be written?</div>
    <table class="tbl-quesOption">
      <tr class="rightAns"><td>1. SBJO</td><td><img src="tick.png"></td></tr>
      <tr><td>2. SCJP</td></tr>
      <tr><td>3. TBKO</td></tr>
      <tr><td>4. SBKO</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163102</td></tr>
      <tr><td>Status :</td><td>Answered</td></tr>
      <tr><td>Chosen Option :</td><td>2</td></tr>
    </table>
  </div>
</div>
</body>
</html>
`;

export default function ScoreCalculatorPage() {
  const router = useRouter();

  const [inputTab, setInputTab] = useState<'url' | 'html' | 'roll'>('url');
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [rollInput, setRollInput] = useState('');
  const [rollLoading, setRollLoading] = useState(false);
  const [savedSession, setSavedSession] = useState<any>(null);

  const [selectedExamId, setSelectedExamId] = useState('ssc-cgl');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedGender, setSelectedGender] = useState(GENDERS[0]);
  const [selectedState, setSelectedState] = useState(STATES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [selectedZone, setSelectedZone] = useState(RRB_ZONES[0]);

  // Custom marks
  const [customCorrect, setCustomCorrect] = useState(2.0);
  const [customWrong, setCustomWrong] = useState(0.5);

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

      // 2. Query server API / Supabase
      const res = await fetch(`/api/score-calculator/submissions?rollNumber=${encodeURIComponent(rollInput.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(`No evaluated scorecard found for Roll No. ${rollInput.trim()}. Please evaluate your answer key URL first.`);
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

    if (inputTab === 'url' && !answerKeyUrl.trim()) {
      setErrorMessage('Please enter your official Answer Key / Response Sheet URL.');
      return;
    }
    if (inputTab === 'html' && !htmlContent.trim()) {
      setErrorMessage('Please paste the HTML content or click "Load Sample Data".');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep('Connecting to evaluation engine...');

      const payload = {
        url: inputTab === 'url' ? answerKeyUrl.trim() : undefined,
        htmlContent: inputTab === 'html' ? htmlContent.trim() : undefined,
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

      setLoadingStep('Parsing candidate response sheet & questions...');

      const res = await fetch('/api/score-calculator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to evaluate answer key.');
      }

      setLoadingStep('Generating scorecard & All-India Shift ranks...');
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

  const handleLoadSample = () => {
    setInputTab('html');
    setHtmlContent(SAMPLE_DIGIALM_HTML.trim());
    setSelectedExamId('ssc-cgl');
    setErrorMessage('');
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
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          Paste your TCS iON, DigiALM, or SSC cbexams response sheet link to view instant raw scores, negative marks, shift averages, and estimated ranks.
        </p>
      </div>

      {/* Active Saved Session Banner (Rule 4) */}
      {savedSession && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/80 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
                Active Saved Session
              </span>
              <span className="text-xs text-sky-200">Roll: <strong>{savedSession.rollNumber}</strong></span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Welcome Back, {savedSession.candidateName}!
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Your Evaluated Marks: <strong className="text-emerald-300">{savedSession.finalScore}</strong> &bull; Category: <strong>{savedSession.category || 'General'}</strong> &bull; Shift: <strong>{savedSession.shiftTime} ({savedSession.examDate})</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/score-calculator/result?id=${savedSession.submissionId}`)}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Live Shift &amp; Category Rank</span>
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

      {/* Main Input Form Card with 3D Depth */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-3d p-5 sm:p-8 space-y-6">
        {/* Input Mode Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 gap-4 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setInputTab('url')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              inputTab === 'url'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Answer Key URL</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('roll')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              inputTab === 'roll'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Check by Roll Number</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('html')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              inputTab === 'html'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Paste HTML / Source Code</span>
          </button>
        </div>

        {/* Form when checking by Roll Number */}
        {inputTab === 'roll' ? (
          <form onSubmit={handleCheckByRoll} className="space-y-5">
            {/* Clear instructions as requested by user */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>How Roll Number Lookup Works</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-300">
                If you have checked your answer key on Exam Informer earlier, enter your <strong>Roll Number</strong> below to see your live shift &amp; category rank directly. If you haven&apos;t checked yet, please submit your answer key link in the <strong>&quot;Answer Key URL&quot;</strong> tab first, and then you can check anytime via Roll Number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Examination Roll Number / Participant ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2402094182"
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                />
                <button
                  type="submit"
                  disabled={rollLoading}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm btn-3d-primary cursor-pointer transition flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{rollLoading ? 'Searching...' : 'Find Scorecard & Rank'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Enter your official SSC or RRB Roll Number from your response sheet or admit card.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleCalculate} className="space-y-6">
          {/* URL Input */}
          {inputTab === 'url' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Response Sheet Link (URL)
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Load Sample Paper
                </button>
              </div>
              <input
                type="url"
                placeholder="https://sscexams.cbexams.com/candidateportal/response/... or https://ssc.digialm.com/..."
                value={answerKeyUrl}
                onChange={(e) => setAnswerKeyUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Official SSC answer key links start with <code className="text-blue-600 dark:text-blue-400 font-bold">https://sscexams.cbexams.com/</code> or <code className="text-blue-600 dark:text-blue-400 font-bold">https://ssc.digialm.com/</code>. Copy and paste the full URL from your browser.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Response Sheet HTML Code
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Load Sample Data
                </button>
              </div>
              <textarea
                rows={6}
                placeholder="Right-click on your response sheet page -> View Page Source (Ctrl+U) -> Copy and paste all HTML code here..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
              />
            </div>
          )}

          {/* Exam Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Exam &amp; Marking Pattern
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXAMS.map((exam) => {
                const isSelected = selectedExamId === exam.id;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`text-left p-3 rounded-xl border text-xs transition relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{exam.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>+{exam.correct} / -{exam.wrong}</span>
                      <span className="font-bold text-[9px] uppercase px-1 rounded bg-slate-200/60 dark:bg-slate-700">
                        {exam.family}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Marking Config */}
          {selectedExamId === 'custom' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Marks per Correct Answer
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={customCorrect}
                  onChange={(e) => setCustomCorrect(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Negative Penalty per Wrong
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={customWrong}
                  onChange={(e) => setCustomWrong(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Candidate Demographic Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category (For Category Rank)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Home State */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Home State / Domicile
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Examination Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* RRB Zone Selector: ONLY VISIBLE FOR RAILWAY EXAMS */}
            {isRRB && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                  Applied RRB Board / Zone (Mandatory for Railway Cutoffs)
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RRB_ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Evaluation Notice</div>
                <div className="text-[11px] mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 btn-3d-primary cursor-pointer transition ${
              loading
                ? 'bg-blue-400 cursor-not-allowed opacity-80'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingStep || 'Evaluating Answer Key...'}</span>
              </div>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Calculate Marks &amp; Ranks</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
