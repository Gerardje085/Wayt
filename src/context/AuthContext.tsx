// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Auth Context (TypeScript)
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  user:      User | null;
  session:   Session | null;
  profile:   Profile | null;
  laden:     boolean;
  uitloggen: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth moet gebruikt worden binnen een AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [laden,   setLaden]   = useState(true);

  const haalProfielOp = useCallback(async (userId: string | null) => {
    if (!userId) { setProfile(null); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      console.warn('Profiel ophalen mislukt:', (err as Error).message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      haalProfielOp(s?.user?.id ?? null);
      setLaden(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      haalProfielOp(s?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [haalProfielOp]);

  const uitloggen = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const waarde: AuthContextType = {
    user:    session?.user ?? null,
    session,
    profile,
    laden,
    uitloggen,
  };

  return <AuthContext.Provider value={waarde}>{children}</AuthContext.Provider>;
}
