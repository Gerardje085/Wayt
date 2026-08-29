// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Progressive Overload Algoritme (TypeScript)
// ─────────────────────────────────────────────────────────────────────────────
import type { Workout, Voorschrift } from '../types';
import { findExercise } from '../data/exercises';

const BASELINE_SETS   = 3;
const BASELINE_REPS   = 10;
const GEWICHT_STAP    = 2.5;
const DOEL_SETS       = 3;

/**
 * Berekent het voorschrift voor de volgende sessie op basis van de vorige.
 *
 * Regels:
 *   Geen data       → 3×10 @ 30 kg (baseline)
 *   ≥3×10 reps      → gewicht +2,5 kg, doel: 3×8
 *   ≥3× (8 of 9)    → zelfde gewicht, doel: 3×10
 *   Alles minder    → gewicht −2,5 kg, doel: 3×10 (deload)
 */
export function berekenVoorschrift(vorigeSessie: Workout | null, oefeningId: string): Voorschrift {
  const oefInfo = findExercise(oefeningId);
  const basisGewicht = oefInfo ? oefInfo.startWaarde : 30.0;

  if (!vorigeSessie) {
    return { sets: BASELINE_SETS, reps: BASELINE_REPS, weight: basisGewicht, status: 'nieuw' };
  }

  const prevSets   = Number(vorigeSessie.sets);
  const prevReps   = Number(vorigeSessie.reps);
  const prevWeight = Number(vorigeSessie.weight);

  if (prevSets >= DOEL_SETS && prevReps >= 10) {
    return { sets: DOEL_SETS, reps: 8, weight: prevWeight + GEWICHT_STAP, status: 'progressie' };
  }
  if (prevSets >= DOEL_SETS && (prevReps === 8 || prevReps === 9)) {
    return { sets: DOEL_SETS, reps: 10, weight: prevWeight, status: 'houden' };
  }
  return { sets: DOEL_SETS, reps: 10, weight: Math.max(0, prevWeight - GEWICHT_STAP), status: 'deload' };
}

/** Leesbare statusbeschrijving */
export function getStatusLabel(status: Voorschrift['status']): string {
  const labels: Record<Voorschrift['status'], string> = {
    nieuw:      'Eerste sessie – begin met startgewicht',
    progressie: 'Geweldig! Gewicht omhoog',
    houden:     'Goed bezig! Meer herhalingen doen',
    deload:     'Even terugschakelen, gewicht omlaag',
  };
  return labels[status];
}
