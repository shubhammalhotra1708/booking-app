"use client";
import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Lightweight AuthProvider (email/password only for now)
// Future: phone OTP, anonymous session upgrade, social providers.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Browser client (use NEXT_PUBLIC_* keys)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signUpEmail = useCallback(async (email, password, profile = {}) => {
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: profile }
    });
    if (err) setError(err.message);
    return { data, error: err };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signInEmail = useCallback(async (email, password) => {
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    return { data, error: err };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    session,
    loading,
    error,
    signUpEmail,
    signInEmail,
    signOut,
    // Placeholder; future anonymous upgrade flow
    isAuthenticated: !!session?.user,
    user: session?.user || null,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
