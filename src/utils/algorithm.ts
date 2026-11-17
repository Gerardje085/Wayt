// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Progressive Overload Algoritme (TypeScript)
// ─────────────────────────────────────────────────────────────────────────────
import type { Workout, Voorschrift } from '../types';
import { findExercise } from '../data/exercises';
import { berekenVolume, berekenArbeid } from './physics';

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
    return {
      sets: BASELINE_SETS,
      reps: BASELINE_REPS,
      weight: basisGewicht,
      status: 'nieuw',
      rationale: `Eerste sessie voor deze oefening. Startgewicht: ${basisGewicht} kg bij ${BASELINE_SETS}×${BASELINE_REPS} reps.`,
    };
  }

  const prevSets   = Number(vorigeSessie.sets);
  const prevReps   = Number(vorigeSessie.reps);
  const prevWeight = Number(vorigeSessie.weight);

  if (prevSets >= DOEL_SETS && prevReps >= 10) {
    const nieuwGewicht = prevWeight + GEWICHT_STAP;
    return {
      sets: DOEL_SETS,
      reps: 8,
      weight: nieuwGewicht,
      status: 'progressie',
      rationale: `Vorige sessie: ${prevSets}×${prevReps} @ ${prevWeight} kg — doelstelling gehaald! Gewicht omhoog naar ${nieuwGewicht} kg, doelstelling: ${DOEL_SETS}×8 reps.`,
    };
  }
  if (prevSets >= DOEL_SETS && (prevReps === 8 || prevReps === 9)) {
    return {
      sets: DOEL_SETS,
      reps: 10,
      weight: prevWeight,
      status: 'houden',
      rationale: `Vorige sessie: ${prevSets}×${prevReps} @ ${prevWeight} kg — goed bezig! Zelfde gewicht, doelstelling: ${DOEL_SETS}×10 reps voor volgende progressie.`,
    };
  }
  const nieuwGewicht = Math.max(0, prevWeight - GEWICHT_STAP);
  return {
    sets: DOEL_SETS,
    reps: 10,
    weight: nieuwGewicht,
    status: 'deload',
    rationale: `Vorige sessie: ${prevSets}×${prevReps} @ ${prevWeight} kg — minder dan doel. Gewicht verlaagd naar ${nieuwGewicht} kg voor herstel (deload).`,
  };
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

// ─────────────────────────────────────────────────────────────────────────────
// Simulatie – projecteer het algoritme vooruit over meerdere sessies
// ─────────────────────────────────────────────────────────────────────────────

export type SimulatieScenario = 'optimaal' | 'realistisch' | 'vermoeidheid';

export interface SimulatieSessie {
  sessie: number;
  gewicht: number;
  reps: number;
  sets: number;
  volume: number;
  arbeid: number;
  geschatte1RM: number;
  status: Voorschrift['status'];
}

/**
 * Simuleert het progressive-overload traject over N sessies.
 *
 * Scenario's (deterministisch, geen Math.random):
 *   optimaal      – haalt altijd het maximum; na progressie direct 10 reps
 *   realistisch   – na progressie: sessie 1→8, sessie 2→9, sessie 3→10
 *   vermoeidheid  – sessie 5 en 9 altijd 7 reps (triggert deload), rest = realistisch
 */
export function simuleerAlgoritmeTraject(
  startGewicht: number,
  oefeningId: string,
  aantalSessies: number = 12,
  scenario: SimulatieScenario,
  aangepasteSlaglengte?: number,
): SimulatieSessie[] {
  const resultaat: SimulatieSessie[] = [];
  const SETS = 3;

  let huidigGewicht = startGewicht;
  let huidigeReps = 10;

  // Counters voor deterministische variatie in 'realistisch' / 'vermoeidheid'
  let progressieTeller = 0;
  let houdenTeller = 0;

  for (let i = 1; i <= aantalSessies; i++) {
    // --- 1. Bepaal voorschrift via bestaand algoritme --------------------
    let voorschrift: Voorschrift;
    if (i === 1) {
      voorschrift = {
        sets: SETS,
        reps: 10,
        weight: startGewicht,
        status: 'nieuw',
      };
    } else {
      const vorigeWorkout: Workout = {
        id: 0,
        user_id: '',
        date: '',
        exercise: oefeningId,
        sets: SETS,
        reps: huidigeReps,
        weight: huidigGewicht,
        volume: 0,
        work_joules: 0,
      };
      voorschrift = berekenVoorschrift(vorigeWorkout, oefeningId);
    }

    if (voorschrift.status === 'progressie') {
      progressieTeller++;
      houdenTeller = 0;
    }

    // --- 2. Bepaal wat de sporter daadwerkelijk haalt (scenario) --------
    const gehaaldGewicht = voorschrift.weight;
    let gehaaldReps: number;

    switch (scenario) {
      case 'optimaal':
        // Haalt elke sessie exact het doel: 10 -> +2.5kg naar 8 -> volgende sessie 10, etc.
        gehaaldReps = voorschrift.reps;
        break;

      case 'realistisch':
        if (voorschrift.status === 'progressie') {
          gehaaldReps = 8;
        } else if (voorschrift.status === 'houden') {
          houdenTeller++;
          // Soms 2 sessies op 8-9 reps nodig voordat 10 reps lukt
          const extraSessieNodig = progressieTeller % 2 === 1;
          gehaaldReps = extraSessieNodig && houdenTeller === 1 ? 9 : 10;
        } else {
          gehaaldReps = voorschrift.reps;
        }
        break;

      case 'vermoeidheid':
        if (i === 5 || i === 9) {
          // Vermoeidheid halverwege: < 8 reps → triggert deload (-2.5 kg) in volgende sessie
          gehaaldReps = 7;
        } else if (voorschrift.status === 'progressie') {
          gehaaldReps = 8;
        } else if (voorschrift.status === 'houden') {
          houdenTeller++;
          const extraSessieNodig = progressieTeller % 2 === 1;
          gehaaldReps = extraSessieNodig && houdenTeller === 1 ? 9 : 10;
        } else {
          gehaaldReps = voorschrift.reps;
        }
        break;
    }

    // --- 3. Bereken afgeleide waarden -----------------------------------
    const volume = berekenVolume(SETS, gehaaldReps, gehaaldGewicht);
    const arbeid = berekenArbeid(oefeningId, gehaaldReps, gehaaldGewicht, aangepasteSlaglengte) * SETS;
    const geschatte1RM = gehaaldGewicht * (1 + gehaaldReps / 30);

    resultaat.push({
      sessie: i,
      gewicht: gehaaldGewicht,
      reps: gehaaldReps,
      sets: SETS,
      volume,
      arbeid: Math.round(arbeid * 100) / 100,
      geschatte1RM: Math.round(geschatte1RM * 100) / 100,
      status: voorschrift.status,
    });

    // --- 4. Update state voor volgende iteratie -------------------------
    huidigGewicht = gehaaldGewicht;
    huidigeReps = gehaaldReps;
  }

  return resultaat;
}
