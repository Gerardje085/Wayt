// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Custom Routines Store
// ─────────────────────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RoutineSet {
  id: string;
  reps: number;
  gewicht: number;
}

export interface RoutineOefening {
  id: string;
  sets: RoutineSet[];
  notities?: string;
  rustTijd?: number;
}

export interface Routine {
  id: string;
  naam: string;
  oefeningen: RoutineOefening[];
}

const STORAGE_KEY = '@wayt_routines';

export async function getRoutines(): Promise<Routine[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    let all: any[] = data ? JSON.parse(data) : [];
    
    // Auto-migrate oude routines (waarbij 'sets' een nummer is) naar de nieuwe array structuur
    all = all.map(routine => ({
      ...routine,
      oefeningen: routine.oefeningen.map((oef: any) => {
        if (typeof oef.sets === 'number') {
          const newSets: RoutineSet[] = Array.from({ length: oef.sets }).map(() => ({
            id: Math.random().toString(36).substring(2, 10),
            reps: oef.reps || 0,
            gewicht: oef.gewicht || 0
          }));
          return {
            id: oef.id,
            sets: newSets,
            notities: '',
            rustTijd: 0,
          };
        }
        return oef;
      })
    }));

    // Dedupliceer op id – bewaar het laatste exemplaar
    const map = new Map<string, Routine>();
    for (const r of all) map.set(r.id, r as Routine);
    return Array.from(map.values());
  } catch (e) {
    console.error('Fout bij ophalen routines', e);
    return [];
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  try {
    const routines = await getRoutines();
    const index = routines.findIndex(r => r.id === routine.id);
    if (index >= 0) {
      routines[index] = routine; // Update bestaande routine
    } else {
      routines.push(routine);   // Voeg nieuwe routine toe
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  } catch (e) {
    console.error('Fout bij opslaan routine', e);
  }
}

export async function deleteRoutine(id: string): Promise<void> {
  try {
    const routines = await getRoutines();
    const updated = routines.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Fout bij verwijderen routine', e);
  }
}
