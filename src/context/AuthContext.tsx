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
  isAdmin:   boolean;
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
  const [session,      setSession]      = useState<Session | null>(null);
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [authLaden,    setAuthLaden]    = useState(true);
  const [profielLaden, setProfielLaden] = useState(false);

  const haalProfielOp = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      setProfielLaden(false);
      return;
    }
    setProfielLaden(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      const metaUsername = typeof authUser.user_metadata?.username === 'string'
        ? authUser.user_metadata.username.trim()
        : null;
      const metaGroep = authUser.user_metadata?.group_type === 'app' ? 'app' : 'gevoel';

      if (!data) {
        const { data: nieuwProfiel, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            group_type: metaGroep,
            username: metaUsername || null,
          })
          .select('*')
          .single();

        if (upsertError) throw upsertError;
        setProfile({
          ...(nieuwProfiel as Profile),
          role: (nieuwProfiel as Profile).role ?? 'deelnemer',
        });
        return;
      }

      if (!data.username && metaUsername) {
        const { data: bijgewerkt } = await supabase
          .from('profiles')
          .update({ username: metaUsername })
          .eq('id', authUser.id)
          .select('*')
          .single();
        if (bijgewerkt) {
          setProfile({
            ...(bijgewerkt as Profile),
            role: (bijgewerkt as Profile).role ?? 'deelnemer',
          });
          return;
        }
      }

      setProfile({
        ...(data as Profile),
        role: (data as Profile).role ?? 'deelnemer',
      });
    } catch (err) {
      console.warn('Profiel ophalen mislukt:', (err as Error).message);
      setProfile(null);
    } finally {
      setProfielLaden(false);
    }
  }, []);

  useEffect(() => {
    let actief = true;

    supabase.auth.getSession()
      .then(async ({ data: { session: s } }) => {
        if (!actief) return;
        setSession(s);
        await haalProfielOp(s?.user ?? null);
        if (actief) setAuthLaden(false);
      })
      .catch(() => {
        if (actief) setAuthLaden(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!actief) return;
      setSession(s);
      haalProfielOp(s?.user ?? null);
    });

    return () => {
      actief = false;
      subscription.unsubscribe();
    };
  }, [haalProfielOp]);

  const uitloggen = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const isAdmin = profile?.role === 'admin';
  const laden = authLaden || profielLaden;

  const waarde: AuthContextType = {
    user:    session?.user ?? null,
    session,
    profile,
    isAdmin,
    laden,
    uitloggen,
  };

  return <AuthContext.Provider value={waarde}>{children}</AuthContext.Provider>;
}
