'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function Hero3DMockup() {
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D'>('D');
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(51 * 60 + 11); // 51:11
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Live ticking timer for authenticity
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sections = [
    { key: 'A', name: 'PART-A', subject: 'General Intelligence', count: 25 },
    { key: 'B', name: 'PART-B', subject: 'General Awareness', count: 25 },
    { key: 'C', name: 'PART-C', subject: 'Quantitative Aptitude', count: 25 },
    { key: 'D', name: 'PART-D', subject: 'English Comprehension', count: 25 },
  ];

  const options = [
    { id: 0, text: 'PQRS' },
    { id: 1, text: 'QPRS' },
    { id: 2, text: 'RSPQ' },
    { id: 3, text: 'SPRQ' },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1200 py-6 sm:py-10">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 -top-10 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-emerald-500/15 blur-3xl -z-10 rounded-full" />

      {/* Floating 3D Badge 1: Top Left */}
      <div className="hidden sm:flex absolute -top-3 -left-4 z-20 items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-xl floating-3d-slow text-xs font-bold text-slate-800 dark:text-slate-100">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Eduquity 2026-27 CBT Standard</span>
      </div>

      {/* Floating 3D Badge 2: Top Right */}
      <div className="hidden sm:flex absolute -top-5 -right-4 z-20 items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-xl floating-3d-fast text-xs font-bold text-slate-800 dark:text-slate-100">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span>AIR #1 Score: 191.5 / 200</span>
      </div>

      {/* Main 3D Card Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="hero-3d-card rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-500 preserve-3d"
      >
        {/* CBT Window Top Navigation Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm tracking-tight">EXAM INFORMER</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold">
                SSC CGL (Eduquity Pattern Based) Revision Full Test - 01
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live LED Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-inner">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 text-[10px]">TIME LEFT</span>
              <span className="text-emerald-400">{formatTimer(timeLeft)}</span>
            </div>

            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-rose-600 dark:text-rose-400 font-bold">Last 51 Minutes</span>
            </span>
          </div>
        </div>

        {/* Eduquity Section Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            {sections.map((sec) => {
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key as any)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                    {sec.key}
                  </span>
                  <span>{sec.name}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Language: <strong>English</strong></span>
          </div>
        </div>

        {/* Split Body: Question Area (Left) & Eduquity Right Palette (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          {/* Left: Question Content Area */}
          <div className="lg:col-span-8 p-5 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                    Question No. 2
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Marks: +2.0 / -0.50</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                  PART-D: English Comprehension
                </div>
              </div>

              {/* Question Body */}
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-2 leading-relaxed font-sans">
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Directions: The first and sixth sentences are given in the beginning as S1 and S6. The middle four sentences in each have been jumbled up and labelled as P, Q, R and S. Find the proper sequence:
                </p>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 font-mono">
                  <p><strong>S1:</strong> Global warming has escalated the severity and frequency of natural disasters worldwide.</p>
                  <p><strong>S6:</strong> This multi-faceted approach is crucial for the long-term sustainability of our planet.</p>
                  <p><strong>P:</strong> Governments and organizations are now prioritizing the development of sustainable energy sources.</p>
                  <p><strong>Q:</strong> Consequently, there has been a global push towards adopting more resilient infrastructure.</p>
                  <p><strong>R:</strong> The aim is to reduce carbon emissions and combat the adverse effects of climate change.</p>
                  <p><strong>S:</strong> Additionally, educational campaigns have been launched to raise awareness.</p>
                </div>
              </div>

              {/* Radio Options List */}
              <div className="space-y-2 pt-1">
                {options.map((opt) => {
                  const isChecked = selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id)}
                      className={`group flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {/* Interactive Radio Circle Button */}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isChecked}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOption(opt.id);
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                          isChecked
                            ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-sm'
                            : 'border-slate-400 dark:border-slate-500 group-hover:border-blue-500'
                        }`}
                      >
                        {isChecked && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </button>
                      <span>{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Eduquity Action Buttons with 3D Tactile Styling */}
            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  Mark for Review &amp; Next
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOption((prev) => (prev + 1) % 4)}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  Save &amp; Next
                </button>
              </div>

              <Link
                href="/tests/cgl-2025-12-sep-shift-3"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Launch Live Test</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right: Question Number Palette (Eduquity Grid 1..25) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-850/50 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Question Palette ({sections.find((s) => s.key === activeSection)?.subject})
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">25 Qs</span>
              </div>

              {/* 5x5 Matrix Buttons */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                  let statusColor = 'bg-blue-600 text-white'; // Not visited
                  if (num === 1) statusColor = 'bg-emerald-600 text-white'; // Answered
                  if (num === 2) statusColor = 'bg-blue-600 ring-2 ring-blue-400 text-white'; // Current
                  if (num === 3) statusColor = 'bg-rose-600 text-white'; // Not answered
                  if (num === 4) statusColor = 'bg-purple-600 text-white'; // Marked for review

                  return (
                    <button
                      key={num}
                      type="button"
                      className={`h-7 sm:h-8 rounded font-mono text-xs font-bold flex items-center justify-center shadow-xs transition active:scale-90 cursor-pointer ${statusColor}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Eduquity Color Legend */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                    <span>Answered (1)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                    <span>Not Answered (1)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                    <span>Marked Review (1)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">22</span>
                    <span>Not Visited (22)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Summary Panel */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Attempt Status</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">1 / 25 Answered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating 3D Badge 3: Bottom Center */}
      <div className="hidden sm:flex absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Authentic Full-Screen CBT • Pause &amp; Resume Any Time</span>
      </div>
    </div>
  );
}
