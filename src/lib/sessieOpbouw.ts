import { findExercise } from '../data/exercises';
import { berekenVoorschrift } from '../utils/algorithm';
import { canoniekeId, type LaatsteSessies } from './trainingsHistorie';
import type { LiveOefening, LiveSet } from '../context/LiveWorkoutContext';
import type { RoutineOefening } from './routineStore';
import type { Profile } from '../types';

const STANDAARD_AANTAL_SETS = 3;

function nieuwSetId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function krijgtAdvies(groep: Profile['group_type'] | undefined, oefeningId: string): boolean {
  return groep === 'app' && findExercise(oefeningId)?.type === 'gewicht';
}

export function bouwLiveOefening(
  oefeningId: string,
  groep: Profile['group_type'] | undefined,
  laatsteSessies: LaatsteSessies,
  standaardRust: number,
  routine?: RoutineOefening,
): LiveOefening {
  const id = canoniekeId(oefeningId);
  const vorige = laatsteSessies[id] ?? [];
  const rustTijd = routine?.rustTijd && routine.rustTijd > 0 ? routine.rustTijd : standaardRust;

  if (krijgtAdvies(groep, id)) {
    const voorschrift = berekenVoorschrift(vorige, id);
    const sets: LiveSet[] = Array.from({ length: voorschrift.sets }, (_, i) => ({
      id: nieuwSetId(),
      reps: voorschrift.reps,
      gewicht: voorschrift.weight,
      type: 'normaal',
      completed: false,
      vorige: vorige[i] ? { reps: vorige[i].reps, gewicht: vorige[i].gewicht } : null,
      doel: { reps: voorschrift.reps, gewicht: voorschrift.weight },
    }));
    return { id, sets, expanded: false, voorschrift, rustTijd };
  }

  const basis = routine && routine.sets.length > 0
    ? routine.sets.map(s => ({ reps: s.reps, gewicht: s.gewicht }))
    : Array.from({ length: Math.max(vorige.length, STANDAARD_AANTAL_SETS) }, () => ({ reps: 0, gewicht: 0 }));

  const sets: LiveSet[] = basis.map((b, i) => ({
    id: nieuwSetId(),
    reps: b.reps,
    gewicht: b.gewicht,
    type: 'normaal',
    completed: false,
    vorige: vorige[i] ? { reps: vorige[i].reps, gewicht: vorige[i].gewicht } : null,
    doel: null,
  }));
  return { id, sets, expanded: false, voorschrift: null, rustTijd };
}
