'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MathRenderer } from '@/components/MathRenderer';
import {
  Bookmark,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Search,
  ExternalLink,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface SavedQuestionItem {
  id: string;
  testId?: string;
  testTitle?: string;
  qno: number;
  questionText: string;
  questionTextHi?: string;
  options: { id: number; text: string; textHi?: string }[];
  correctOption: number;
  explanation?: string;
  sectionName?: string;
  examOrigin?: string;
  savedAt: number;
}

export default function SavedQuestionsPage() {
  const [savedList, setSavedList] = useState<SavedQuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [languageMode, setLanguageMode] = useState<Record<string, 'en' | 'hi'>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('examinformer_saved_questions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedList(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read saved questions:', e);
    }
  }, []);

  const handleRemoveQuestion = (id: string) => {
    const updated = savedList.filter((item) => item.id !== id);
    setSavedList(updated);
    try {
      localStorage.setItem('examinformer_saved_questions', JSON.stringify(updated));
    } catch (e) {}
  };

  const filtered = savedList.filter((item) => {
    if (selectedSubject !== 'all') {
      const sec = (item.sectionName || '').toLowerCase();
      if (selectedSubject === 'math' && !sec.includes('quant') && !sec.includes('math')) return false;
      if (selectedSubject === 'reasoning' && !sec.includes('reason') && !sec.includes('intelligence')) return false;
      if (selectedSubject === 'english' && !sec.includes('english')) return false;
      if (selectedSubject === 'ga' && !sec.includes('aware') && !sec.includes('ga') && !sec.includes('gk')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.questionText.toLowerCase().includes(q) ||
        (item.questionTextHi && item.questionTextHi.toLowerCase().includes(q)) ||
        (item.testTitle && item.testTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/tests"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                <span>Saved Questions Library</span>
              </h1>
              <p className="text-xs text-slate-500">
                Review questions bookmarked during official CBT mocks &amp; solution sessions.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {savedList.length} Questions Saved
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'math', label: 'Quant' },
              { id: 'reasoning', label: 'Reasoning' },
              { id: 'english', label: 'English' },
              { id: 'ga', label: 'General Awareness' }
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubject(sub.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedSubject === sub.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Questions List */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 space-y-4">
            <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No saved questions found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the Bookmark icon while attempting any mock test or reviewing solutions to save challenging questions here for future revision.
              </p>
            </div>
            <Link
              href="/tests"
              className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs"
            >
              Explore CBT Mock Tests
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((item, idx) => {
              const lang = languageMode[item.id] || 'en';
              const textToRender = lang === 'hi' && item.questionTextHi ? item.questionTextHi : item.questionText;

              return (
                <div
                  key={item.id || idx}
                  className="p-6 rounded-3xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4"
                >
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                        {item.sectionName || 'General Section'}
                      </span>
                      {item.examOrigin && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {item.examOrigin}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Language Toggle */}
                      {item.questionTextHi && (
                        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setLanguageMode((prev) => ({ ...prev, [item.id]: 'en' }))}
                            className={`px-2 py-0.5 ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            EN
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguageMode((prev) => ({ ...prev, [item.id]: 'hi' }))}
                            className={`px-2 py-0.5 ${lang === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            HI
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text with KaTeX */}
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    <span className="font-black mr-1.5">Q.{idx + 1})</span>
                    <MathRenderer content={textToRender} />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {item.options?.map((opt) => {
                      const isCorrect = opt.id === item.correctOption;
                      const optText = lang === 'hi' && opt.textHi ? opt.textHi : opt.text;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="flex-1">
                            <MathRenderer content={optText} />
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation with KaTeX */}
                  {item.explanation && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Step-by-Step Mathematical Explanation:</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        <MathRenderer content={item.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
