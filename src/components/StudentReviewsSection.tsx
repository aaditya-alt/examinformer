'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, MessageSquarePlus, CheckCircle2, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

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
  'All Reviews',
  'Mock Test Interface',
  'Question Quality',
  'Website Speed',
  'Performance Analysis'
];

export function StudentReviewsSection() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Reviews');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Review submission modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [formName, setFormName] = useState('');
  const [formExam, setFormExam] = useState('SSC CGL 2025 Aspirant');
  const [formCategory, setFormCategory] = useState('Mock Test Interface');
  const [formRating, setFormRating] = useState(5);
  const [formReview, setFormReview] = useState('');

  // Fetch reviews from Supabase API
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const json = await res.json();
      if (json.success && Array.isArray(json.reviews)) {
        setReviews(json.reviews);
      }
    } catch (e) {
      console.warn('Could not load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (selectedCategory === 'All Reviews') return true;
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

  // Up to 3 visible reviews on desktop, 1 on mobile
  const visibleReviews = filteredReviews.length > 0
    ? [
        filteredReviews[currentIndex % filteredReviews.length],
        filteredReviews[(currentIndex + 1) % filteredReviews.length],
        filteredReviews[(currentIndex + 2) % filteredReviews.length]
      ].filter(Boolean)
    : [];

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!formName.trim() || !formReview.trim() || !formExam.trim()) {
      setSubmitError('Please fill in your name, target examination, and feedback.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: formName.trim(),
          exam_title: formExam.trim(),
          review_category: formCategory,
          rating: formRating,
          review_text: formReview.trim(),
          is_published: true
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit review');
      }

      setSubmitSuccess(true);
      // Prepend newly added review directly into state
      if (json.review) {
        setReviews((prev) => [json.review, ...prev]);
      } else {
        fetchReviews();
      }

      setTimeout(() => {
        setModalOpen(false);
        setSubmitSuccess(false);
        setFormReview('');
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong while posting your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Genuine Student Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            What Aspirants Say About MockYoddha
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real feedback from SSC &amp; Railway aspirants on CBT mock accuracy, speed, and solutions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (user?.name) setFormName(user.name);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reviews Cards Grid */}
      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No reviews in this category yet. Be the first aspirant to share your feedback!
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visibleReviews.map((rev, idx) => {
              const initials = (rev.student_name || 'Candidate')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={rev.id || idx}
                  className="p-5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Stars and Category badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {rev.review_category}
                      </span>
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      &ldquo;{rev.review_text}&rdquo;
                    </p>
                  </div>

                  {/* Student profile */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 font-black text-xs flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {rev.student_name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        {rev.exam_title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation controls if more than 3 reviews */}
          {filteredReviews.length > 3 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={prevSlide}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                aria-label="Previous Reviews"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-500">
                {currentIndex + 1} / {filteredReviews.length}
              </span>
              <button
                type="button"
                onClick={nextSlide}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                aria-label="Next Reviews"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── WRITE A REVIEW MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Write Your Review
                </h3>
                <p className="text-xs text-slate-500">
                  Share your genuine mock experience with fellow aspirants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  Review Published Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Thank you for contributing your genuine feedback to the community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3.5">
                {submitError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Vikas Sharma"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Exam Target / Status
                    </label>
                    <input
                      type="text"
                      required
                      value={formExam}
                      onChange={(e) => setFormExam(e.target.value)}
                      placeholder="e.g. SSC CGL 2025 Aspirant"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Feedback Area
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    >
                      <option value="Mock Test Interface">Mock Test Interface</option>
                      <option value="Question Quality">Question Quality</option>
                      <option value="Website Speed">Website Speed</option>
                      <option value="Performance Analysis">Performance Analysis</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormRating(s)}
                        className="p-1 text-amber-400 cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${s <= formRating ? 'fill-current' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-500 ml-1">
                      {formRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Review / Feedback
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formReview}
                    onChange={(e) => setFormReview(e.target.value)}
                    placeholder="Tell us what you liked about the real CBT experience, timers, questions, or analysis..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Submitting Review...' : 'Publish Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
