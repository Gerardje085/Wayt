// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Progressive Overload Algoritme (TypeScript)
// ─────────────────────────────────────────────────────────────────────────────
import type { Voorschrift } from '../types';
import { findExercise } from '../data/exercises';

export const DOEL_SETS    = 3;
const BASELINE_REPS       = 10;
const GEWICHT_STAP        = 2.5;

export interface SessieSet {
  reps:    number;
  gewicht: number;
}

/**
 * Berekent het voorschrift voor de volgende sessie op basis van de werksets
 * (geen warm-ups, geen 1RM-metingen) van de vorige sessie van deze oefening.
 *
 * Werkgewicht = het gewicht waarmee de meeste sets zijn gedaan (bij gelijkspel het hoogste).
 * Beoordeeld worden de beste 3 sets op dat werkgewicht.
 *
 * Regels:
 *   Geen data                    → 3×10 @ startgewicht
 *   3 sets, elk ≥10 reps         → gewicht +2,5 kg, doel: 3×8
 *   3 sets, laagste 8 of 9 reps  → zelfde gewicht, doel: 3×10
 *   Alles minder                 → gewicht −2,5 kg, doel: 3×10 (deload)
 */
export function bepaalVoorschrift(vorigeSets: SessieSet[], basisGewicht: number): Voorschrift {
  const werkSets = vorigeSets.filter(s => s.reps > 0 && s.gewicht >= 0);

  if (werkSets.length === 0) {
    return { sets: DOEL_SETS, reps: BASELINE_REPS, weight: basisGewicht, status: 'nieuw' };
  }

  const werkGewicht = bepaalWerkGewicht(werkSets);
  const besteReps = werkSets
    .filter(s => zelfdeGewicht(s.gewicht, werkGewicht))
    .map(s => s.reps)
    .sort((a, b) => b - a)
    .slice(0, DOEL_SETS);
  const laagsteReps = besteReps.length >= DOEL_SETS ? Math.min(...besteReps) : 0;

  if (laagsteReps >= 10) {
    return { sets: DOEL_SETS, reps: 8, weight: rond(werkGewicht + GEWICHT_STAP), status: 'progressie' };
  }
  if (laagsteReps >= 8) {
    return { sets: DOEL_SETS, reps: 10, weight: rond(werkGewicht), status: 'houden' };
  }
  return { sets: DOEL_SETS, reps: 10, weight: rond(Math.max(0, werkGewicht - GEWICHT_STAP)), status: 'deload' };
}

export function berekenVoorschrift(vorigeSets: SessieSet[], oefeningId: string): Voorschrift {
  const basisGewicht = findExercise(oefeningId)?.startWaarde ?? 30;
  return bepaalVoorschrift(vorigeSets, basisGewicht);
}

function bepaalWerkGewicht(sets: SessieSet[]): number {
  const telling = new Map<number, number>();
  for (const s of sets) {
    const sleutel = rond(s.gewicht);
    telling.set(sleutel, (telling.get(sleutel) ?? 0) + 1);
  }
  let beste = 0;
  let besteAantal = -1;
  for (const [gewicht, aantal] of telling) {
    if (aantal > besteAantal || (aantal === besteAantal && gewicht > beste)) {
      beste = gewicht;
      besteAantal = aantal;
    }
  }
  return beste;
}

function zelfdeGewicht(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

function rond(waarde: number): number {
  return Math.round(waarde * 100) / 100;
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
