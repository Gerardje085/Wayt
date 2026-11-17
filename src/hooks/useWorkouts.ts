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
import { vertaalFout } from '../utils/errorVertaler';
import { groepeerNaarSessies } from '../utils/sessieGroepering';
import type { Workout, NieuweWorkout } from '../types';

export interface VorigeSetInfo {
  gewicht: number;
  reps: number;
  setType: string;
}

function stripOptioneleKolommen(row: NieuweWorkout): NieuweWorkout {
  const { session_id: _s, set_number: _n, set_type: _t, notitie: _no, ...basis } = row;
  return basis;
}

function isMissendeKolomFout(error: any): boolean {
  const code = String(error?.code ?? '');
  const msg = String(error?.message ?? '').toLowerCase();
  if (code === 'PGRST204' || code === '42703') return true;
  return (
    msg.includes('session_id') ||
    msg.includes('set_number') ||
    msg.includes('set_type') ||
    msg.includes('notitie')
  );
}

export async function insertWorkoutsVeilig(rows: NieuweWorkout | NieuweWorkout[]) {
  const { error } = await supabase.from('workouts').insert(rows);
  if (error && isMissendeKolomFout(error)) {
    const zonderExtra = Array.isArray(rows)
      ? rows.map(stripOptioneleKolommen)
      : stripOptioneleKolommen(rows);
    return supabase.from('workouts').insert(zonderExtra);
  }
  return { error };
}

// ─── Vorige sessie ────────────────────────────────────────────────────────────

interface VorigeSessieResult {
  haalLaatsteOp:    (oefening: string) => Promise<void>;
  vorigeSessie:     Workout | null;
  vorigeSets:       VorigeSetInfo[];
  vorigeWarmupSets: VorigeSetInfo[];
  laden:            boolean;
  fout:             string | null;
}

export function useVorigeSessie(userId: string | undefined): VorigeSessieResult {
  const [vorigeSessie,     setVorigeSessie]     = useState<Workout | null>(null);
  const [vorigeSets,       setVorigeSets]       = useState<VorigeSetInfo[]>([]);
  const [vorigeWarmupSets, setVorigeWarmupSets] = useState<VorigeSetInfo[]>([]);
  const [laden,            setLaden]            = useState(false);
  const [fout,             setFout]             = useState<string | null>(null);

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
        .order('id', { ascending: false })
        .limit(40);

      if (error) throw error;
      const rijen = (data as Workout[]) ?? [];
      if (rijen.length === 0) {
        setVorigeSessie(null);
        setVorigeSets([]);
        setVorigeWarmupSets([]);
        return;
      }

      const sessies = groepeerNaarSessies(rijen);
      const trainingsSessies = sessies.filter(s => !s.isMeting);
      const bronLijst = trainingsSessies.length > 0 ? trainingsSessies : sessies;
      const laatste = bronLijst[bronLijst.length - 1];

      setVorigeSessie(laatste.samenvattingWorkout);
      setVorigeSets(
        laatste.werkSets.map(s => ({
          gewicht: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          setType: s.set_type ?? 'normaal',
        }))
      );
      setVorigeWarmupSets(
        laatste.sets
          .filter(s => s.set_type === 'warmup')
          .map(s => ({
            gewicht: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            setType: 'warmup',
          }))
      );
    } catch (err) {
      setFout(vertaalFout(err, 'Kon de vorige training niet ophalen.'));
      setVorigeSessie(null);
      setVorigeSets([]);
      setVorigeWarmupSets([]);
    } finally {
      setLaden(false);
    }
  }, [userId]);

  return { haalLaatsteOp, vorigeSessie, vorigeSets, vorigeWarmupSets, laden, fout };
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
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise', oefening)
        .order('date', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      setWorkouts((data as Workout[]) ?? []);
    } catch (err) {
      setFout(vertaalFout(err, 'Kon je voortgang niet ophalen. Probeer het opnieuw.'));
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
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;
      setWorkouts((data as Workout[]) ?? []);
    } catch (err) {
      setFout(vertaalFout(err, 'Kon je trainingen niet ophalen. Probeer het opnieuw.'));
      setWorkouts([]);
    } finally {
      setLaden(false);
    }
  }, [userId]);

  return { haalAllesOp, workouts, laden, fout };
}

export interface DeelnemerProfiel {
  id: string;
  username: string | null;
  group_type: 'app' | 'gevoel';
  role?: 'deelnemer' | 'admin';
  created_at: string;
}

export async function haalAlleDeelnemerProfielen(): Promise<DeelnemerProfiel[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, group_type, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data as DeelnemerProfiel[]) ?? []).filter(p => p.role !== 'admin');
}

export interface OnderzoeksWorkout extends Workout {
  profiles?: {
    group_type: 'app' | 'gevoel' | null;
    username: string | null;
  } | null;
}

export async function haalVolledigeOnderzoeksdata(): Promise<OnderzoeksWorkout[]> {
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (workoutsError) throw workoutsError;
  if (!workoutsData || workoutsData.length === 0) return [];

  const { data: profielenData, error: profielenError } = await supabase
    .from('profiles')
    .select('id, group_type, username');

  if (profielenError) throw profielenError;

  const profielMap = new Map<string, { group_type: 'app' | 'gevoel' | null; username: string | null }>();
  for (const p of profielenData ?? []) {
    profielMap.set(p.id, { group_type: p.group_type ?? null, username: p.username ?? null });
  }

  return (workoutsData as Workout[]).map((w) => ({
    ...w,
    profiles: profielMap.get(w.user_id) ?? null,
  }));
}

// ─── Opslaan (online + offline) ───────────────────────────────────────────────

export interface OpslaanResult {
  slaOp:         (data: NieuweWorkout | NieuweWorkout[]) => Promise<boolean>;
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
          const { error } = await insertWorkoutsVeilig(item.data);
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

  const slaOp = useCallback(async (werkoutData: NieuweWorkout | NieuweWorkout[]): Promise<boolean> => {
    setLaden(true);
    setFout(null);
    setSucces(false);
    setWasOffline(false);

    const dataArray = Array.isArray(werkoutData) ? werkoutData : [werkoutData];

    if (!isOnline) {
      // Offline: opslaan in lokale wachtrij
      try {
        for (const w of dataArray) {
          await slaOfflineOp(w);
        }
        setWasOffline(true);
        setSucces(true);
        hertelOffline();
        return true;
      } catch (err) {
        setFout(vertaalFout(err, 'Kon de training niet lokaal opslaan.'));
        return false;
      } finally {
        setLaden(false);
      }
    }

    // Online: direct naar Supabase (met fallback als nieuwe kolommen nog niet gemigreerd zijn)
    try {
      const { error } = await insertWorkoutsVeilig(dataArray);
      if (error) throw error;
      setSucces(true);
      return true;
    } catch (err) {
      setFout(vertaalFout(err, 'Kon de training niet opslaan. Controleer je verbinding en probeer het opnieuw.'));
      return false;
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
