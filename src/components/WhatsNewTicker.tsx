'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface TickerItem {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  link: string;
  actionText: string;
  isNew?: boolean;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: 'sel-post-2026',
    tag: 'LATEST 2026 EXAM',
    tagColor: 'bg-emerald-500 text-white',
    title: 'SSC Selection Post Phase 14 (2026) Official Tests — 27 Shifts (Graduation, Higher Secondary & Matriculation) Live Now!',
    link: '/tests?series=ssc-selection-post',
    actionText: 'Attempt Mock',
    isNew: true
  },
  {
    id: 'rrb-ntpc-ug',
    tag: 'RAILWAY 2025-26',
    tagColor: 'bg-blue-600 text-white',
    title: 'RRB NTPC Under Graduate (UG) 2025-26 — 97 Official Shifts CBT 1 & CBT 2 Live with Zone & Category Rank!',
    link: '/tests?series=rrb-ntpc-ug',
    actionText: 'View Tests',
    isNew: false
  },
  {
    id: 'rrb-alp-cbt2',
    tag: 'TCS PATTERN',
    tagColor: 'bg-amber-600 text-white',
    title: 'RRB ALP (CBT 1 & CBT 2 Trade Tests) 2026 — 175 Questions CBT Format with Trade Specialization!',
    link: '/tests?series=rrb-alp',
    actionText: 'Practice Now',
    isNew: false
  },
  {
    id: 'cgl-2026-upcoming',
    tag: 'COMING SOON',
    tagColor: 'bg-purple-600 text-white',
    title: 'SSC CGL 2026 & SSC CHSL 2026 Series — Official Shift Compilation Underway, Notification Releasing Soon!',
    link: '/tests',
    actionText: 'Explore',
    isNew: true
  }
];

export function WhatsNewTicker() {
  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 text-white overflow-hidden py-2 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-3">
        {/* Fixed Left Badge */}
        <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm z-10">
          <Flame className="w-3.5 h-3.5 fill-white animate-bounce" />
          <span className="hidden sm:inline">What&apos;s New</span>
          <span className="sm:hidden">New</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
        </div>

        {/* Marquee track moving left to right */}
        <div className="overflow-hidden flex-1 relative mask-linear-gradient">
          <div className="animate-marquee-ltr flex items-center gap-8 text-xs font-semibold py-0.5">
            {/* Repeat list twice for seamless continuous scroll */}
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                href={item.link}
                className="inline-flex items-center gap-2 text-slate-200 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 group cursor-pointer"
              >
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide ${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  {item.title}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-cyan-400 group-hover:underline">
                  <span>{item.actionText}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-slate-600 font-normal mx-1">|</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
