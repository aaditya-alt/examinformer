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
    // 1. Check local session
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

    // 2. Supabase session check if configured
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
    const input = emailOrPhone.trim();
    // Check if input is phone or email
    const isEmail = input.includes('@');
    const targetEmail = isEmail ? input : `${input}@candidate.examinformer.in`;

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password: pass });
      if (!error && data.user) {
        const meta = data.user.user_metadata || {};
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          name: meta.full_name || meta.name || input.split('@')[0] || 'Candidate',
          phone: meta.phone || (isEmail ? '' : input),
          rollNumber: meta.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
          category: meta.category || 'UR'
        };
        setUser(profile);
        localStorage.setItem('ei_user_profile', JSON.stringify(profile));
        setAuthModalOpen(false);
        return {};
      }
    }

    // Seamless Local Fallback Authentication
    const storedUsersRaw = localStorage.getItem('ei_registered_accounts');
    const registeredList: any[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
    const matched = registeredList.find(
      (u) => (u.email.toLowerCase() === input.toLowerCase() || u.phone === input) && u.password === pass
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

    // If new credentials in local fallback, create instant candidate session
    const fallbackProfile: UserProfile = {
      id: 'usr_' + Date.now(),
      email: isEmail ? input : `${input}@student.in`,
      name: isEmail ? input.split('@')[0] : `Aspirant ${input.slice(-4)}`,
      phone: isEmail ? '9990287066' : input,
      rollNumber: '2402' + Math.floor(100000 + Math.random() * 900000),
      category: 'UR'
    };
    setUser(fallbackProfile);
    localStorage.setItem('ei_user_profile', JSON.stringify(fallbackProfile));
    setAuthModalOpen(false);
    return {};
  };

  const signUp = async ({ name, email, phone, pass }: { name: string; email: string; phone: string; pass: string }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const rollNumber = '2402' + Math.floor(100000 + Math.random() * 900000);

    const profile: UserProfile = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      rollNumber,
      category: 'UR',
      createdAt: new Date().toISOString()
    };

    // Save to local registry
    try {
      const storedUsersRaw = localStorage.getItem('ei_registered_accounts');
      const registeredList: any[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      registeredList.push({ ...profile, password: pass });
      localStorage.setItem('ei_registered_accounts', JSON.stringify(registeredList));
    } catch {}

    // Register to Supabase without email confirmation barrier
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              roll_number: rollNumber
            }
          }
        });
        if (data?.user) {
          profile.id = data.user.id;
        }
      } catch (err) {
        console.warn('Supabase signup fallback to local account:', err);
      }
    }

    // Set user directly into active session
    setUser(profile);
    localStorage.setItem('ei_user_profile', JSON.stringify(profile));
    setAuthModalOpen(false);
    return {};
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
