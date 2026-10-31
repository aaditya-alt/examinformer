'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Lock, Mail, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export function AuthModal() {
  const { authModalOpen, authModalMessage, closeAuthModal, signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'signup' | 'login'>('signup');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const validateFrontend = (): string | null => {
    if (tab === 'signup') {
      if (!name.trim() || name.trim().length < 2) {
        return 'Please enter your real full name (at least 2 letters).';
      }
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        return 'Please enter a valid 10-digit mobile number.';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address (e.g. name@gmail.com).';
      }
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationErr = validateFrontend();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setSubmitting(true);

    if (tab === 'login') {
      const res = await signIn(email || phone, password);
      if (res.error) {
        setError(res.error);
      }
    } else {
      const res = await signUp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ''),
        pass: password
      });
      if (res.error) {
        setError(res.error);
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Mandatory Candidate Enrollment</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {tab === 'signup' ? 'Create Candidate Account' : 'Candidate Sign In'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {authModalMessage || 'Account is required to access official CBT exams, log your scorecards, and generate test analytics.'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3">
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(''); }}
            className={`pb-3 text-xs font-black border-b-2 mr-6 transition cursor-pointer ${
              tab === 'signup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            1-Click Registration (No Email Wait)
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`pb-3 text-xs font-black border-b-2 transition cursor-pointer ${
              tab === 'login'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Existing Candidate Login
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amit Kumar"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Candidate Watermark ID) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">This number will be used for your official CBT exam watermark.</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {tab === 'signup' ? 'Email Address' : 'Email Address or Mobile Number'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={tab === 'signup' ? 'email' : 'text'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === 'signup' ? 'name@gmail.com' : 'Email or 10-digit phone'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {tab === 'signup' && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                ✓ Verified instantly on device — No email link click required!
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 btn-3d-primary cursor-pointer transition shadow-md mt-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'signup' ? 'Enroll & Proceed to Test Hall' : 'Sign In to Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
