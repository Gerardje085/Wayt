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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const PROFIEL_SLEUTEL = 'wayt_profiel_v1';

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
      AsyncStorage.setItem(PROFIEL_SLEUTEL, JSON.stringify(data)).catch(() => {});
    } catch (err) {
      console.warn('Profiel ophalen mislukt:', (err as Error).message);
      try {
        const ruw = await AsyncStorage.getItem(PROFIEL_SLEUTEL);
        const opgeslagen = ruw ? (JSON.parse(ruw) as Profile) : null;
        setProfile(opgeslagen?.id === userId ? opgeslagen : null);
      } catch {
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      await haalProfielOp(s?.user?.id ?? null);
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
    await AsyncStorage.removeItem(PROFIEL_SLEUTEL).catch(() => {});
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
