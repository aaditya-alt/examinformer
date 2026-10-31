'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  Search,
  Database,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  BarChart3,
  BookmarkCheck
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  category: string;
  attemptsCount: number;
  savedQuestionsCount: number;
  createdAt: string;
  lastSignInAt?: string;
}

interface Attempt {
  id: string;
  testId: string;
  candidateName: string;
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    overview: {
      totalCandidates: number;
      totalAttempts: number;
      avgScore: number;
      avgAccuracy: number;
      databaseConnected: boolean;
    };
    candidates: Candidate[];
    attempts: Attempt[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'candidates' | 'attempts' | 'analytics'>('candidates');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const filteredCandidates = data?.candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  ) || [];

  const filteredAttempts = data?.attempts.filter(a =>
    a.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.testId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">ExamInformer Admin Portal</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live Supabase database management: Candidates, Test Attempts, Question Analytics &amp; Saved Banks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Database
            </button>
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer shadow-md shadow-blue-500/20"
            >
              View Test Hall
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Candidates</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black">{data?.overview.totalCandidates ?? 0}</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-0.5 inline" /> In Database
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Test Attempts Recorded</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black">{data?.overview.totalAttempts ?? 0}</span>
              <span className="text-xs text-slate-500">Submissions</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Platform Score</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black">{data?.overview.avgScore ?? 0}</span>
              <span className="text-xs text-slate-500">Marks</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mean Accuracy</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black">{data?.overview.avgAccuracy ?? 0}%</span>
              <span className="text-xs text-indigo-600 font-semibold">Across CBTs</span>
            </div>
          </div>
        </div>

        {/* Controls & Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 border-b sm:border-b-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'candidates'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Candidates ({data?.candidates.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('attempts')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'attempts'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Test Attempts ({data?.attempts.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Question Analytics
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Querying Supabase database...</p>
          </div>
        ) : (
          <div>
            {/* TAB 1: CANDIDATES */}
            {activeTab === 'candidates' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-bold">Candidate Name</th>
                        <th className="py-3 px-4 font-bold">Email</th>
                        <th className="py-3 px-4 font-bold">Phone (Watermark ID)</th>
                        <th className="py-3 px-4 font-bold text-center">Attempts</th>
                        <th className="py-3 px-4 font-bold text-center">Saved Qs</th>
                        <th className="py-3 px-4 font-bold">Enrolled At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No registered candidates found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                              {c.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                              {c.email}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {c.phone}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {c.attemptsCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                {c.savedQuestionsCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : 'Recent'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ATTEMPTS */}
            {activeTab === 'attempts' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-bold">Attempt ID</th>
                        <th className="py-3 px-4 font-bold">Test Shift</th>
                        <th className="py-3 px-4 font-bold">Candidate</th>
                        <th className="py-3 px-4 font-bold text-center">Score</th>
                        <th className="py-3 px-4 font-bold text-center">Accuracy</th>
                        <th className="py-3 px-4 font-bold text-center">Time Spent</th>
                        <th className="py-3 px-4 font-bold">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredAttempts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            No test attempts recorded in database yet.
                          </td>
                        </tr>
                      ) : (
                        filteredAttempts.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-mono text-xs text-slate-500">
                              {a.id.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {a.testId}
                            </td>
                            <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                              {a.candidateName}
                            </td>
                            <td className="py-3 px-4 text-center font-black text-emerald-600">
                              {a.score}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {a.accuracy}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                              {formatSeconds(a.timeTakenSeconds)}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500">
                              {new Date(a.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: QUESTION ANALYTICS OVERVIEW */}
            {activeTab === 'analytics' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black">Question-Level Performance &amp; Timing Engine</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Every candidate answer records exact question solve timing and correctness directly into the Supabase database. These metrics feed live into candidate test solutions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Per-Question Timing</span>
                    <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">Active</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Exact seconds recorded per question in <code className="text-blue-600 font-mono">responses[qno].timeSpent</code>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average % Accuracy</span>
                    <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">Aggregated</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Calculated dynamically via <code className="text-blue-600 font-mono">/api/tests/[id]/analytics</code>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Bookmarks</span>
                    <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">Persistent</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Stored in Supabase on candidate metadata &amp; syncs automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
