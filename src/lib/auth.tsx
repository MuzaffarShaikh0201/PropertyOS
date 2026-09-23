import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

type SignUpParams = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type ProfileInput = {
  firstName: string;
  lastName: string;
  /** E.164-ish, e.g. "+919876543210" — or null to clear it. Not verified via
   * SMS: there's no phone-auth provider configured, this is plain profile
   * metadata, not Supabase Auth's native phone field. */
  phone: string | null;
};

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // null means "couldn't determine" (e.g. the email_exists RPC isn't
  // deployed yet, or a network hiccup) — callers must not treat that as a
  // definite "no account", since that's the opposite of a safe fallback.
  checkEmailExists: (email: string) => Promise<boolean | null>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session != null,
      isLoading,
      checkEmailExists: async (email) => {
        const { data, error } = await supabase.rpc('email_exists', { check_email: email });
        if (error) {
          if (__DEV__) {
            console.warn('email_exists RPC failed — has the SQL function been run in Supabase?', error.message);
          }
          return null;
        }
        return Boolean(data);
      },
      signInWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async ({ firstName, lastName, email, password }) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName } },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      updateProfile: async ({ firstName, lastName, phone }) => {
        const { error } = await supabase.auth.updateUser({
          data: { first_name: firstName, last_name: lastName, phone },
        });
        return { error: error?.message ?? null };
      },
      updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
