'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  rollNumber?: string;
  category?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  guestLogin: (name: string) => void;
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
  guestLogin: () => {},
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
    // Check local session first
    const savedUser = localStorage.getItem('ei_user_profile');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('ei_user_profile');
      }
    }

    // If Supabase client exists, check Supabase auth
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Candidate',
            rollNumber: session.user.user_metadata?.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
            category: session.user.user_metadata?.category || 'UR'
          };
          setUser(profile);
          localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        }
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Candidate',
            rollNumber: session.user.user_metadata?.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
            category: session.user.user_metadata?.category || 'UR'
          };
          setUser(profile);
          localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        } else {
          // don't wipe if guest was manually set
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Candidate',
          rollNumber: data.user.user_metadata?.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
          category: data.user.user_metadata?.category || 'UR'
        };
        setUser(profile);
        localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        setAuthModalOpen(false);
        return {};
      }
    }
    // Fallback local signin
    const fallbackProfile: UserProfile = {
      id: 'usr_' + Date.now(),
      email,
      name: email.split('@')[0] || 'Candidate',
      rollNumber: '2402' + Math.floor(100000 + Math.random() * 900000),
      category: 'UR'
    };
    setUser(fallbackProfile);
    localStorage.setItem('ei_user_profile', JSON.stringify(fallbackProfile));
    setAuthModalOpen(false);
    return {};
  };

  const signUp = async (email: string, pass: string, name: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } }
      });
      if (error) return { error: error.message };
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.email?.split('@')[0] || 'Candidate',
          rollNumber: '2402' + Math.floor(100000 + Math.random() * 900000),
          category: 'UR'
        };
        setUser(profile);
        localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        setAuthModalOpen(false);
        return {};
      }
    }
    const fallbackProfile: UserProfile = {
      id: 'usr_' + Date.now(),
      email,
      name,
      rollNumber: '2402' + Math.floor(100000 + Math.random() * 900000),
      category: 'UR'
    };
    setUser(fallbackProfile);
    localStorage.setItem('ei_user_profile', JSON.stringify(fallbackProfile));
    setAuthModalOpen(false);
    return {};
  };

  const guestLogin = (name: string) => {
    const candidateName = name.trim() || 'Aspirant ' + Math.floor(1000 + Math.random() * 9000);
    const profile: UserProfile = {
      id: 'guest_' + Date.now(),
      name: candidateName,
      rollNumber: '2402' + Math.floor(100000 + Math.random() * 900000),
      category: 'UR'
    };
    setUser(profile);
    localStorage.setItem('ei_user_profile', JSON.stringify(profile));
    setAuthModalOpen(false);
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('ei_user_profile');
  };

  const openAuthModal = (message?: string) => {
    setAuthModalMessage(message || 'Please log in to start taking this CBT exam.');
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
        guestLogin,
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
