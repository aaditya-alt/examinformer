'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Pause,
  Check
} from 'lucide-react';

export default function Hero3DMockup() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(3 * 60 + 43); // 3:43 from user screenshot

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    setAnsweredCount(1);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setAnsweredCount(0);
  };

  const options = [
    { id: 0, text: '431' },
    { id: 1, text: '1231' },
    { id: 2, text: '3331' },
    { id: 3, text: '1331', correct: true },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-6 select-none font-sans">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 -top-6 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-emerald-500/15 blur-3xl -z-10 rounded-full" />

      {/* Floating 3D Badge 1: Top Left */}
      <div className="hidden sm:flex absolute -top-3 -left-2 z-20 items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md text-xs font-bold text-slate-800 dark:text-slate-100">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        <span>Official Eduquity SSC Simulator</span>
      </div>

      {/* Floating 3D Badge 2: Top Right */}
      <div className="hidden sm:flex absolute -top-3 -right-2 z-20 items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md text-xs font-bold text-slate-800 dark:text-slate-100">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span>179 Official 2025 Shifts Ingested</span>
      </div>

      {/* Main Eduquity CBT Simulation Window */}
      <div className="rounded-xl overflow-hidden bg-white text-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xl">
        {/* ── 1. Top Bar (Blue Zoom, Center Title, Fullscreen, Pause, Yellow Timer Box) ── */}
        <header className="h-11 px-3 sm:px-4 bg-[#f8fafc] border-b border-slate-300 flex items-center justify-between shrink-0">
          {/* Zoom Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="px-2.5 py-0.5 bg-[#1d4ed8] text-white font-bold text-xs rounded hover:bg-[#1e40af] transition shadow-2xs"
            >
              Zoom (+)
            </button>
            <button
              type="button"
              className="px-2.5 py-0.5 bg-[#1d4ed8] text-white font-bold text-xs rounded hover:bg-[#1e40af] transition shadow-2xs"
            >
              Zoom (-)
            </button>
          </div>

          {/* Test Title */}
          <div className="font-bold text-xs sm:text-sm text-slate-800 truncate px-2 text-center">
            1) Table of 11 Practice &bull; SSC 2025 Tier-1
          </div>

          {/* Right: Fullscreen, Pause, Yellow Timer Box */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block px-2 py-0.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-semibold rounded">
              Show Fullscreen
            </span>
            <span className="p-1 bg-white border border-slate-300 text-slate-700 rounded">
              <Pause className="w-3 h-3 fill-current" />
            </span>
            {/* Yellow Timer Box */}
            <div className="bg-[#fffbeb] border border-[#fef08a] px-2.5 py-0.5 rounded text-center leading-none">
              <div className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">Time Left</div>
              <div className="text-xs sm:text-sm font-black text-rose-600 font-mono tracking-wider mt-0.5">
                {formatTimer(timeLeft)}
              </div>
            </div>
          </div>
        </header>

        {/* ── 2. Sub-Header: SYMBOLS & INSTRUCTIONS (Red Underlined) ── */}
        <div className="px-3 sm:px-4 py-1 bg-[#f1f5f9] border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-rose-600 underline font-bold text-[11px] cursor-pointer hover:text-rose-700">
              SYMBOLS
            </span>
            <span className="text-rose-600 underline font-bold text-[11px] cursor-pointer hover:text-rose-700">
              INSTRUCTIONS
            </span>
          </div>

          <div className="text-[11px] text-slate-600 font-medium">
            Language: <strong className="text-slate-800">English</strong>
          </div>
        </div>

        {/* ── 3. Section Badges & Horizontal Action Buttons ── */}
        <div className="px-3 sm:px-4 py-1.5 bg-white border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
          {/* Green Section Badge */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider bg-[#15803d] text-white">
              QUANTITATIVE APTITUDE
            </span>
          </div>

          {/* Blue Action Buttons Row */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <button
              type="button"
              className="px-2.5 py-0.5 rounded bg-[#1d4ed8] text-white font-bold text-[11px] hover:bg-[#1e40af] transition"
            >
              Previous
            </button>
            <button
              type="button"
              className="px-2.5 py-0.5 rounded bg-[#1d4ed8] text-white font-bold text-[11px] hover:bg-[#1e40af] transition"
            >
              Mark For Review
            </button>
            <button
              type="button"
              onClick={() => handleSelect(3)}
              className="px-2.5 py-0.5 rounded bg-[#1d4ed8] text-white font-bold text-[11px] hover:bg-[#1e40af] transition"
            >
              Save &amp; Next
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-0.5 rounded bg-[#1d4ed8] text-white font-bold text-[11px] hover:bg-[#1e40af] transition"
            >
              Clear
            </button>
            <button
              type="button"
              disabled
              className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-blue-200 text-blue-800 font-bold text-[11px] opacity-75 cursor-not-allowed"
            >
              Submit Section
            </button>
            <Link
              href="/tests/ssc-cgl-2025-shift-1"
              className="px-2.5 py-0.5 rounded bg-[#1d4ed8] text-white font-bold text-[11px] hover:bg-[#1e40af] transition"
            >
              Submit Test
            </Link>
          </div>

          {/* Right Info: Marks & Answered */}
          <div className="flex items-center gap-2 text-[11px] text-slate-700 whitespace-nowrap">
            <span className="hidden md:inline">
              Marks for correct: <strong className="text-slate-900">2.00</strong> | Negative: <strong className="text-slate-900">0.50</strong>
            </span>
            <span>
              Total Answered: <strong className="text-rose-600 font-black">{answeredCount}</strong>
            </span>
          </div>
        </div>

        {/* ── 4. Workspace: Left Question Area vs Right Palette ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[300px]">
          {/* LEFT: Question Area with Roll Number Watermark */}
          <div className="lg:col-span-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-300">
            {/* Question Line: Question: 1 | Last 4 Minutes | Save | Report */}
            <div className="px-3 sm:px-4 py-1 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 text-xs">
                Question: 1
              </span>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-rose-600">
                  Last 4 Minutes
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelect(3)}
                    className="px-2 py-0.5 rounded bg-[#16a34a] text-white font-bold text-[11px] hover:bg-[#15803d]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded bg-[#dc2626] text-white font-bold text-[11px] hover:bg-[#b91c1c]"
                  >
                    Report
                  </button>
                </div>
              </div>
            </div>

            {/* Question Content with Watermark */}
            <div
              className="p-4 sm:p-6 space-y-4 flex-1 text-left"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='130'%3E%3Ctext x='15' y='75' fill='%2394a3b8' opacity='0.16' font-family='sans-serif' font-weight='900' font-size='19' transform='rotate(-22 15 75)'%3E9990287066%3C/text%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}
            >
              {/* Exam Origin Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px] font-semibold text-slate-700">
                <span className="text-blue-700 font-bold uppercase tracking-wider text-[9px] bg-blue-100 px-1 py-0.2 rounded">
                  📌 Official Shift
                </span>
                <span>SSC CGL 2025 Tier-1 &bull; 12 Sept 2025 (Shift 1)</span>
              </div>

              {/* Math Question Text */}
              <div className="text-base font-normal text-slate-900 pt-1">
                <span className="font-mono text-lg font-bold">11 &times; 121 = ?</span>
              </div>

              {/* Options with horizontal divider lines and strict radio button clicking */}
              <div className="space-y-0 pt-2 border-t border-slate-200">
                {options.map((opt) => {
                  const isChecked = selectedOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-4 py-2.5 px-1 border-b border-slate-200/80 transition select-none ${
                        isChecked ? 'bg-blue-50/60' : 'bg-transparent'
                      }`}
                    >
                      {/* Round Radio Button strictly clickable */}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isChecked}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(opt.id);
                        }}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-90 ${
                          isChecked ? 'border-blue-600 bg-white ring-2 ring-blue-500/25' : 'border-slate-400 hover:border-blue-600 bg-white'
                        }`}
                      >
                        {isChecked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </button>

                      <span className="text-sm text-slate-800 font-mono font-medium">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Footer */}
            <div className="px-4 py-2 bg-[#f8fafc] border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Clear Response
              </button>

              <Link
                href="/tests/ssc-cgl-2025-shift-1"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 btn-3d-primary"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Full Official 2025 CBT Mock</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT: Eduquity Palette Sidebar (▶ Quantitative Aptitude, 5-col grid, Analysis box) */}
          <aside className="lg:col-span-4 bg-white flex flex-col justify-between">
            <div>
              {/* Section Header with Blue Play Triangle */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2">
                <span className="text-[#1d4ed8] text-base font-black leading-none">▶</span>
                <h4 className="font-bold text-xs text-slate-900 tracking-tight">Quantitative Aptitude</h4>
              </div>

              {/* 5-Column Question Grid */}
              <div className="p-3.5">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                    const isQ1Answered = num === 1 && selectedOption !== null;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (num === 1) handleSelect(3);
                        }}
                        className={`h-8 rounded font-bold text-xs flex items-center justify-center transition ${
                          isQ1Answered
                            ? 'bg-[#15803d] text-white ring-1 ring-emerald-500'
                            : num === 1
                            ? 'bg-[#1d4ed8] text-white ring-2 ring-amber-400'
                            : 'bg-[#1d4ed8] text-white hover:bg-[#1e40af]'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Analysis Box (Tan header bg-[#d7cdbd], red/orange count digits) */}
            <div className="border-t border-slate-300 bg-white">
              <div className="bg-[#d7cdbd] text-slate-900 text-xs font-bold py-1.5 px-3.5 text-left">
                Quantitative Aptitude Analysis
              </div>
              <div className="p-3 text-xs space-y-1.5 font-bold text-slate-800">
                <div className="flex items-center justify-between">
                  <span>Answered</span>
                  <span className="text-rose-600 font-black text-sm">
                    {answeredCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Not Answered</span>
                  <span className="text-orange-500 font-black text-sm">
                    {20 - answeredCount}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
