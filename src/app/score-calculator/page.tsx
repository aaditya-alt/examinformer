'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Link as LinkIcon,
  FileCode,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const EXAMS = [
  { id: 'ssc-cgl', name: 'SSC CGL (Tier 1)', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Most Popular' },
  { id: 'ssc-chsl', name: 'SSC CHSL (Tier 1)', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Active' },
  { id: 'ssc-mts', name: 'SSC MTS & Havaldar', family: 'ssc', correct: 3.0, wrong: 1.0, tag: 'Active' },
  { id: 'ssc-gd', name: 'SSC GD Constable', family: 'ssc', correct: 2.0, wrong: 0.5, tag: 'Active' },
  { id: 'rrb-ntpc', name: 'RRB NTPC (CBT-1)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway' },
  { id: 'rrb-group-d', name: 'RRB Group D', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway' },
  { id: 'rrb-alp', name: 'RRB ALP (Assistant Loco Pilot)', family: 'rrb', correct: 1.0, wrong: 0.33, tag: 'Railway' },
  { id: 'custom', name: 'Custom Exam Pattern', family: 'other', correct: 1.0, wrong: 0.25, tag: 'Flexible' },
];

const CATEGORIES = ['UR (General)', 'OBC (Non-Creamy)', 'EWS', 'SC', 'ST', 'ESM', 'PwD'];

const ZONES = [
  'All India (Standard)',
  'RRB Allahabad (Prayagraj)',
  'RRB Mumbai',
  'RRB Kolkata',
  'RRB Chandigarh',
  'RRB Secunderabad',
  'RRB Chennai',
  'RRB Patna',
  'RRB Bhopal',
  'RRB Bangalore',
  'SSC Northern Region (NR)',
  'SSC Central Region (CR)',
  'SSC Eastern Region (ER)',
  'SSC Western Region (WR)',
  'SSC Southern Region (SR)',
];

// Sample Response Sheet HTML snippet for immediate 1-click testing
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
      <tr><td>1. Sculptor</td></tr>
      <tr class="rightAns"><td>2. Painter</td><td><img src="tick.png"></td></tr>
      <tr><td>3. Mason</td></tr>
      <tr><td>4. Scientist</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163101</td></tr>
      <tr><td>Status :</td><td>Answered</td></tr>
      <tr><td>Chosen Option :</td><td>2</td></tr>
    </table>
  </div>
  <div class="question-pnl">
    <div class="bold">Q.2 Find the missing number: 4, 9, 16, 25, ?</div>
    <table class="tbl-quesOption">
      <tr class="rightAns"><td>1. 36</td><td><img src="tick.png"></td></tr>
      <tr><td>2. 49</td></tr>
      <tr><td>3. 32</td></tr>
      <tr><td>4. 30</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163102</td></tr>
      <tr><td>Status :</td><td>Answered</td></tr>
      <tr><td>Chosen Option :</td><td>1</td></tr>
    </table>
  </div>
  <div class="question-pnl">
    <div class="bold">Q.3 Which number does not belong to the group: 8, 27, 64, 100, 125?</div>
    <table class="tbl-quesOption">
      <tr><td>1. 8</td></tr>
      <tr class="rightAns"><td>2. 100</td><td><img src="tick.png"></td></tr>
      <tr><td>3. 64</td></tr>
      <tr><td>4. 125</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163103</td></tr>
      <tr><td>Status :</td><td>Answered</td></tr>
      <tr><td>Chosen Option :</td><td>3</td></tr>
    </table>
  </div>
  <div class="question-pnl">
    <div class="bold">Q.4 In a certain code language, CAT is written as 24. How is DOG written?</div>
    <table class="tbl-quesOption">
      <tr class="rightAns"><td>1. 26</td><td><img src="tick.png"></td></tr>
      <tr><td>2. 28</td></tr>
      <tr><td>3. 30</td></tr>
      <tr><td>4. 24</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163104</td></tr>
      <tr><td>Status :</td><td>Not Answered</td></tr>
      <tr><td>Chosen Option :</td><td>--</td></tr>
    </table>
  </div>
</div>
<div class="section-cntnr">
  <div class="section-lbl">Part B - General Awareness</div>
  <div class="question-pnl">
    <div class="bold">Q.5 Who was the first Governor-General of independent India?</div>
    <table class="tbl-quesOption">
      <tr class="rightAns"><td>1. Lord Mountbatten</td><td><img src="tick.png"></td></tr>
      <tr><td>2. C. Rajagopalachari</td></tr>
      <tr><td>3. Dr. Rajendra Prasad</td></tr>
      <tr><td>4. Lord Wavell</td></tr>
    </table>
    <table class="menu-tbl">
      <tr><td>Question ID :</td><td>441009163105</td></tr>
      <tr><td>Status :</td><td>Answered</td></tr>
      <tr><td>Chosen Option :</td><td>1</td></tr>
    </table>
  </div>
</div>
</body>
</html>
`;

export default function ScoreCalculatorPage() {
  const router = useRouter();

  const [inputTab, setInputTab] = useState<'url' | 'html'>('url');
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('ssc-cgl');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedZone, setSelectedZone] = useState(ZONES[0]);

  // Custom marks
  const [customCorrect, setCustomCorrect] = useState(2.0);
  const [customWrong, setCustomWrong] = useState(0.5);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const currentExam = EXAMS.find(e => e.id === selectedExamId) || EXAMS[0];

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
        zone: selectedZone,
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

      setLoadingStep('Computing shift rankings & saving scorecard...');

      // Store in session storage for instantaneous result rendering
      sessionStorage.setItem('current_evaluation', JSON.stringify(json.data));

      router.push(`/score-calculator/result?id=${json.data.id}`);
    } catch (err: any) {
      console.error('Calculation failed:', err);
      setErrorMessage(err.message || 'Something went wrong while evaluating the response sheet.');
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Hero Banner */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-500" />
          <span>Universal Response Key Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Answer Key &amp; Rank Calculator
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
          Paste your official TCS iON, DigiALM, or SSC response sheet link. Instant All-India Rank, shift percentile, sectional marks &amp; accuracy analysis.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Method Toggle Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setInputTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition ${
              inputTab === 'url'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Response Key URL</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('html')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition ${
              inputTab === 'html'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Paste HTML / Offline Sheet</span>
          </button>
        </div>

        <form onSubmit={handleCalculate} className="p-6 sm:p-8 space-y-6">
          {/* Quick Demo Button */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Want to test without a live key? Try our verified sample data instantly.</span>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex-shrink-0 shadow-sm"
            >
              Load Sample Key
            </button>
          </div>

          {/* Input field based on tab */}
          {inputTab === 'url' ? (
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                Official Answer Key URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://cdn.digialm.com//per/g06/pub/..."
                  value={answerKeyUrl}
                  onChange={(e) => setAnswerKeyUrl(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Supports DigiALM, TCS iON, SSC cbexams, and Railway exam portals.</span>
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                Response Sheet HTML Source <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="Right-click on your response sheet page -> View Page Source (Ctrl+U) -> Copy and paste all HTML code here..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Ideal when the official link has expired or access from your current network is restricted.
              </p>
            </div>
          )}

          {/* Exam Selection Grid */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Select Exam &amp; Marking Pattern
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EXAMS.map((exam) => {
                const isSelected = selectedExamId === exam.id;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`text-left p-3 rounded-2xl border text-xs transition relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{exam.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>+{exam.correct} / -{exam.wrong}</span>
                      <span className="font-semibold text-[9px] uppercase px-1 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800">
                        {exam.family}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Marking Config if Custom Exam selected */}
          {selectedExamId === 'custom' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Marks per Correct Answer
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={customCorrect}
                  onChange={(e) => setCustomCorrect(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-sm font-bold"
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
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-sm font-bold"
                />
              </div>
            </div>
          )}

          {/* Category & Zone Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category (For Category Rank)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Zone / Region (For Regional Cutoffs)
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Evaluation Notice</div>
                <div className="text-xs mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base text-white flex items-center justify-center gap-2 shadow-lg transition ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/25 active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingStep || 'Evaluating Response Sheet...'}</span>
              </div>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                <span>Calculate Marks &amp; Ranks</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Guide & Instructions Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center font-black text-sm">
            1
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Open Official Portal</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log in to the official SSC or RRB examination portal with your Roll Number and Password / DOB to view your response sheet.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center font-black text-sm">
            2
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Copy Response URL</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Copy the complete web address from the browser address bar (starts with <code>https://cdn.digialm.com/...</code>).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center font-black text-sm">
            3
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Get Verified Ranks</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste the link above to instantly receive verified marks, section breakdown, All-India Rank, and category percentile.
          </p>
        </div>
      </div>
    </div>
  );
}
