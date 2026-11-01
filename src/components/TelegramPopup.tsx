'use client';

import React, { useState, useEffect } from 'react';
import { BRANDING } from '@/lib/branding';
import { Send, X, ShieldCheck, Sparkles, CheckCircle2, BellRing, ArrowRight } from 'lucide-react';

export function TelegramPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    // Check if shown in this session
    try {
      const shown = sessionStorage.getItem('ei_tg_popup_dismissed');
      if (shown) return;
    } catch (_) {}

    // Show popup after 600ms
    const openTimer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(openTimer);
  }, []);

  // Countdown timer for 5 seconds
  useEffect(() => {
    if (!isOpen || canClose) return;

    if (secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [isOpen, secondsLeft, canClose]);

  const handleDismiss = () => {
    if (!canClose) return;
    setIsOpen(false);
    try {
      sessionStorage.setItem('ei_tg_popup_dismissed', 'true');
    } catch (_) {}
  };

  const handleJoin = () => {
    window.open(BRANDING.telegramUrl, '_blank', 'noopener,noreferrer');
    setCanClose(true);
    setIsOpen(false);
    try {
      sessionStorage.setItem('ei_tg_popup_dismissed', 'true');
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-7 text-center card-3d overflow-hidden preserve-3d">
        {/* Top Gradient Accent Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-[#0088cc] to-emerald-500" />

        {/* Top Right Cross (X) Button - Visible ONLY after 5s countdown */}
        {canClose ? (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close Popup"
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 select-none">
            {secondsLeft}s
          </div>
        )}

        {/* Floating 3D Telegram Icon Badge */}
        <div className="relative mx-auto mt-2 mb-4 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#34aadc] flex items-center justify-center text-white shadow-xl shadow-[#0088cc]/30 floating-3d-slow border-2 border-white/40">
          <Send className="w-8 h-8 sm:w-9 sm:h-9 -ml-1 fill-current" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
            <BellRing className="w-3 h-3" />
            Official Examination Alerts
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Join Exam Informer Telegram
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            Get instant shift answer keys, cutoffs, Eduquity CBT mock sets, and normalisation predictions before anyone else.
          </p>
        </div>

        {/* Perks Checklist */}
        <div className="my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">Direct Answer Key Links &amp; PDF Solutions</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">Shift-wise Difficulty &amp; Cutoff Audits</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">Official SSC &amp; RRB 2026-27 Notices</span>
          </div>
        </div>

        {/* CTA 3D Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleJoin}
            className="w-full py-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-black text-sm flex items-center justify-center gap-2 btn-3d-primary cursor-pointer shadow-lg shadow-[#0088cc]/30"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>Join Telegram Channel Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={BRANDING.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <span>Subscribe on YouTube (ExamInformerNitesh)</span>
          </a>

          {/* Cancel or Continue Button */}
          {canClose ? (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Continue to Website &rarr;
            </button>
          ) : (
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5">
              Continue button will unlock in <strong className="text-slate-600 dark:text-slate-300">{secondsLeft}s</strong>...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
