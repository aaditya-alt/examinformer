'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Lock, Mail, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';

export function AuthModal() {
  const { authModalOpen, authModalMessage, closeAuthModal, signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'signup' | 'login' | 'forgot'>('signup');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Forgot password specific fields
  const [forgotInput, setForgotInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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

    if (tab === 'forgot') {
      if (!forgotInput.trim()) {
        return 'Please enter your registered Email or 10-digit Mobile Number.';
      }
      if (!newPassword || newPassword.length < 6) {
        return 'New password must be at least 6 characters.';
      }
      if (newPassword !== confirmPassword) {
        return 'Passwords do not match. Please re-enter carefully.';
      }
      return null;
    }

    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validationErr = validateFrontend();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: forgotInput.trim(),
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password. Please check your details.');
      } else {
        setSuccessMsg(data.message || 'Password reset successfully! Signing you in...');
        // Try to automatically sign in
        setTimeout(async () => {
          const signRes = await signIn(forgotInput.trim(), newPassword);
          if (signRes.error) {
            setTab('login');
            setEmail(forgotInput.trim());
            setPassword('');
          }
        }, 1200);
      }
    } catch (err: any) {
      setError('Network error while resetting password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (tab === 'forgot') {
      return handleForgotSubmit(e);
    }

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
              {tab === 'signup' && 'Create Candidate Account'}
              {tab === 'login' && 'Candidate Sign In'}
              {tab === 'forgot' && 'Reset Account Password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {tab === 'forgot'
                ? 'Enter your registered email or mobile number to instantly set a new password.'
                : (authModalMessage || 'Account is required to access official CBT exams, log your scorecards, and generate test analytics.')}
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
        {tab !== 'forgot' ? (
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3">
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
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
              onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
              className={`pb-3 text-xs font-black border-b-2 transition cursor-pointer ${
                tab === 'login'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Existing Candidate Login
            </button>
          </div>
        ) : (
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instant Password Recovery</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'forgot' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Email or 10-digit Mobile <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. name@gmail.com or 9876543210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Works directly even if your email was unverified.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
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
                    <span>Reset Password & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(''); setSuccessMsg(''); }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
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
            </>
          )}
        </form>
      </div>
    </div>
  );
}
