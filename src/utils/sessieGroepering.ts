// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Sessie-groepering & Top-Set helpers
// Groepeert losse set-rijen uit `workouts` naar echte oefeningssessies,
// zonder vervormende gemiddeldes (reps) of spookcombinaties (max weight × avg reps).
// Blijft volledig compatibel met eventuele oudere geaggregeerde rijen.
// ─────────────────────────────────────────────────────────────────────────────
import type { Workout } from '../types';

export interface GegroepeerdeSessie {
  sleutel: string;
  userId: string;
  exercise: string;
  datum: string;
  sessionId: string | null;
  isMeting: boolean;
  /** Alle sets van deze oefening in deze sessie, op volgorde */
  sets: Workout[];
  /** Werksets (zonder warmup), of alle sets als er alleen warmup-sets zijn */
  werkSets: Workout[];
  /** Totaal aantal werksets in deze sessie */
  aantalWerkSets: number;
  /** De echte beste werkset (hoogste geschatte 1RM) */
  topSet: Workout;
  topGewicht: number;
  topReps: number;
  beste1RM: number;
  /** Exacte som van volume (kg) over alle werksets */
  totaalVolume: number;
  /** Exacte som van mechanische arbeid (Joules) over alle werksets */
  totaalArbeid: number;
  notitie: string | null;
  /** Samenvattend Workout-object (met echte Top Set) voor o.a. berekenVoorschrift() */
  samenvattingWorkout: Workout;
}

function schat1RM(gewicht: number, reps: number): number {
  if (gewicht <= 0 || reps <= 0) return 0;
  if (reps === 1) return gewicht;
  return Math.round(gewicht * (1 + reps / 30));
}

/** Genereert een geldige UUID v4 zonder externe dependencies */
export function genereerUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function timestampMs(w: Workout): number | null {
  if (!w.created_at) return null;
  const ms = Date.parse(w.created_at);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Groepeert individuele set-rijen uit `workouts` naar chronologische oefeningssessies
 * (oplopend op datum). Werkt naadloos voor zowel nieuwe set-rijen (1 rij = 1 set)
 * als oudere geaggregeerde rijen (sets > 1).
 */
export function groepeerNaarSessies(workouts: Workout[]): GegroepeerdeSessie[] {
  if (!workouts || workouts.length === 0) return [];

  const gesorteerd = [...workouts].sort((a, b) => {
    const dCmp = a.date.localeCompare(b.date);
    if (dCmp !== 0) return dCmp;
    const tA = timestampMs(a);
    const tB = timestampMs(b);
    if (tA !== null && tB !== null && tA !== tB) return tA - tB;
    const snA = a.set_number ?? Number.MAX_SAFE_INTEGER;
    const snB = b.set_number ?? Number.MAX_SAFE_INTEGER;
    if (snA !== snB) return snA - snB;
    return a.id - b.id;
  });

  const groepen = new Map<string, Workout[]>();
  // Voor fallback-rijen zonder session_id: cluster op user+exercise+date binnen 15 minuten
  const dagClusterInfo = new Map<string, { index: number; laatsteMs: number | null }>();

  for (const w of gesorteerd) {
    let sleutel: string;
    if (w.session_id) {
      sleutel = `sess:${w.user_id}:${w.exercise}:${w.session_id}`;
    } else if (w.is_meting) {
      sleutel = `meting:${w.id}`;
    } else if (Number(w.sets) > 1) {
      sleutel = `legacy:${w.id}`;
    } else {
      const basis = `${w.user_id}:${w.exercise}:${w.date}`;
      const ms = timestampMs(w);
      const info = dagClusterInfo.get(basis);
      if (!info) {
        dagClusterInfo.set(basis, { index: 0, laatsteMs: ms });
        sleutel = `dag:${basis}:0`;
      } else {
        const nieuwCluster =
          info.laatsteMs !== null && ms !== null && Math.abs(ms - info.laatsteMs) > 15 * 60 * 1000;
        const idx = nieuwCluster ? info.index + 1 : info.index;
        dagClusterInfo.set(basis, { index: idx, laatsteMs: ms ?? info.laatsteMs });
        sleutel = `dag:${basis}:${idx}`;
      }
    }

    const lijst = groepen.get(sleutel);
    if (lijst) {
      lijst.push(w);
    } else {
      groepen.set(sleutel, [w]);
    }
  }

  const sessies: GegroepeerdeSessie[] = [];

  for (const [sleutel, rijen] of groepen) {
    const sets = [...rijen].sort((a, b) => {
      const snA = a.set_number ?? Number.MAX_SAFE_INTEGER;
      const snB = b.set_number ?? Number.MAX_SAFE_INTEGER;
      if (snA !== snB) return snA - snB;
      return a.id - b.id;
    });

    const nietWarmup = sets.filter(s => s.set_type !== 'warmup');
    const werkSets = nietWarmup.length > 0 ? nietWarmup : sets;

    const aantalWerkSets = werkSets.reduce((acc, s) => acc + (Number(s.sets) || 1), 0);
    const totaalVolume = parseFloat(
      werkSets.reduce((acc, s) => acc + (parseFloat(String(s.volume)) || 0), 0).toFixed(2)
    );
    const totaalArbeid = parseFloat(
      werkSets.reduce((acc, s) => acc + (parseFloat(String(s.work_joules)) || 0), 0).toFixed(2)
    );

    // Top Set = de echte uitgevoerde werkset met de hoogste geschatte 1RM
    let topSet = werkSets[0];
    let beste1RM = schat1RM(Number(topSet.weight), Number(topSet.reps));

    for (let i = 1; i < werkSets.length; i++) {
      const kandidaat = werkSets[i];
      const kg = Number(kandidaat.weight) || 0;
      const rp = Number(kandidaat.reps) || 0;
      const rm = schat1RM(kg, rp);
      const topKg = Number(topSet.weight) || 0;
      const topRp = Number(topSet.reps) || 0;

      if (
        rm > beste1RM ||
        (rm === beste1RM && kg > topKg) ||
        (rm === beste1RM && kg === topKg && rp > topRp)
      ) {
        topSet = kandidaat;
        beste1RM = rm;
      }
    }

    const topGewicht = Number(topSet.weight) || 0;
    const topReps = Number(topSet.reps) || 0;
    const notitie = sets.find(s => s.notitie && s.notitie.trim().length > 0)?.notitie?.trim() ?? null;
    const eerste = sets[0];

    const samenvattingWorkout: Workout = {
      ...topSet,
      sets: aantalWerkSets,
      reps: topReps,
      weight: topGewicht,
      volume: totaalVolume,
      work_joules: totaalArbeid,
      notitie,
    };

    sessies.push({
      sleutel,
      userId: eerste.user_id,
      exercise: eerste.exercise,
      datum: eerste.date,
      sessionId: eerste.session_id ?? null,
      isMeting: sets.some(s => Boolean(s.is_meting)),
      sets,
      werkSets,
      aantalWerkSets,
      topSet,
      topGewicht,
      topReps,
      beste1RM,
      totaalVolume,
      totaalArbeid,
      notitie,
      samenvattingWorkout,
    });
  }

  return sessies.sort((a, b) => {
    const dCmp = a.datum.localeCompare(b.datum);
    if (dCmp !== 0) return dCmp;
    return a.sets[0].id - b.sets[0].id;
  });
}

/**
 * Telt het aantal unieke trainingssessies (niet losse set-rijen).
 */
export function telUniekeWorkoutSessies(workouts: Workout[]): number {
  if (!workouts || workouts.length === 0) return 0;
  const unieke = new Set<string>();
  for (const w of workouts) {
    if (w.session_id) {
      unieke.add(`sess:${w.user_id}:${w.session_id}`);
    } else if (w.is_meting) {
      unieke.add(`meting:${w.user_id}:${w.date}:${w.exercise}`);
    } else {
      unieke.add(`dag:${w.user_id}:${w.date}`);
    }
  }
  return unieke.size;
}
