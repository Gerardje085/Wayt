// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Offline Opslag (AsyncStorage wachtrij)
// Slaat workouts op lokaal als er geen internet is.
// Synchroniseert automatisch met Supabase zodra er verbinding is.
// ─────────────────────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NieuweWorkout, OfflineItem } from '../types';

const WACHTRIJ_SLEUTEL = 'wayt_offline_wachtrij';

/** Sla een workout op in de offline wachtrij */
export async function slaOfflineOp(workout: NieuweWorkout): Promise<void> {
  const huidig = await haalOfflineWachtrij();
  const nieuwItem: OfflineItem = {
    id:        `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    data:      workout,
    timestamp: Date.now(),
  };
  const bijgewerkt = [...huidig, nieuwItem];
  await AsyncStorage.setItem(WACHTRIJ_SLEUTEL, JSON.stringify(bijgewerkt));
}

/** Lees alle wachtende offline workouts */
export async function haalOfflineWachtrij(): Promise<OfflineItem[]> {
  try {
    const raw = await AsyncStorage.getItem(WACHTRIJ_SLEUTEL);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineItem[];
  } catch {
    return [];
  }
}

/** Verwijder een gesynchroniseerd item uit de wachtrij */
export async function wisOfflineItem(id: string): Promise<void> {
  const huidig = await haalOfflineWachtrij();
  const gefilterd = huidig.filter((item) => item.id !== id);
  await AsyncStorage.setItem(WACHTRIJ_SLEUTEL, JSON.stringify(gefilterd));
}

/** Verwijder de volledige wachtrij (na succesvolle sync) */
export async function wisAlleOfflineItems(): Promise<void> {
  await AsyncStorage.removeItem(WACHTRIJ_SLEUTEL);
}

/** Hoeveel items staan er nog in de wachtrij? */
export async function telOfflineItems(): Promise<number> {
  const wachtrij = await haalOfflineWachtrij();
  return wachtrij.length;
}
