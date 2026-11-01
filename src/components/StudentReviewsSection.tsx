'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface StudentReview {
  id: string;
  student_name: string;
  avatar_url?: string;
  exam_title: string;
  review_category: string;
  rating: number;
  review_text: string;
  is_published?: boolean;
  order_index?: number;
  created_at?: string;
}

const CATEGORIES = [
  'All Feedback',
  'Mock Test Interface',
  'Website Experience',
  'Question Quality',
  'Performance Analysis'
];

export function StudentReviewsSection() {
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Feedback');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch('/api/reviews');
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews)) {
          setReviews(json.reviews);
        }
      } catch (e) {
        console.warn('Could not load student reviews from API:', e);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const filteredReviews = reviews.filter(r => {
    if (selectedCategory === 'All Feedback') return true;
    return r.review_category === selectedCategory;
  });

  const nextSlide = () => {
    if (filteredReviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredReviews.length);
  };

  const prevSlide = () => {
    if (filteredReviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredReviews.length) % filteredReviews.length);
  };

  // Visible window of reviews (shows up to 3 cards on desktop)
  const visibleReviews = filteredReviews.length > 0
    ? [
        filteredReviews[currentIndex % filteredReviews.length],
        filteredReviews[(currentIndex + 1) % filteredReviews.length],
        filteredReviews[(currentIndex + 2) % filteredReviews.length]
      ].filter(Boolean)
    : [];

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden bg-slate-950 text-white">
      {/* Background Neon Wave Glow Accents */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/70 border border-violet-700/60 text-violet-300 text-xs font-bold uppercase tracking-widest shadow-lg shadow-violet-950/40">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Student Reviews &amp; Genuine Feedback</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Helping thousands of students{' '}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              to succeed with speed
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real feedback from government exam aspirants across India on website speed, TCS mock interface accuracy, question explanations, and rank analytics.
          </p>
        </div>

        {/* Dynamic Curved Wave Graphic with Floating Student Avatar Nodes (Matches Dribbble Concept) */}
        <div className="relative w-full max-w-5xl mx-auto h-40 sm:h-52 select-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Wave 1 - Deep Purple */}
            <path
              d="M0 120 C 200 60, 400 180, 600 100 C 800 20, 900 140, 1000 90"
              stroke="url(#gradient-wave-1)"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className="opacity-60"
            />
            {/* Wave 2 - Neon Cyan / Indigo (Primary active track) */}
            <path
              d="M0 100 C 180 150, 360 40, 540 120 C 720 180, 880 70, 1000 110"
              stroke="url(#gradient-wave-2)"
              strokeWidth="3.5"
              className="opacity-90"
            />
            {/* Wave 3 - Violet Accent */}
            <path
              d="M0 80 C 220 30, 420 160, 620 90 C 820 40, 920 160, 1000 130"
              stroke="url(#gradient-wave-3)"
              strokeWidth="1.8"
              className="opacity-40"
            />

            <defs>
              <linearGradient id="gradient-wave-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="gradient-wave-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="gradient-wave-3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Student Avatar Nodes on Wave Curve */}
          <div className="absolute top-[40%] left-[8%] -translate-y-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Student"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-violet-400 shadow-lg shadow-violet-500/40 object-cover transform hover:scale-110 transition"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-violet-300 mt-1 opacity-80">Aaditya</span>
          </div>

          <div className="absolute top-[68%] left-[26%] -translate-y-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                alt="Student"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-cyan-400 shadow-lg shadow-cyan-500/40 object-cover transform hover:scale-110 transition"
              />
            </div>
            <span className="text-[10px] font-bold text-cyan-300 mt-1 opacity-80">Priya</span>
          </div>

          <div className="absolute top-[28%] left-[45%] -translate-y-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Student"
                className="w-10 h-10 sm:w-13 sm:h-13 rounded-full border-2 border-pink-400 shadow-lg shadow-pink-500/40 object-cover transform hover:scale-110 transition"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <span className="text-[10px] font-bold text-pink-300 mt-1 opacity-80">Rahul</span>
          </div>

          <div className="absolute top-[65%] left-[64%] -translate-y-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80"
                alt="Student"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-indigo-400 shadow-lg shadow-indigo-500/40 object-cover transform hover:scale-110 transition"
              />
            </div>
            <span className="text-[10px] font-bold text-indigo-300 mt-1 opacity-80">Neha</span>
          </div>

          <div className="absolute top-[32%] left-[82%] -translate-y-1/2 flex flex-col items-center group cursor-pointer">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                alt="Student"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-400 shadow-lg shadow-emerald-500/40 object-cover transform hover:scale-110 transition"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <span className="text-[10px] font-bold text-emerald-300 mt-1 opacity-80">Vikram</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Review Cards Carousel Grid */}
        <div className="relative">
          {filteredReviews.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Loading verified student reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleReviews.map((rev, idx) => (
                <div
                  key={`${rev.id}-${idx}`}
                  className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-violet-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40 group"
                >
                  {/* Subtle top card glow accent */}
                  <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition" />

                  <div className="space-y-4">
                    {/* Category tag & Stars */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-800/50">
                        {rev.review_category}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* Review Quote */}
                    <div className="relative text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                      <Quote className="w-6 h-6 text-violet-500/20 absolute -top-2 -left-2 -z-10 rotate-180" />
                      &ldquo;{rev.review_text}&rdquo;
                    </div>
                  </div>

                  {/* Student Bio */}
                  <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center gap-3">
                    <img
                      src={rev.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={rev.student_name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {rev.student_name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">
                        {rev.exam_title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Carousel Arrows */}
          {filteredReviews.length > 3 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Reviews"
                className="p-3 rounded-full bg-slate-900 border border-slate-800 hover:border-violet-500 text-slate-400 hover:text-white transition cursor-pointer active:scale-95 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-slate-500">
                {currentIndex + 1} / {filteredReviews.length}
              </span>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Reviews"
                className="p-3 rounded-full bg-slate-900 border border-slate-800 hover:border-violet-500 text-slate-400 hover:text-white transition cursor-pointer active:scale-95 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
