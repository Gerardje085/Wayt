// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Workout Data Hooks (TypeScript)
// Inclusief offline-ondersteuning en automatische sync bij reconnect.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  slaOfflineOp,
  haalOfflineWachtrij,
  wisOfflineItem,
} from '../lib/offlineStore';
import { useNetworkStatus } from './useNetworkStatus';
import type { Workout, NieuweWorkout } from '../types';
import { canoniekeId } from '../lib/trainingsHistorie';

// ─── Vorige sessie ────────────────────────────────────────────────────────────

interface VorigeSessieResult {
  haalLaatsteOp: (oefening: string) => Promise<void>;
  vorigeSessie:  Workout | null;
  laden:         boolean;
  fout:          string | null;
}

export function useVorigeSessie(userId: string | undefined): VorigeSessieResult {
  const [vorigeSessie, setVorigeSessie] = useState<Workout | null>(null);
  const [laden,        setLaden]        = useState(false);
  const [fout,         setFout]         = useState<string | null>(null);

  const haalLaatsteOp = useCallback(async (oefening: string) => {
    if (!userId || !oefening) return;
    setLaden(true);
    setFout(null);
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise', oefening)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setVorigeSessie((data as Workout) ?? null);
    } catch (err) {
      setFout((err as Error).message);
      setVorigeSessie(null);
    } finally {
      setLaden(false);
    }
  }, [userId]);

  return { haalLaatsteOp, vorigeSessie, laden, fout };
}

// ─── Voortgang ────────────────────────────────────────────────────────────────

interface VoortgangResult {
  haalVoortgangOp: (oefening: string) => Promise<void>;
  workouts: Workout[];
  laden:    boolean;
  fout:     string | null;
}

export function useVoortgang(userId: string | undefined): VoortgangResult {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [laden,    setLaden]    = useState(false);
  const [fout,     setFout]     = useState<string | null>(null);

  const haalVoortgangOp = useCallback(async (oefening: string) => {
    if (!userId || !oefening) return;
    setLaden(true);
    setFout(null);
    try {
      const doel = canoniekeId(oefening);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      setWorkouts(((data as Workout[]) ?? []).filter(w => canoniekeId(w.exercise) === doel));
    } catch (err) {
      setFout((err as Error).message);
      setWorkouts([]);
    } finally {
      setLaden(false);
    }
  }, [userId]);

  return { haalVoortgangOp, workouts, laden, fout };
}

// ─── Alle workouts (admin) ────────────────────────────────────────────────────

interface AlleWorkoutsResult {
  haalAllesOp: () => Promise<void>;
  workouts: Workout[];
  laden:    boolean;
  fout:     string | null;
}

export function useAlleWorkouts(userId: string | undefined): AlleWorkoutsResult {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [laden,    setLaden]    = useState(false);
  const [fout,     setFout]     = useState<string | null>(null);

  const haalAllesOp = useCallback(async () => {
    if (!userId) return;
    setLaden(true);
    setFout(null);
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkouts((data as Workout[]) ?? []);
    } catch (err) {
      setFout((err as Error).message);
      setWorkouts([]);
    } finally {
      setLaden(false);
    }
  }, [userId]);

  return { haalAllesOp, workouts, laden, fout };
}

// ─── Opslaan (online + offline) ───────────────────────────────────────────────

export interface OpslaanUitkomst {
  ok:      boolean;
  offline: boolean;
}

export interface OpslaanResult {
  slaOp:         (data: NieuweWorkout | NieuweWorkout[]) => Promise<OpslaanUitkomst>;
  laden:         boolean;
  fout:          string | null;
  succes:        boolean;
  wasOffline:    boolean;
  reset:         () => void;
  offlineAantal: number;
}

export function useOpslaanWorkout(): OpslaanResult {
  const [laden,         setLaden]         = useState(false);
  const [fout,          setFout]          = useState<string | null>(null);
  const [succes,        setSucces]        = useState(false);
  const [wasOffline,    setWasOffline]    = useState(false);
  const [offlineAantal, setOfflineAantal] = useState(0);
  const { isOnline }                      = useNetworkStatus();
  const syncBezig                         = useRef(false);

  // Tel offline items bij mount en na wijzigingen
  const hertelOffline = useCallback(async () => {
    const wachtrij = await haalOfflineWachtrij();
    setOfflineAantal(wachtrij.length);
  }, []);

  useEffect(() => { hertelOffline(); }, [hertelOffline]);

  // Automatisch sync zodra internet terugkeert
  useEffect(() => {
    if (!isOnline || syncBezig.current) return;

    async function syncOfflineWachtrij() {
      const wachtrij = await haalOfflineWachtrij();
      if (wachtrij.length === 0) return;

      syncBezig.current = true;
      let succesvol = 0;

      for (const item of wachtrij) {
        try {
          const { error } = await supabase.from('workouts').insert(item.data);
          if (!error) {
            await wisOfflineItem(item.id);
            succesvol++;
          }
        } catch {
          // Skip mislukt item, probeer volgende keer opnieuw
        }
      }

      if (succesvol > 0) {
        console.log(`[Sync] ${succesvol} offline workouts gesynchroniseerd`);
        hertelOffline();
      }
      syncBezig.current = false;
    }

    syncOfflineWachtrij();
  }, [isOnline, hertelOffline]);

  const slaOp = useCallback(async (werkoutData: NieuweWorkout | NieuweWorkout[]): Promise<OpslaanUitkomst> => {
    setLaden(true);
    setFout(null);
    setSucces(false);
    setWasOffline(false);

    const dataArray = Array.isArray(werkoutData) ? werkoutData : [werkoutData];

    const slaLokaalOp = async (): Promise<OpslaanUitkomst> => {
      try {
        for (const w of dataArray) {
          await slaOfflineOp(w);
        }
        setWasOffline(true);
        setSucces(true);
        hertelOffline();
        return { ok: true, offline: true };
      } catch (err) {
        setFout((err as Error).message);
        return { ok: false, offline: true };
      }
    };

    try {
      if (!isOnline) return await slaLokaalOp();

      const { error } = await supabase.from('workouts').insert(dataArray);
      if (error) {
        console.warn('[Opslaan] Server weigerde, lokaal bewaard:', error.message);
        return await slaLokaalOp();
      }
      setSucces(true);
      return { ok: true, offline: false };
    } catch {
      return await slaLokaalOp();
    } finally {
      setLaden(false);
    }
  }, [isOnline, hertelOffline]);

  const reset = useCallback(() => {
    setFout(null);
    setSucces(false);
    setWasOffline(false);
  }, []);

  return { slaOp, laden, fout, succes, wasOffline, reset, offlineAantal };
}
