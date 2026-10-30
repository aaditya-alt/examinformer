'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluationResult } from '@/lib/scoreService';
import { CBTTest } from '@/lib/testService';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  BookOpen,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminStudioPage() {
  const [submissions, setSubmissions] = useState<EvaluationResult[]>([]);
  const [tests, setTests] = useState<CBTTest[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'tests'>('submissions');
  const [loading, setLoading] = useState(true);
  const [pushingId, setPushingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/score-calculator/submissions').then(r => r.json()),
      fetch('/api/tests').then(r => r.json())
    ])
      .then(([subJson, testJson]) => {
        if (subJson.success && subJson.data) {
          setSubmissions(subJson.data);
        }
        if (testJson.success && testJson.data) {
          setTests(testJson.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePushToMock = async (submissionId: string) => {
    try {
      setPushingId(submissionId);
      const res = await fetch('/api/admin/push-to-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      });
      const json = await res.json();
      if (json.success) {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        loadData();
      } else {
        alert(json.error || 'Failed to push submission to mock test.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setPushingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Answer Key Ingestion &amp; CBT Test Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review scraped candidate response sheets, verify question extractions, and publish them with 1-click into the CBT Mock Test Series.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'submissions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Ingested Answer Keys ({submissions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Published CBT Mock Tests ({tests.length})</span>
        </button>
      </div>

      {/* Tab 1: Submissions Pipeline */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                No Answer Keys Ingested Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When students enter their answer key URLs or paste response sheets in the Score Calculator, they will appear here ready to be published as official CBT mock tests.
              </p>
              <div className="pt-2">
                <Link
                  href="/score-calculator"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Evaluate Sample Answer Key</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions.map((sub) => {
                const isPushed = !!sub.pushedToTestId;
                const isPushing = pushingId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    {/* Left Meta */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                          {sub.parsed.meta.examFamily}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {sub.parsed.meta.examTitle || 'Official Response Sheet'}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>Candidate: <b className="text-slate-700 dark:text-slate-200">{sub.parsed.meta.candidateName || 'N/A'}</b></span>
                        <span>Roll: <b className="font-mono text-slate-700 dark:text-slate-200">{sub.parsed.meta.rollNo || 'N/A'}</b></span>
                        <span>Date: <b className="text-slate-700 dark:text-slate-200">{sub.parsed.meta.examDate || 'N/A'}</b></span>
                        <span>Shift: <b className="text-slate-700 dark:text-slate-200">{sub.parsed.meta.shiftTime || 'N/A'}</b></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          Total Questions: <b>{sub.parsed.summary.totalQuestions}</b>
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Candidate Score: <b>{sub.parsed.summary.finalScore}</b>
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                          Sections: <b>{sub.parsed.sections.length}</b>
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Link
                        href={`/score-calculator/result?id=${sub.id}`}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <span>Review Paper</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {isPushed ? (
                        <Link
                          href={`/tests/${sub.pushedToTestId}`}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>View Live Mock Test &rarr;</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handlePushToMock(sub.id)}
                          disabled={isPushing}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/20 flex items-center gap-2 transition active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isPushing ? 'Converting Questions...' : '⚡ Push to Mock Tests'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Published Tests */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {t.examCode.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Active in CBT</span>
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-2">
                  {t.title}
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800 text-slate-500">
                  <div>Q: <b>{t.totalQuestions}</b></div>
                  <div>M: <b>{t.totalMarks}</b></div>
                  <div>T: <b>{t.durationMinutes}m</b></div>
                </div>
              </div>

              <div>
                <Link
                  href={`/tests/${t.id}`}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Launch Test Interface</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
