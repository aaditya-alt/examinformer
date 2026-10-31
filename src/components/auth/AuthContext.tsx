'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  rollNumber: string;
  category?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (emailOrPhone: string, pass: string) => Promise<{ error?: string }>;
  signUp: (data: { name: string; email: string; phone: string; pass: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMessage: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  updateProfile: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authModalOpen: false,
  authModalMessage: ''
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');

  useEffect(() => {
    // 1. Initial cached profile check
    const savedUser = localStorage.getItem('ei_user_profile');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.name && (parsed.email || parsed.phone)) {
          setUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem('ei_user_profile');
      }
    }

    // 2. Supabase session synchronization
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Candidate',
            phone: meta.phone || '9990287066',
            rollNumber: meta.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
            category: meta.category || 'UR',
            createdAt: session.user.created_at
          };
          setUser(profile);
          localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        }
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Candidate',
            phone: meta.phone || '9990287066',
            rollNumber: meta.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
            category: meta.category || 'UR',
            createdAt: session.user.created_at
          };
          setUser(profile);
          localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (emailOrPhone: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password: pass })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Fallback local check if network error or server message
        const storedUsersRaw = localStorage.getItem('ei_registered_accounts');
        const registeredList: any[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        const cleanInput = emailOrPhone.trim().toLowerCase();
        const matched = registeredList.find(
          (u) => (u.email.toLowerCase() === cleanInput || u.phone === cleanInput) && u.password === pass
        );

        if (matched) {
          const profile: UserProfile = {
            id: matched.id,
            email: matched.email,
            name: matched.name,
            phone: matched.phone,
            rollNumber: matched.rollNumber,
            category: matched.category || 'UR'
          };
          setUser(profile);
          localStorage.setItem('ei_user_profile', JSON.stringify(profile));
          setAuthModalOpen(false);
          return {};
        }

        return { error: data.error || 'Invalid credentials. Please verify and try again.' };
      }

      // Success from Supabase database
      setUser(data.user);
      localStorage.setItem('ei_user_profile', JSON.stringify(data.user));
      setAuthModalOpen(false);
      return {};
    } catch (err: any) {
      console.error('Sign in error:', err);
      return { error: 'Network error. Please try again.' };
    }
  };

  const signUp = async ({ name, email, phone, pass }: { name: string; email: string; phone: string; pass: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password: pass })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { error: data.error || 'Registration could not be completed.' };
      }

      // Automatically sign in candidate with newly created Supabase credentials
      if (supabase) {
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: pass
        }).catch(() => {});
      }

      setUser(data.user);
      localStorage.setItem('ei_user_profile', JSON.stringify(data.user));

      // Also keep local cached record for fast offline fallback
      try {
        const storedUsersRaw = localStorage.getItem('ei_registered_accounts');
        const registeredList: any[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        registeredList.push({ ...data.user, password: pass });
        localStorage.setItem('ei_registered_accounts', JSON.stringify(registeredList));
      } catch {}

      setAuthModalOpen(false);
      return {};
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { error: 'Network error during registration. Please try again.' };
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('ei_user_profile', JSON.stringify(updated));
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('ei_user_profile');
  };

  const openAuthModal = (message?: string) => {
    setAuthModalMessage(message || 'Account Required: Please log in or create an account with your Name, Email, Phone and Password to take CBT mock tests.');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalMessage('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
