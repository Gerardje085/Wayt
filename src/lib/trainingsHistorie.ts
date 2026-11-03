import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { haalOfflineWachtrij } from './offlineStore';
import { findExercise } from '../data/exercises';
import type { NieuweWorkout } from '../types';
import type { SessieSet } from '../utils/algorithm';

const CACHE_SLEUTEL = 'wayt_laatste_sessies_v1';

interface Sessie {
  datum: string;
  sets: SessieSet[];
}

type SessiesPerOefening = Record<string, Sessie>;

export type LaatsteSessies = Record<string, SessieSet[]>;

export interface HistorieResultaat {
  sessies: LaatsteSessies;
  bron: 'server' | 'lokaal';
}

export function canoniekeId(id: string): string {
  return findExercise(id)?.id ?? id;
}

export function isWerkSet(rij: Pick<NieuweWorkout, 'is_meting' | 'set_type'>): boolean {
  return !rij.is_meting && rij.set_type !== 'warmup';
}

function groepeerPerOefening(rijen: NieuweWorkout[]): SessiesPerOefening {
  const resultaat: SessiesPerOefening = {};
  for (const rij of rijen) {
    if (!isWerkSet(rij)) continue;
    const id = canoniekeId(rij.exercise);
    const set: SessieSet = { reps: Number(rij.reps) || 0, gewicht: Number(rij.weight) || 0 };
    const aantal = Math.max(1, Number(rij.sets) || 1);
    const sets = Array.from({ length: aantal }, () => ({ ...set }));
    const huidig = resultaat[id];
    if (!huidig || rij.date > huidig.datum) {
      resultaat[id] = { datum: rij.date, sets };
    } else if (rij.date === huidig.datum) {
      huidig.sets.push(...sets);
    }
  }
  return resultaat;
}

async function leesCache(userId: string): Promise<SessiesPerOefening> {
  try {
    const ruw = await AsyncStorage.getItem(CACHE_SLEUTEL);
    const alles = ruw ? JSON.parse(ruw) : {};
    return alles[userId] ?? {};
  } catch {
    return {};
  }
}

async function schrijfCache(userId: string, sessies: SessiesPerOefening): Promise<void> {
  try {
    const ruw = await AsyncStorage.getItem(CACHE_SLEUTEL);
    const alles = ruw ? JSON.parse(ruw) : {};
    alles[userId] = sessies;
    await AsyncStorage.setItem(CACHE_SLEUTEL, JSON.stringify(alles));
  } catch {
    return;
  }
}

export async function bewaarOpgeslagenSessie(userId: string, rijen: NieuweWorkout[]): Promise<void> {
  const nieuw = groepeerPerOefening(rijen);
  const cache = await leesCache(userId);
  for (const [id, sessie] of Object.entries(nieuw)) {
    const huidig = cache[id];
    if (!huidig || sessie.datum > huidig.datum) {
      cache[id] = sessie;
    } else if (sessie.datum === huidig.datum) {
      cache[id] = { datum: huidig.datum, sets: [...huidig.sets, ...sessie.sets] };
    }
  }
  await schrijfCache(userId, cache);
}

export async function haalLaatsteSessies(userId: string, oefeningIds: string[]): Promise<HistorieResultaat> {
  const gezocht = new Set(oefeningIds.map(canoniekeId));

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('id', { ascending: true })
    .limit(2000);

  let perOefening: SessiesPerOefening;
  let bron: HistorieResultaat['bron'];

  if (error || !data) {
    perOefening = await leesCache(userId);
    bron = 'lokaal';
  } else {
    const wachtrij = await haalOfflineWachtrij();
    const rijen = [
      ...(data as NieuweWorkout[]),
      ...wachtrij.map(item => item.data).filter(rij => rij.user_id === userId),
    ];
    perOefening = groepeerPerOefening(rijen);
    bron = 'server';
    await schrijfCache(userId, perOefening);
  }

  const sessies: LaatsteSessies = {};
  for (const id of gezocht) {
    sessies[id] = perOefening[id]?.sets ?? [];
  }
  return { sessies, bron };
}
